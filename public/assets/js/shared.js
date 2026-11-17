contributors_url =
  "https://raw.githubusercontent.com/MatinGhanbari/v2ray-configs/refs/heads/main/public/assets/data/contributors.json";

configLines = [];

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

function toast(msg, icon = "bx-check-circle") {
  let t = document.getElementById("toast");
  if (!t) {
    t = document.createElement("div");
    t.id = "toast";
    t.className = "toast";
    document.body.appendChild(t);
  }
  t.innerHTML = `<i class="bx ${icon}"></i> <span></span>`;
  t.lastElementChild.textContent = msg;
  t.classList.add("show");
  clearTimeout(toast._t);
  toast._t = setTimeout(() => t.classList.remove("show"), 1800);
}

function copyText(text) {
  const done = () => toast("Copied to clipboard");
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text).then(done, () => legacyCopy(text, done));
  } else {
    legacyCopy(text, done);
  }
}

function legacyCopy(text, cb) {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  document.body.appendChild(textarea);
  textarea.select();
  textarea.setSelectionRange(0, 99999999);
  document.execCommand("copy");
  document.body.removeChild(textarea);
  cb && cb();
}

function escapeHtml(s) {
  return String(s).replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
  );
}

function shuffle(array, shuffleCount = 1) {
  for (let index = 0; index < shuffleCount; index++) {
    let currentIndex = array.length;
    while (currentIndex != 0) {
      let randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;
      [array[currentIndex], array[randomIndex]] = [
        array[randomIndex],
        array[currentIndex],
      ];
    }
  }
}

function hash(string, len = 8) {
  return string
    .split("")
    .reduce((hash, char) => {
      return char.charCodeAt(0) + (hash << 6) + (hash << 16) - hash;
    }, 0)
    .toString()
    .substring(1, len + 1);
}

function isMobileDevice() {
  return window.innerWidth <= 768;
}

/* ------------------------------------------------------------------ */
/*  Theme (dark / light)                                              */
/* ------------------------------------------------------------------ */

function applyTheme(dark) {
  document.documentElement.classList.toggle("dark-theme-variables", dark);
  const t = document.getElementById("theme-toggle");
  if (t) {
    t.querySelector(".bx-sun").classList.toggle("active", !dark);
    t.querySelector(".bx-moon").classList.toggle("active", dark);
  }
  try {
    localStorage.setItem("theme", dark ? "dark" : "light");
  } catch (e) {}
}

(function initTheme() {
  const t = document.getElementById("theme-toggle");
  if (!t) return;
  applyTheme(document.documentElement.classList.contains("dark-theme-variables"));
  t.addEventListener("click", () =>
    applyTheme(!document.documentElement.classList.contains("dark-theme-variables"))
  );
})();

/* ------------------------------------------------------------------ */
/*  Config list state + filters                                       */
/* ------------------------------------------------------------------ */

const PAGE_SIZE = 50;
const TEST_CAP = 300;

const state = {
  items: [], // {raw, info, ping, score}
  view: [], // filtered + sorted
  shown: PAGE_SIZE,
  testing: false,
  f: {
    q: "",
    protocol: "all",
    status: "all", // all | alive | dead | untested
    security: "all",
    network: "all",
    maxPing: 0, // 0 = any
    sort: "best", // best | ping | random
  },
};

function itemScore(it) {
  if (it.ping === undefined) return 0; // untested
  return tester.score(it.info, it.ping);
}

