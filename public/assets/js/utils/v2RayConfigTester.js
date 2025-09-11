class V2RayConfigTester {
    constructor(configs) {
        this.configs = configs;
        this.protocols = ["vmess", "vless", "trojan", "ss"];
        this.results = {};
    }

    getProtocol(config) {
        let split = config.split("://");
        return split[0] || "";
    }

    findIp(config) {
        try {
            let ipRegex = /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/;
            let match = config.match(ipRegex);
            return match ? match[0] : "";
        } catch {
            return "";
        }
    }

    async ping(ip) {
        const timeout = 3000;
        const url = `https://${ip}/generate_204`;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        let isReachable = false;
        const startTime = performance.now();

        try {
            await fetch(url, { signal: controller.signal });
            isReachable = true;
        } catch (error) {
            if (error.name !== "AbortError") {
                isReachable = true;
            }
        }

        clearTimeout(timeoutId);
        const duration = performance.now() - startTime;
        return isReachable ? Math.floor(duration / 5) : null;
    }

    async testAll() {
        for (let config of this.configs) {
            let protocol = this.getProtocol(config);
            if (!this.protocols.includes(protocol)) {
                this.results[config] = { error: "Invalid protocol" };
                continue;
            }

            let ip = this.findIp(config);
            if (!ip) {
                ip = this.findIp(atob(config.toString().split("://")[1]));
                if (!ip) {
                    this.results[config] = { error: "IP not found" };
                    continue;
                }
            }

            let pingTime = await this.ping(ip);
            this.results[config] = pingTime !== null
                ? { ip, ping: pingTime + " ms" }
                : { ip, error: "No ping response" };
        }
        return this.results;
    }

    async test(config) {
        let protocol = this.getProtocol(config);
        if (!this.protocols.includes(protocol)) {
            this.results[config] = { error: "Invalid protocol" };
            return "x";
        }

        let ip = this.findIp(config);
        if (!ip) {
            ip = this.findIp(atob(config.toString().split("://")[1]));
            if (!ip) {
                this.results[config] = { error: "IP not found" };
                return "x";
            }
        }

        let pingTime = await this.ping(ip);

        return pingTime !== null
        ? pingTime + "ms" 
        :  "x";
    }

    async updateConfigPing(config, index) {
        const element = document.querySelector(`#conf${index}`);
        try {
            let res = await this.test(config);
            if (res!=="x"){
                element.classList.remove("warning");
                element.classList.add("success");
            }else{
                element.classList.remove("warning");
                element.classList.add("danger");
            }
            element.textContent = `${res.toString()}`;
        } catch (error) {
            element.classList.remove("warning");
            element.classList.add("danger");
            element.textContent = 'x';
        }
    }
}

const tester = new V2RayConfigTester([]);