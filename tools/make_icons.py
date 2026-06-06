#!/usr/bin/env python3
"""Generate Tide app icons — a bioluminescent orb held in the deep, with a wave.

Run from repo root:  python3 tools/make_icons.py
Outputs PNGs into icons/.
"""
import math
from PIL import Image, ImageDraw, ImageFilter

ABYSS = (4, 16, 30)         # #04101e
DEEP = (10, 39, 72)         # #0a2748
MID = (18, 58, 99)          # #123a63
TEAL_HI = (140, 251, 237)   # phosphor highlight
TEAL = (45, 212, 191)       # #2DD4BF
TEAL_LO = (22, 130, 116)    # deep teal


def lerp(a, b, t):
    t = max(0.0, min(1.0, t))
    return tuple(round(a[i] + (b[i] - a[i]) * t) for i in range(3))


def radial_bg(size, cx, cy):
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    px = img.load()
    maxd = math.hypot(size, size) * 0.62
    for y in range(size):
        for x in range(size):
            d = math.hypot(x - cx, y - cy) / maxd
            col = lerp(MID, ABYSS, d ** 0.9)
            px[x, y] = (*col, 255)
    return img


def radial_circle(size, cx, cy, r, inner, outer, ss=4):
    S = size * ss
    img = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    px = img.load()
    cxs, cys, rs = cx * ss, cy * ss, r * ss
    hx, hy = cxs, cys - rs * 0.32  # highlight offset upward
    for y in range(S):
        for x in range(S):
            if math.hypot(x - cxs, y - cys) <= rs:
                t = min(1.0, math.hypot(x - hx, y - hy) / (rs * 1.25))
                px[x, y] = (*lerp(inner, outer, t ** 0.85), 255)
    return img.resize((size, size), Image.LANCZOS)


def draw_wave(size, base, amp, freq, thickness, fill_a, crest_a, scale):
    layer = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    px = layer.load()
    for x in range(size):
        wy = base + math.sin((x / size) * math.tau * freq + 0.4) * amp * scale
        for y in range(int(wy), size):
            # fill below the crest, fading downward
            fa = fill_a * max(0.0, 1 - (y - wy) / (size * 0.5))
            if fa > 0:
                px[x, y] = (*lerp(TEAL_LO, TEAL, 0.4), int(fa))
        for y in range(max(0, int(wy - thickness)), int(wy + thickness)):
            d = abs(y - wy) / thickness
            a = crest_a * (1 - d)
            if a > 0:
                ex = px[x, y][3] if px[x, y][3] else 0
                px[x, y] = (*lerp(TEAL, TEAL_HI, 0.5), max(ex, int(a)))
    return layer


def make_icon(size, maskable=False):
    scale = 0.80 if maskable else 1.0
    cx, cy = size / 2, size * 0.45

    img = radial_bg(size, cx, size * 0.4)

    # halo behind the orb
    halo = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    hd = ImageDraw.Draw(halo)
    hr = size * 0.40 * scale
    hd.ellipse([cx - hr, cy - hr, cx + hr, cy + hr], fill=(*TEAL, 90))
    halo = halo.filter(ImageFilter.GaussianBlur(size * 0.06))
    img.alpha_composite(halo)

    # back + front waves
    img.alpha_composite(draw_wave(size, size * 0.74, size * 0.05, 1.6, size * 0.012, 55, 90, scale))
    img.alpha_composite(draw_wave(size, size * 0.66, size * 0.055, 2.1, size * 0.014, 80, 150, scale))

    # the orb
    r = size * 0.235 * scale
    orb = radial_circle(size, cx, cy, r, TEAL_HI, TEAL_LO)
    bloom = orb.filter(ImageFilter.GaussianBlur(size * 0.03))
    img.alpha_composite(bloom)
    img.alpha_composite(orb)

    # rounded mask (full-bleed for maskable)
    mask = Image.new("L", (size, size), 0)
    md = ImageDraw.Draw(mask)
    radius = 0 if maskable else int(size * 0.225)
    md.rounded_rectangle([0, 0, size - 1, size - 1], radius=radius, fill=255)
    out = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    out.paste(img, (0, 0), mask)
    return out


def main():
    make_icon(192).save("icons/icon-192.png")
    make_icon(512).save("icons/icon-512.png")
    make_icon(512, maskable=True).save("icons/icon-512-maskable.png")
    make_icon(180).save("icons/apple-touch-icon.png")
    make_icon(32).save("icons/favicon-32.png")
    print("icons written")


if __name__ == "__main__":
    main()