function applyFilters(resetShown = true) {
  const f = state.f;
  const q = f.q.trim().toLowerCase();

  let list = state.items.filter((it) => {
    const i = it.info;
    if (f.protocol !== "all" && i.protocol !== f.protocol) return false;
    if (f.security !== "all" && i.security !== f.security) return false;
    if (f.network !== "all" && i.network !== f.network) return false;
    if (q && !(`${i.name} ${i.host} ${i.sni} ${i.port}`.toLowerCase().includes(q)))
      return false;

    if (f.status === "alive" && !(typeof it.ping === "number")) return false;
    if (f.status === "dead" && it.ping !== null) return false;
    if (f.status === "untested" && it.ping !== undefined) return false;
    if (f.maxPing && !(typeof it.ping === "number" && it.ping <= f.maxPing))
      return false;
    return true;
  });

  if (f.sort === "best") {
    list = list
      .map((it) => [it, itemScore(it)])
      .sort((a, b) => b[1] - a[1] || a[0].order - b[0].order)
      .map((x) => x[0]);
  } else if (f.sort === "ping") {
    const val = (it) => (typeof it.ping === "number" ? it.ping : 1e9);
    list.sort((a, b) => val(a) - val(b) || a.order - b.order);
  } else {
    list.sort((a, b) => a.order - b.order);
  }

  state.view = list;
  if (resetShown) state.shown = PAGE_SIZE;
  renderRows();
  renderStats();
}

function statusCellHtml(it) {
  if (it.ping === undefined)
    return `<span class="text-muted" title="Not tested yet"><i class="bx bx-help-circle"></i></span>`;
  if (it.ping === null)
    return `<span class="danger" title="Dead"><i class="bx bxs-x-circle"></i></span>`;
  const cls = it.ping <= 600 ? "success" : "warning";
  return `<span class="${cls} ping"><i class="bx bx-wifi"></i> ${it.ping} ms</span>`;
}

function updateStatusCell(it) {
  const el = document.getElementById(`conf${it.id}`);
  if (el) el.innerHTML = statusCellHtml(it);
}

function renderRows() {
  const tbody = document.querySelector("tbody");
  if (!tbody) return;
  const mobile = isMobileDevice();
  const slice = state.view.slice(0, state.shown);

  if (!slice.length) {
    tbody.innerHTML = `<tr><td colspan="5" class="empty-row"><i class="bx bx-search-alt"></i> No configs match these filters</td></tr>`;
  } else {
    tbody.innerHTML = slice
      .map((it, n) => {
        const i = it.info;
        const title = escapeHtml(i.name || `${i.host}`);
        const tags = [i.network, i.security !== "none" ? i.security : "", i.port]
          .filter(Boolean)
          .map((t) => `<span class="tag">${escapeHtml(t)}</span>`)
          .join("");
        const cfg = `<div class="cfg-wrap">
            <div class="cfg-main">
              <div class="cfg-name" title="${title}">${title}</div>
              <div class="cfg-host">${escapeHtml(i.host)}:${i.port}</div>
            </div>
            <div class="cfg-tags">${tags}</div>
          </div>`;
        return `<tr>
          <td>${n + 1}</td>
          <td>${i.protocol}</td>
          <td class="cfg-cell">${cfg}</td>
          <td id="conf${it.id}">${statusCellHtml(it)}</td>
          <td class="primary clickable copy-btn" data-id="${it.id}" title="Copy config"><i class="bx bx-copy"></i></td>
        </tr>`;
      })
      .join("");
  }

  const foot = document.getElementById("show-more");
  if (foot) {
    const total = state.view.length;
    const shown = slice.length;
    const left = total - shown;
    foot.style.display = total ? "flex" : "none";
    document.getElementById("tf-count").innerHTML =
      `<b>${shown}</b> of <b>${total}</b> shown`;
    document.getElementById("tf-fill").style.width =
      total ? `${Math.round((shown / total) * 100)}%` : "0%";
    const actions = document.getElementById("tf-actions");
    actions.style.display = left > 0 ? "flex" : "none";
    document.getElementById("tf-more").innerHTML =
      `<i class="bx bx-plus"></i> ${Math.min(PAGE_SIZE, left)} more`;
    document.getElementById("tf-all").style.display = left > PAGE_SIZE ? "inline-flex" : "none";
  }
}

function renderStats() {
  const alive = state.items.filter((it) => typeof it.ping === "number").length;
  const dead = state.items.filter((it) => it.ping === null).length;
  const el = document.getElementById("f-stats");
  if (el)
    el.innerHTML = `<span><i class="bx bx-list-ul"></i> Showing <b>${state.view.length}</b> of ${state.items.length}</span>
      <span class="success"><i class="bx bxs-check-circle"></i> ${alive} alive</span>
      <span class="danger"><i class="bx bxs-x-circle"></i> ${dead} dead</span>`;
  const total = document.querySelector(".total-count");
  if (total)
    total.innerHTML = `<div style="font-size: x-small; display: inline">(${state.view.length}/${state.items.length})</div>`;
}

