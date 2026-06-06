#!/usr/bin/env python3
"""Generate Tide app icons (the brand: a teal drop on deep-ocean navy with a wave).

Run from repo root:  python3 tools/make_icons.py
Outputs PNGs into icons/ and an SVG favicon.
"""
import math
from PIL import Image, ImageDraw, ImageFilter

NAVY_TOP = (22, 51, 92)     # #16335c
NAVY_BOT = (8, 19, 38)      # #081326
TEAL_HI = (109, 240, 219)   # #6df0db
TEAL = (45, 212, 191)       # #2DD4BF
TEAL_LO = (26, 164, 146)    # #1aa492


def lerp(a, b, t):
    return tuple(round(a[i] + (b[i] - a[i]) * t) for i in range(3))


def radial_circle(size, cx, cy, r, inner, outer, ss=4):
    """A soft radial-gradient filled circle on a transparent layer (supersampled)."""
    S = size * ss
    img = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    px = img.load()
    cxs, cys, rs = cx * ss, cy * ss, r * ss
    for y in range(S):
        for x in range(S):
            dx, dy = x - cxs, y - cys
            d = math.hypot(dx, dy)
            if d <= rs:
                t = min(1.0, d / rs)
                # bias highlight toward upper area
                col = lerp(inner, outer, t ** 0.85)
                px[x, y] = (*col, 255)
    return img.resize((size, size), Image.LANCZOS)


def make_icon(size, maskable=False):
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # rounded-square navy background with vertical gradient
    bg = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    bgd = bg.load()
    for y in range(size):
        col = lerp(NAVY_TOP, NAVY_BOT, (y / size) ** 0.9)
        for x in range(size):
            bgd[x, y] = (*col, 255)
    # rounded mask (full-bleed for maskable, rounded for normal)
    mask = Image.new("L", (size, size), 0)
    md = ImageDraw.Draw(mask)
    radius = 0 if maskable else int(size * 0.22)
    md.rounded_rectangle([0, 0, size - 1, size - 1], radius=radius, fill=255)
    img.paste(bg, (0, 0), mask)

    # safe-zone scale: maskable keeps art within the inner 80%
    scale = 0.80 if maskable else 1.0
    cx = size / 2
    cy = size * 0.455

    # the wave band near the lower third
    wave = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    wd = wave.load()
    amp = size * 0.045 * scale
    base = size * 0.66
    thickness = size * 0.055 * scale
    freq = 2.2
    for x in range(size):
        phase = (x / size) * math.tau * freq
        wy = base + math.sin(phase) * amp
        for y in range(size):
            if abs(y - wy) <= thickness:
                a = 1 - (abs(y - wy) / thickness)
                col = lerp(TEAL_LO, TEAL, 0.5)
                wd[x, y] = (*col, int(150 * a))
    img.alpha_composite(wave)

    # the drop / circle (the urge button, brand mark)
    r = size * 0.255 * scale
    circle = radial_circle(size, cx, cy, r, TEAL_HI, TEAL_LO)
    # glow
    glow = circle.filter(ImageFilter.GaussianBlur(size * 0.03))
    img.alpha_composite(glow)
    img.alpha_composite(circle)

    # re-apply rounded mask so glow doesn't bleed past corners (normal icon)
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
