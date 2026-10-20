"""把霞鹜文楷裁剪成「GB2312 + ASCII + 常用标点」子集，输出 woff2。

用法: python scripts/subset-font.py
"""
from __future__ import annotations

import os
import sys

from fontTools import subset

SRC_DIR = os.path.join("assets", "fonts-src")
OUT_DIR = os.path.join("public", "fonts")


def gb2312_chars() -> set[str]:
    """GB2312 全部汉字（6763 个）+ 全角符号。"""
    chars: set[str] = set()
    for hi in range(0xA1, 0xF8):
        for lo in range(0xA1, 0xFF):
            try:
                ch = bytes([hi, lo]).decode("gb2312")
            except UnicodeDecodeError:
                continue
            chars.add(ch)
    return chars


def extra_chars() -> set[str]:
    base = set(chr(c) for c in range(0x20, 0x7F))  # 可打印 ASCII
    symbols = set(
        "，。、；：？！“”‘’（）《》〈〉【】〔〕—…·～￥％＃＆＊＋－／＝＜＞"
        "×÷±≈≠≤≥°′″‰※★☆○●◎◇◆□■△▲▽▼→←↑↓↔⇄"
        "✓✔✕✖✗✘…·　"
    )
    return base | symbols


def main() -> int:
    chars = gb2312_chars() | extra_chars()
    text = "".join(sorted(chars))
    os.makedirs(OUT_DIR, exist_ok=True)

    os.makedirs("node_modules/.tmp", exist_ok=True)
    chars_file = os.path.join("node_modules", ".tmp", "font-chars.txt")
    with open(chars_file, "w", encoding="utf-8") as f:
        f.write(text)

    jobs = [
        ("LXGWWenKai-Regular.ttf", "wenkai-regular.woff2"),
        ("LXGWWenKai-Medium.ttf", "wenkai-medium.woff2"),
    ]

    for src_name, out_name in jobs:
        src = os.path.join(SRC_DIR, src_name)
        dst = os.path.join(OUT_DIR, out_name)
        if not os.path.exists(src):
            print(f"missing {src}", file=sys.stderr)
            return 1

        options = subset.Options()
        options.flavor = "woff2"
        options.desubroutinize = True
        options.hinting = False
        options.name_IDs = ["*"]
        options.name_legacy = True
        options.notdef_outline = True
        options.recalc_bounds = True
        options.drop_tables += ["DSIG"]

        font = subset.load_font(src, options)
        subsetter = subset.Subsetter(options=options)
        subsetter.populate(text=text)
        subsetter.subset(font)
        subset.save_font(font, dst, options)
        font.close()

        size = os.path.getsize(dst) / 1024 / 1024
        print(f"{out_name}: {size:.2f} MB")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
