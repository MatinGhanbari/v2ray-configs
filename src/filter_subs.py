import base64

from contents.content_manager import ContentManager
from settings.setting import SETTINGS
from utils.utils import *


def filter_subs():
    content_manager = ContentManager()
    _, _, _, output_folder = ensure_directories_exist()

    protocols = SETTINGS['protocols'][:-1]
    protocol_data = {protocol: content_manager.get_filtered(protocol=protocol) for protocol in protocols}

    raw_repo = SETTINGS['raw_repo']
    out_dir = SETTINGS['out_dir']
    url = f"{raw_repo}/{out_dir}/v2ray/all_sub.txt"
    response = requests.get(url).text
    for config in response.splitlines():
        for protocol in protocols:
            if config.startswith(protocol):
                protocol_data[protocol] += config + "\n"
                break

    for protocol, data in protocol_data.items():
        file_path = os.path.join(output_folder, "subs", f"{protocol}.txt")
        encoded_data = base64.b64encode(data.encode("utf-8")).decode("utf-8")
        with open(file_path, "w+", encoding="utf-8") as file:
            file.write(encoded_data)


if __name__ == "__main__":
    filter_subs()
