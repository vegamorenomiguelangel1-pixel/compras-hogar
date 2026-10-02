"""Generate PWA icons for Yapa. Run from anywhere."""
from PIL import Image, ImageDraw, ImageFilter
import os

OUT = os.path.dirname(os.path.abspath(__file__))
GREEN = (14, 122, 86, 255)
GREEN_DARK = (8, 92, 64, 255)
CREAM = (246, 243, 236, 255)
AMBER = (232, 163, 23, 255)


def rounded_mask(size, radius):
    mask = Image.new("L", (size, size), 0)
    draw = ImageDraw.Draw(mask)
    draw.rounded_rectangle((0, 0, size - 1, size - 1), radius=radius, fill=255)
    return mask


def draw_mark(size, maskable=False):
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    if maskable:
        draw.rectangle((0, 0, size, size), fill=GREEN)
    else:
        draw.rounded_rectangle((0, 0, size - 1, size - 1), radius=int(size * 0.23), fill=GREEN)
    # soft highlight
    highlight = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    hd = ImageDraw.Draw(highlight)
    hd.ellipse(
        (int(size * 0.15), int(-size * 0.2), int(size * 0.95), int(size * 0.55)),
        fill=(255, 255, 255, 28),
    )
    img = Image.alpha_composite(img, highlight)
    draw = ImageDraw.Draw(img)
    cx, cy = size / 2, size / 2
    scale = size * (0.62 if maskable else 0.70)
    stroke = max(2, int(size * 0.075))
    # Basket body
    left = cx - scale * 0.34
    right = cx + scale * 0.34
    top = cy - scale * 0.02
    bottom = cy + scale * 0.36
    draw.rounded_rectangle((left, top, right, bottom), radius=int(size * 0.06), fill=CREAM)
    # Handle
    hw = max(3, int(size * 0.045))
    draw.arc(
        (cx - scale * 0.22, cy - scale * 0.48, cx + scale * 0.22, cy + scale * 0.02),
        start=200,
        end=340,
        fill=CREAM,
        width=hw,
    )
    # Yapa dot
    r = size * 0.075
    dot = (cx + scale * 0.30, cy - scale * 0.30)
    draw.ellipse((dot[0] - r, dot[1] - r, dot[0] + r, dot[1] + r), fill=AMBER)
    if not maskable:
        mask = rounded_mask(size, int(size * 0.23))
        out = Image.new("RGBA", (size, size), (0, 0, 0, 0))
        out.paste(img, (0, 0), mask)
        return out
    return img


def main():
    draw_mark(192).save(os.path.join(OUT, "icon-192.png"))
    draw_mark(512).save(os.path.join(OUT, "icon-512.png"))
    draw_mark(512, maskable=True).save(os.path.join(OUT, "icon-maskable-512.png"))
    print("icons ok")


if __name__ == "__main__":
    main()
