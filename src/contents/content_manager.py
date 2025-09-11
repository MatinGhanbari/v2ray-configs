import base64


class ContentManager:
    def __init__(self):
        self.default_supersub_title = "4pm+77iPIGIybi5pci92MnJheS1jb25mIHwgU3VwZXJTdWI="

        self.default_v2ray_title = "8J+GkyBiMm4uaXIvdjJyYXktY29uZiB8IGFsbCDwn6aV"
        self.default_v2ray_sub_title = "4pu177iPIGIybi5pci92MnJheS1jb25mIHwgc3Vi"

        self.default_warp_title = "8J+XvSBiMm4uaXIvdjJyYXktY29uZiB8IHdhcnAg8J+MsQ=="

        self.filter_titles = {
            "vmess": "8J+QiCBiMm4uaXIvdjJyYXktY29uZiB8IHZtZXNzIPCfmI8=",
            "vless": "8J+mlSBiMm4uaXIvdjJyYXktY29uZiB8IHZsZXNzIPCfmI8=",
            "trojan": "8J+QjiBiMm4uaXIvdjJyYXktY29uZiB8IHRyb2phbiDwn5iP",
            "ss": "8J+QhSBiMm4uaXIvdjJyYXktY29uZiB8IHNzIPCfmI8=",
            "ssr": "8J+QhSBiMm4uaXIvdjJyYXktY29uZiB8IHNzciDwn5iP",
            "tuic": "8J+QsyBiMm4uaXIvdjJyYXktY29uZiB8IHR1aWMg8J+Yjw==",
            "hy2": "8J+mniBiMm4uaXIvdjJyYXktY29uZiB8IGh5MiDwn5iP"
        }

    @staticmethod
    def __get_file(file_path: str, title: str = None, default: str = None) -> str:
        with open(file_path, 'r', encoding="utf-8") as file:
            content = file.read()
            if title:
                content = content.replace('%TITLE%', base64.b64encode(title.encode()).decode())
            elif default:
                content = content.replace('%TITLE%', default)
        return content

    def get_warp(self, title: str = None) -> str:
        return self.__get_file(f'src/contents/fixed-warp',
                               title, self.default_warp_title)

    def get_filtered(self, title: str = None, protocol: str = None) -> str:
        return self.__get_file(f'src/contents/fixed-filtered',
                               title, self.filter_titles.get(protocol) if protocol else self.default_v2ray_title)

    def get_v2ray(self, title: str = None) -> str:
        return self.__get_file(f'src/contents/fixed-v2ray',
                               title, self.default_v2ray_title)
    
    def get_v2ray_supersub(self, title: str = None) -> str:
        return self.__get_file(f'src/contents/fixed-v2ray-supersub',
                               title, self.default_supersub_title)

    def get_v2ray_sub(self, sub_id: int) -> str:
        title = str(base64.b64decode(self.default_v2ray_sub_title).decode() + str(sub_id))
        return self.get_v2ray(title)
