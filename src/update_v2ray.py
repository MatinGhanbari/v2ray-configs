import base64

from contents.content_manager import ContentManager
from settings.setting import SETTINGS
from utils.utils import *

def update_v2ray():
    content_manager = ContentManager()
    output_folder, base64_folder, _, _ = ensure_directories_exist()

    combined_data = decode_files_links(SETTINGS['sources']['files']) + decode_dirs_links(SETTINGS['sources']['dirs'])
    merged_configs = filter_for_protocols(combined_data, SETTINGS['protocols'])
    shuffled_configs = shuffle_configs(merged_configs, n=4)[:int(SETTINGS['all_configs_limit'])-1]

    output_filename = os.path.join(output_folder, "all_sub.txt")
    base64_filename = os.path.join(base64_folder, "all_sub.txt")

    with open(output_filename, "w+", encoding="utf-8") as f:
        f.write(content_manager.get_v2ray())
        for config in shuffled_configs:
            f.write(config + "\n")

    with open(output_filename, "r+", encoding="utf-8") as f:
        config_data = f.read()
        lines = f.readlines()

    with open(base64_filename, "w+", encoding="utf-8") as output_file:
        encoded_config = base64.b64encode(config_data.encode()).decode()
        output_file.write(encoded_config)

    lines_per_file = SETTINGS['lines_per_file']
    for i in range((len(lines) + lines_per_file - 1) // lines_per_file):
        custom_fixed_v2ray = content_manager.get_v2ray_sub(i + 1)

        input_filename = os.path.join(output_folder, "subs", f"sub{i + 1}.txt")
        with open(input_filename, "w+", encoding="utf-8") as f:
            f.write(custom_fixed_v2ray)
            start_index = i * lines_per_file if i != 0 else 5
            end_index = min((i + 1) * lines_per_file, len(lines))
            for line in lines[start_index:end_index]:
                f.write(line)

        with open(input_filename, "r+", encoding="utf-8") as input_file:
            config_data = input_file.read()

        output_filename = os.path.join(base64_folder, "subs", f"sub{i + 1}.txt")
        with open(output_filename, "w+", encoding="utf-8") as output_file:
            encoded_config = base64.b64encode(config_data.encode()).decode()
            output_file.write(encoded_config)

    return None


if __name__ == "__main__":
    update_v2ray()
