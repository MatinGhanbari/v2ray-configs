import binascii
import os

import pybase64
import requests
from settings.setting import SETTINGS
import random

TIMEOUT = SETTINGS['timeout']

def shuffle_configs(configs, n=2):
    for _ in range(n):
        random.shuffle(configs)
    return configs

def decode_files_links(links):
    decoded_data = []
    for link in links:
        try:
            response = requests.get(f"https://raw.githubusercontent.com/{link}", timeout=TIMEOUT)
            encoded_bytes = response.content
            decoded_text = decode_base64(encoded_bytes)
            decoded_data.append(decoded_text)
        except requests.RequestException:
            pass
    return decoded_data


def decode_dirs_links(links):
    decoded_dir_links = []
    for link in links:
        try:
            response = requests.get(f"https://raw.githubusercontent.com/{link}", timeout=TIMEOUT)
            decoded_text = response.text
            decoded_dir_links.append(decoded_text)
        except requests.RequestException:
            pass
    return decoded_dir_links


def decode_base64(encoded):
    decoded = ""
    for encoding in ["utf-8", "iso-8859-1"]:
        try:
            decoded = pybase64.b64decode(encoded + b"=" * (-len(encoded) % 4)).decode(encoding)
            break
        except (UnicodeDecodeError, binascii.Error):
            pass
    return decoded


def filter_for_protocols(data, protocols):
    filtered_data = []
    for datum in data:
        for line in datum.split("\n"):
            if any(protocol in line for protocol in protocols):
                if line.count('#') == 1:
                    line = line[:line.index('#') + 1] + SETTINGS['tag'] + str(round((random.random())*1000))
                filtered_data.append(line)
    return filtered_data


def ensure_directories_exist():
    base_dir = os.path.abspath(os.path.join(os.getcwd(), SETTINGS['out_dir']))

    output_folder = os.path.join(base_dir, "v2ray")
    base64_folder = os.path.join(base_dir, "base64")
    warp_folder = os.path.join(base_dir, "warp")
    filtered_folder = os.path.join(base_dir, "filtered")

    os.makedirs(os.path.join(output_folder, "subs"), exist_ok=True)
    os.makedirs(os.path.join(base64_folder, "subs"), exist_ok=True)
    os.makedirs(os.path.join(warp_folder, "subs"), exist_ok=True)
    os.makedirs(os.path.join(filtered_folder, "subs"), exist_ok=True)

    return output_folder, base64_folder, warp_folder, filtered_folder


def fp_warp_links(links):
    warp_lines = []
    for link in links:
        response = requests.get(f"https://raw.githubusercontent.com/{link}")
        content = response.text
        for line in content.splitlines():
            if "warp://" in line:
                warp_lines.append(line)
    return warp_lines
