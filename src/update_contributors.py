import requests
import json

url = "https://api.github.com/repos/MatinGhanbari/v2ray-configs/contributors?per_page=5&page=1"

def update_contributors():
    response = requests.get(url)
    if response.status_code == 200:
        contributors = response.json()
        for c in contributors:
            if c.get("id") == 85116522:
                contributors.remove(c)
                break
        output_file_path = r"public/assets/data/contributors.json"
        with open(output_file_path, 'w+', encoding="utf-8") as json_file:
            json.dump(contributors, json_file, indent=4)

if __name__ == "__main__":
    update_contributors()
