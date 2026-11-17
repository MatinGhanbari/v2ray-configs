/*
 * V2Ray config parser + latency tester.
 *
 * NOTE: a browser cannot open raw TCP sockets or run a real proxy handshake, so the
 * "ping" here is an estimate: the time a TLS connection attempt to host:port takes
 * (fetch with mode "no-cors"). A rejected fetch (timeout, DNS failure, reset, TLS
 * error) counts as dead; a resolved fetch counts as reachable. It is good for
 * sorting/filtering, not a guarantee that the config really works.
 */
class V2RayConfigTester {
  constructor(configs = []) {
    this.configs = configs;
    this.protocols = ["vmess", "vless", "trojan", "ss"];
    this.cache = new Map(); // "host:port" -> Promise<number|null>
    this.timeout = 3000;
    this.concurrency = 8;
    this._token = 0;
  }

  /* ---------- parsing ---------- */

  safeAtob(str) {
    try {
      let s = String(str).trim().replace(/-/g, "+").replace(/_/g, "/");
      while (s.length % 4) s += "=";
      return decodeURIComponent(escape(atob(s)));
    } catch {
      try {
        return atob(str);
      } catch {
        return "";
      }
    }
  }

  getProtocol(config) {
    const i = config.indexOf("://");
    return i > 0 ? config.substring(0, i).toLowerCase() : "";
  }

  /** Returns {protocol, host, port, network, security, sni, name} or null. */
  parse(config) {
    config = (config || "").trim();
    const protocol = this.getProtocol(config);
    if (!this.protocols.includes(protocol)) return null;
    const out = {
      protocol,
      host: "",
      port: 443,
      network: "tcp",
      security: "none",
      sni: "",
      name: "",
    };
    try {
      if (protocol === "vmess") {
        const j = JSON.parse(this.safeAtob(config.slice(8).split("#")[0]));
        out.host = j.add || "";
        out.port = parseInt(j.port) || 443;
        out.network = j.net || "tcp";
        out.security = j.tls === "tls" ? "tls" : "none";
        out.sni = j.sni || j.host || "";
        out.name = j.ps || "";
      } else {
        let rest = config.slice(protocol.length + 3);
        const hashIdx = rest.indexOf("#");
        if (hashIdx >= 0) {
          out.name = decodeURIComponent(rest.slice(hashIdx + 1));
          rest = rest.slice(0, hashIdx);
        }
        if (protocol === "ss" && !rest.includes("@")) {
          // fully base64: method:pass@host:port
          rest = this.safeAtob(rest.split("?")[0]);
        }
        const u = new URL("http://" + rest.replace(/^[^@]*@/, (m) => "x@"));
        out.host = u.hostname.replace(/^\[|\]$/g, "");
        out.port = parseInt(u.port) || 443;
        const p = u.searchParams;
        out.network = p.get("type") || "tcp";
        out.security =
          p.get("security") || (protocol === "trojan" ? "tls" : "none");
        out.sni = p.get("sni") || p.get("host") || "";
      }
    } catch {
      return null;
    }
    return out.host ? out : null;
  }

  /* ---------- scoring ---------- */

  /** Higher = better. Dead configs get -1. */
  score(info, ping) {
    if (ping == null) return -1;
    let s = 1000 - Math.min(ping, 1000); // lower ping, higher score
    if (info.security === "reality") s += 150;
    else if (info.security === "tls") s += 100;
    if (info.port === 443) s += 60;
    if (info.network === "ws" || info.network === "grpc") s += 30;
    return s;
  }

  /* ---------- pinging ---------- */

  async _once(host, port) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeout);
    const start = performance.now();
    try {
      await fetch(`https://${host}:${port}/generate_204`, {
        mode: "no-cors",
        cache: "no-store",
        signal: controller.signal,
      });
    } catch {
      // Any rejection means we could not reach host:port: timeout (AbortError),
      // DNS failure (ERR_NAME_NOT_RESOLVED), connection reset, TLS error.
      // A rejected fetch never tells us *why*, so treat it as dead — a dead host
      // must never be reported as alive, or "Find best" ranks it first.
      clearTimeout(timer);
      return null;
    }
    clearTimeout(timer);
    return performance.now() - start;
  }

  /** Two attempts, keep the smaller (first one includes DNS + handshake cost). */
  async ping(host, port) {
    const key = `${host}:${port}`;
    if (!this.cache.has(key)) {
      this.cache.set(
        key,
        (async () => {
          const a = await this._once(host, port);
          if (a == null) return null;
          const b = await this._once(host, port);
          return Math.round(Math.min(a, b == null ? a : b));
        })()
      );
    }
    return this.cache.get(key);
  }

  /**
   * Tests items ({info}) with a worker pool.
   * onResult(item, ping) is called as each finishes; returns when all done or cancelled.
   */
  async testItems(items, onResult, onProgress) {
    const token = ++this._token;
    const queue = items.filter((it) => it.info && it.ping === undefined);
    let done = 0;
    const total = queue.length;
    const worker = async () => {
      while (queue.length && token === this._token) {
        const it = queue.shift();
        const ping = await this.ping(it.info.host, it.info.port);
        if (token !== this._token) return;
        it.ping = ping;
        done++;
        onResult && onResult(it, ping);
        onProgress && onProgress(done, total);
      }
    };
    await Promise.all(
      Array.from({ length: Math.min(this.concurrency, total) }, worker)
    );
    return token === this._token;
  }

  cancel() {
    this._token++;
  }
}

const tester = new V2RayConfigTester([]);
