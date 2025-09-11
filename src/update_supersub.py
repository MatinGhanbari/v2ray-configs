import socket
import ssl
import base64
import json
import time

from contents.content_manager import ContentManager
from settings.setting import SETTINGS
from utils.utils import *

from concurrent.futures import ThreadPoolExecutor, as_completed

class V2RayPingTester:
    def __init__(self, configs, timeout=5, max_threads=100):
        self.configs = configs
        self.timeout = timeout
        self.max_threads = max_threads

    def parse_config(self, config):
        try:
            if config.startswith(('vmess://', 'vless://', 'trojan://', 'ss://')):
                raw = config.split('://')[1]
                if str(raw).count("#")==0:
                    decoded = base64.b64decode(raw + '==').decode('utf-8')
                else:
                    decoded = raw
                if decoded.startswith("{"):
                    json_data = json.loads(decoded)
                    host = json_data.get('add')
                    port = int(json_data.get('port', 443))
                    tls_enabled = json_data.get('tls') == 'tls'
                    return host, port, tls_enabled
                else:
                    host =(decoded.split(":")[0]).split("@")[1]
                    port = int((decoded.split(":")[1]).split("?")[0])
                    tls_enabled = True if decoded.lower().count("security=none")==0 else False
                    return host, port, tls_enabled
            return None
        except Exception as e:
            return None

    def test_single(self, config):
        parsed = self.parse_config(config)
        if not parsed:
            return {'config': config, 'status': 'invalid', 'ping': None}

        host, port, use_tls = parsed

        try:
            start_time = time.time()
            sock = socket.create_connection((host, port), timeout=self.timeout)
            if use_tls:
                context = ssl.create_default_context()
                sock = context.wrap_socket(sock, server_hostname=host)
            sock.close()
            end_time = time.time()
            ping_ms = int((end_time - start_time) * 1000)
            return {'config': config, 'status': 'reachable', 'ping': ping_ms}
        except Exception as e:
            pass
            return {'config': config, 'status': 'unreachable', 'ping': None}

    def test_all(self):
        results = []
        with ThreadPoolExecutor(max_workers=self.max_threads) as executor:
            futures = [executor.submit(self.test_single, config) for config in self.configs]
            for future in as_completed(futures):
                result = future.result()
                if result['status'] == 'reachable' and result['ping'] != None:
                    results.append(result)

        sorted_results = sorted(results, key=lambda x: x['ping'] if x['ping'] is not None else float('inf'))
        return sorted_results


def make_super_sub():
    content_manager = ContentManager()
    output_folder, _, _, _ = ensure_directories_exist()

    raw_repo = SETTINGS['raw_repo']
    out_dir = SETTINGS['out_dir']
    sub_links = [
        f"{raw_repo}/{out_dir}/v2ray/all_sub.txt",
    ]

    configs = []
    for url in sub_links:
        response = requests.get(url).text
        if not response.startswith("#"):
            response = base64.b64decode(response).decode('utf-8')
        configs = response.splitlines()[5:]

        tester = V2RayPingTester(configs)
        results = tester.test_all()
        for res in results:
            configs.append(res['config'])

    configs = configs[:int(SETTINGS['supersub_configs_limit'])]
    data = content_manager.get_v2ray_supersub() + "\n".join(configs)

    file_path = os.path.join(output_folder, "super-sub.txt")
    encoded_data = base64.b64encode(data.encode("utf-8")).decode("utf-8")
    with open(file_path, "w+", encoding="utf-8") as f:
            f.write(data)


if __name__ == '__main__':
    make_super_sub()