/* ---------- testing ---------- */

function setProgress(done, total) {
  const bar = document.getElementById("f-progress");
  const btn = document.getElementById("f-test");
  if (!bar || !btn) return;
  if (total && done < total) {
    bar.style.display = "block";
    bar.firstElementChild.style.width = `${Math.round((done / total) * 100)}%`;
    btn.innerHTML = `<i class="bx bx-stop-circle"></i> Stop (${done}/${total})`;
  } else {
    bar.style.display = "none";
    btn.innerHTML = `<i class="bx bx-pulse"></i> Test visible`;
  }
}

async function runTests(items, resortAtEnd = true) {
  if (state.testing) return;
  const pending = items.filter((it) => it.ping === undefined);
  if (!pending.length) return;
  state.testing = true;
  setProgress(0, pending.length);
  const finished = await tester.testItems(
    pending,
    (it) => updateStatusCell(it),
    (d, t) => setProgress(d, t)
  );
  state.testing = false;
  setProgress(1, 1);
  renderStats();
  if (resortAtEnd) applyFilters(false);
}

function toggleTest() {
  if (state.testing) {
    tester.cancel();
    state.testing = false;
    setProgress(1, 1);
    applyFilters(false);
    return;
  }
  runTests(state.view.slice(0, TEST_CAP));
}

function findBest() {
  // best = alive, sorted by score; test a capped sample first if nothing tested yet
  state.f.status = "alive";
  state.f.sort = "best";
  syncToolbar();
  applyFilters();
  const untested = state.items.filter((it) => it.ping === undefined);
  const sample = untested.slice(0, TEST_CAP);
  runTests(sample).then(() => {
    state.f.status = "alive";
    applyFilters();
    toast(`Best configs ready (${state.view.length} alive)`, "bxs-star");
  });
}

/* ---------- toolbar ---------- */

