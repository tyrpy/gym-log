"""重新生成安卓启动屏：宣纸底 + 朱砂印 + 标题。"""
from __future__ import annotations

import glob
import os

from PIL import Image, ImageDraw, ImageFont

PAPER = (242, 234, 217)
CINNABAR = (166, 58, 43)
INK = (35, 32, 25)

FONT_PATH = os.path.join("assets", "fonts-src", "LXGWWenKai-Medium.ttf")


def render(size: tuple[int, int], out: str) -> None:
    w, h = size
    img = Image.new("RGB", (w, h), PAPER)
    d = ImageDraw.Draw(img)
    unit = min(w, h)

    seal = int(unit * 0.26)
    cx, cy = w // 2, int(h * 0.44)

    # 印章边框（外粗内细）
    box = [cx - seal // 2, cy - seal // 2, cx + seal // 2, cy + seal // 2]
    d.rounded_rectangle(box, radius=int(seal * 0.1), outline=CINNABAR, width=max(2, int(unit * 0.004)))
    inset = int(seal * 0.09)
    inner = [box[0] + inset, box[1] + inset, box[2] - inset, box[3] - inset]
    d.rounded_rectangle(inner, radius=int(seal * 0.07), outline=CINNABAR + (0,), width=1)

    # 印中字
    char = "健"
    f_char = ImageFont.truetype(FONT_PATH, int(seal * 0.6))
    tb = d.textbbox((0, 0), char, font=f_char)
    d.text(
        (cx - (tb[2] - tb[0]) / 2 - tb[0], cy - (tb[3] - tb[1]) / 2 - tb[1]),
        char,
        font=f_char,
        fill=CINNABAR,
    )

    # 标题
    title = "健 身 日 志"
    f_title = ImageFont.truetype(FONT_PATH, int(unit * 0.075))
    tb2 = d.textbbox((0, 0), title, font=f_title)
    d.text(
        (w / 2 - (tb2[2] - tb2[0]) / 2 - tb2[0], cy + seal * 0.72),
        title,
        font=f_title,
        fill=INK,
    )

    # 底部小字
    sub = "修 炼 有 痕"
    f_sub = ImageFont.truetype(FONT_PATH, int(unit * 0.032))
    tb3 = d.textbbox((0, 0), sub, font=f_sub)
    d.text(
        (w / 2 - (tb3[2] - tb3[0]) / 2 - tb3[0], cy + seal * 1.15),
        sub,
        font=f_sub,
        fill=(125, 116, 99),
    )

    img.save(out, "PNG")
    print(out, size)


if __name__ == "__main__":
    for f in sorted(glob.glob("android/app/src/main/res/drawable-*/splash.png")):
        with Image.open(f) as im:
            size = im.size
        render(size, f)
