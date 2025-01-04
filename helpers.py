import re

from bs4 import BeautifulSoup


def get_text(soup: BeautifulSoup, css: str):
    element = soup.select_one(css)

    return element.text if element else ""


def minify(text: str):
    return re.sub(r"[^a-z]+", " ", text.lower()).strip()


def decimal(fraction_str: str):
    # Map Unicode fractions to their float equivalents
    fraction_map = {
        "¼": 0.25,  # ¼
        "½": 0.5,  # ½
        "¾": 0.75,  # ¾
        "⅐": 0.1428571428,  # ⅐
        "⅑": 0.1111111111,  # ⅑
        "⅒": 0.1,  # ⅒
        "⅓": 0.3333333333,  # ⅓
        "⅔": 0.6666666666,  # ⅔
        "⅕": 0.2,  # ⅕
        "⅖": 0.4,  # ⅖
        "⅗": 0.6,  # ⅗
        "⅘": 0.8,  # ⅘
        "⅙": 0.1666666666,  # ⅙
        "⅚": 0.8333333333,  # ⅚
        "⅛": 0.125,  # ⅛
        "⅜": 0.375,  # ⅜
        "⅝": 0.625,  # ⅝
        "⅞": 0.875,  # ⅞
    }

    # Initialize result
    result = 0.0

    # Split integer and fraction parts
    integer_part = ""
    fraction_part = ""

    for char in fraction_str:
        if char.isdigit():
            integer_part += char
        elif char in fraction_map:
            fraction_part = char

    # Convert integer part to float
    if integer_part:
        result += float(integer_part)

    # Add fraction part
    if fraction_part in fraction_map:
        result += fraction_map[fraction_part]

    return result