function buildToolbar() {
  if (document.getElementById("toolbar")) return;
  const table = document.querySelector("main table");
  if (!table) return;

  const tb = document.createElement("div");
  tb.id = "toolbar";
  tb.className = "toolbar";
  tb.innerHTML = `
    <div class="tb-row">
      <div class="search-box">
        <i class="bx bx-search"></i>
        <input id="f-q" type="search" placeholder="Search name / host / port" />
      </div>
      <button id="f-best" class="btn primary-btn" title="Test and show the best working configs"><i class="bx bxs-star"></i> Find best</button>
      <button id="f-test" class="btn"><i class="bx bx-pulse"></i> Test visible</button>
      <button id="f-copy" class="btn"><i class="bx bx-copy-alt"></i> Copy filtered</button>
    </div>
    <div class="tb-row">
      <div class="chips" id="f-protocols"></div>
      <select id="f-status" title="Status">
        <option value="all">Status: all</option>
        <option value="alive">Alive only</option>
        <option value="dead">Dead</option>
        <option value="untested">Untested</option>
      </select>
      <select id="f-security" title="Security">
        <option value="all">Security: any</option>
        <option value="reality">Reality</option>
        <option value="tls">TLS</option>
        <option value="none">None</option>
      </select>
      <select id="f-network" title="Transport">
        <option value="all">Transport: any</option>
        <option value="tcp">tcp</option>
        <option value="ws">ws</option>
        <option value="grpc">grpc</option>
        <option value="xhttp">xhttp</option>
        <option value="httpupgrade">httpupgrade</option>
      </select>
      <select id="f-maxping" title="Max ping">
        <option value="0">Ping: any</option>
        <option value="300">≤ 300 ms</option>
        <option value="500">≤ 500 ms</option>
        <option value="800">≤ 800 ms</option>
        <option value="1200">≤ 1200 ms</option>
      </select>
      <select id="f-sort" title="Sort">
        <option value="best">Sort: best</option>
        <option value="ping">Sort: lowest ping</option>
        <option value="random">Sort: original</option>
      </select>
      <button id="f-reset" class="btn"><i class="bx bx-reset"></i> Reset</button>
    </div>
    <div class="tb-row tb-stats"><span id="f-stats"></span></div>
    <div id="f-progress" class="progress"><div></div></div>
  `;
  table.parentNode.insertBefore(tb, table);

  // card (background, radius, shadow) > scroller (table only) + footer (show more)
  const card = document.createElement("div");
  card.className = "table-card";
  document.querySelector("main").classList.add("fill");
  table.parentNode.insertBefore(card, table);
  const scroller = document.createElement("div");
  scroller.className = "table-scroll";
  card.appendChild(scroller);
  scroller.appendChild(table);

  // "show more" button replaces the old "Show All" toggle
  if (show_all) show_all.style.display = "none";
  const foot = document.createElement("div");
  foot.id = "show-more";
  foot.className = "table-footer";
  foot.innerHTML = `
    <div class="tf-info">
      <span id="tf-count"></span>
      <div class="tf-bar"><div id="tf-fill"></div></div>
    </div>
    <div class="tf-actions" id="tf-actions">
      <button id="tf-more" class="btn primary-btn"></button>
      <button id="tf-all" class="btn" title="Show every remaining config"><i class="bx bx-chevrons-down"></i> Show all</button>
    </div>`;
  card.appendChild(foot);
  foot.querySelector("#tf-more").addEventListener("click", () => {
    state.shown += PAGE_SIZE;
    renderRows();
    runTests(state.view.slice(state.shown - PAGE_SIZE, state.shown), false);
  });
  foot.querySelector("#tf-all").addEventListener("click", () => {
    state.shown = state.view.length;
    renderRows();
  });

  const $ = (id) => document.getElementById(id);
  let debounce;
  $("f-q").addEventListener("input", (e) => {
    clearTimeout(debounce);
    debounce = setTimeout(() => {
      state.f.q = e.target.value;
      applyFilters();
    }, 150);
  });
  const bind = (id, key, num) =>
    $(id).addEventListener("change", (e) => {
      state.f[key] = num ? Number(e.target.value) : e.target.value;
      applyFilters();
    });
  bind("f-status", "status");
  bind("f-security", "security");
  bind("f-network", "network");
  bind("f-maxping", "maxPing", true);
  bind("f-sort", "sort");
  $("f-test").addEventListener("click", toggleTest);
  $("f-best").addEventListener("click", findBest);
  $("f-copy").addEventListener("click", () => {
    if (!state.view.length) return toast("Nothing to copy", "bx-info-circle");
    copyText(state.view.map((it) => it.raw).join("\n"));
  });
  $("f-reset").addEventListener("click", () => {
    state.f = { q: "", protocol: "all", status: "all", security: "all", network: "all", maxPing: 0, sort: "best" };
    syncToolbar();
    applyFilters();
  });

  // protocol chips + row copy (event delegation)
  $("f-protocols").addEventListener("click", (e) => {
    const c = e.target.closest(".chip");
    if (!c) return;
    state.f.protocol = c.dataset.p;
    syncToolbar();
    applyFilters();
  });
  document.querySelector("tbody").addEventListener("click", (e) => {
    const b = e.target.closest(".copy-btn");
    if (b) copyText(state.items[b.dataset.id].raw);
  });
}

function syncToolbar() {
  const $ = (id) => document.getElementById(id);
  if (!$("toolbar")) return;
  $("f-q").value = state.f.q;
  $("f-status").value = state.f.status;
  $("f-security").value = state.f.security;
  $("f-network").value = state.f.network;
  $("f-maxping").value = String(state.f.maxPing);
  $("f-sort").value = state.f.sort;

  const counts = {};
  state.items.forEach((it) => (counts[it.info.protocol] = (counts[it.info.protocol] || 0) + 1));
  const protos = Object.keys(counts);
  const box = $("f-protocols");
  if (protos.length <= 1) {
    box.style.display = "none";
  } else {
    box.style.display = "flex";
    box.innerHTML =
      `<span class="chip ${state.f.protocol === "all" ? "active" : ""}" data-p="all">All</span>` +
      protos
        .map(
          (p) =>
            `<span class="chip ${state.f.protocol === p ? "active" : ""}" data-p="${p}">${p} <small>${counts[p]}</small></span>`
        )
        .join("");
  }
}

