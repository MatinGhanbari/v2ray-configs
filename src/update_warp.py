from contents.content_manager import ContentManager
from settings.setting import SETTINGS
from utils.utils import *


def update_warp():
    content_manager = ContentManager()
    _, _, warp_folder, _ = ensure_directories_exist()
    output_filename = os.path.join(warp_folder, "all_sub.txt")

    warp_links = fp_warp_links(SETTINGS['sources']['warp'])

    with open(output_filename, 'w+', encoding="utf-8") as f:
        f.write(content_manager.get_warp() + '\n'.join(warp_links))

    return None


if __name__ == "__main__":
    update_warp()