/* ---------- loading ---------- */

function show_all_configs() {
  // kept for backwards compatibility with the per-page scripts
  state.shown = state.view.length;
  renderRows();
}

function get_configs(isBase64 = false) {
  tester.cancel();
  state.testing = false;
  buildToolbar();

  const tbody = document.querySelector("tbody");
  tbody.innerHTML = `<tr><td colspan="5" class="empty-row"><i class="bx bx-loader-alt bx-spin"></i> Loading</td></tr>`;
  if (isMobileDevice()) document.getElementsByTagName("th")[2].innerHTML = "Config";

  fetch(sub_url, { cache: "no-store" })
    .then((r) => r.text())
    .then((text) => {
      const decoded = isBase64 ? tester.safeAtob(text) : text;
      const lines = decoded.split(/\r?\n/).map((l) => l.trim());
      const seen = new Set();
      const items = [];
      for (const raw of lines) {
        if (!raw || raw.startsWith("#") || seen.has(raw)) continue;
        const info = tester.parse(raw);
        if (!info) continue;
        seen.add(raw);
        items.push({ raw, info, ping: undefined });
      }
      shuffle(items, 2);
      items.forEach((it, i) => {
        it.id = i;
        it.order = i;
      });
      state.items = items;
      configLines = items.map((it) => it.raw);

      syncToolbar();
      applyFilters();
      // auto-test the first page so the user sees live statuses immediately
      runTests(state.view.slice(0, PAGE_SIZE), false);
    })
    .catch(() => {
      tbody.innerHTML = `<tr><td colspan="5" class="empty-row danger"><i class="bx bx-error-circle"></i> Failed to load configs</td></tr>`;
    });
}

// Rest of the code remains the same...
function get_contributors() {
  const contributors = document.querySelector("#contributors");
  var x = "";
  fetch(contributors_url)
    .then((response) => response.json())
    .then((data) => {
      contrib_list = data;
      if (contrib_list.length > 3) {
        contrib_list = data.slice(0, 3);
      }
      data.forEach((contributor, index) => {
        x += `
        <div class="item online">
          <a href="${contributor.html_url}" target="_blank">
          <img
            src="${contributor.avatar_url}"
            onerror="this.onerror=null;this.src='data:image/svg+xml;utf8,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 64 64%27%3E%3Crect width=%2764%27 height=%2764%27 rx=%2732%27 fill=%27%2324292f%27/%3E%3Cg transform=%27translate(10 10) scale(2.75)%27 fill=%27%23fff%27%3E%3Cpath d=%27M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z%27/%3E%3C/g%3E%3C/svg%3E'"

            alt="${contributor.login}"
            style="width: 3rem; border-radius: 20%"
          />
          </a>
          <div class="right">
            <div class="info">
              <h3><a href="${contributor.html_url}" target="_blank">${contributor.login}</a></h3>
              <small class="text-muted">Contributions: ${contributor.contributions}</small>
            </div>
          </div>
        </div>
        `;
      });

      contributors.innerHTML = x;
    })
    .catch((error) => {
      // console.error(error);
    });
}

//SIDE BAR FUNCTION
const sideMenu = document.querySelector("aside");
const menuBtn = document.querySelector("#menu-btn");
const closeBtn = document.querySelector("#close-btn");
const refresh_btn = document.querySelector("#refresh-list");
const refresh_i = document.querySelector("#refresh-i");
const show_all = document.querySelector("#show_all");
const scroll_bottom = document.querySelector("#scroll-to-bottom");

//show sidebar
menuBtn.addEventListener("click", function () {
  sideMenu.style.display = "block";
});

//hide sidebar
closeBtn.addEventListener("click", function () {
  sideMenu.style.display = "none";
});

scroll_bottom.addEventListener("click", function () {
  window.scrollTo({
    top: document.body.scrollHeight,
    behavior: "smooth",
  });
});
