#!/usr/bin/env python3
"""Assemble captured frames into the script's GIFs.

    python3 tools/gifs.py [name ...]     gifs/frames/<name>/ -> gifs/<name>.gif

Pillow only — there is no ffmpeg or gifsicle here, and for this material there does
not need to be. The Clarity surface is flat colour and text, so 256 adaptive colours
is not a compromise: the palette is the right tool for it, and the files come out far
smaller than video would.

Captured at 2x and scaled down here, because text resampled from double size stays
legible in a way text rendered at final size does not.

Frame durations come from the capture's own steps.json, so retiming is a rerun of
this and not of the browser.
"""
import json
import os
import sys

from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
FRAMES = os.path.join(HERE, "..", "gifs", "frames")
OUT = os.path.join(HERE, "..", "gifs")

TARGET_W = 1000        # the Rise content column, near enough
MAX_COLORS = 200       # leaves room in the table; the UI does not need 256


def build(name):
    src = os.path.join(FRAMES, name)
    steps = json.load(open(os.path.join(src, "steps.json")))
    frames, durations = [], []

    for fr in steps["frames"]:
        im = Image.open(os.path.join(src, fr["file"])).convert("RGB")
        if im.width != TARGET_W:
            im = im.resize((TARGET_W, round(im.height * TARGET_W / im.width)),
                           Image.LANCZOS)
        frames.append(im)
        durations.append(max(30, int(fr["ms"])))

    if not frames:
        print("  %-22s no frames" % name)
        return

    # One palette for the whole run. Quantising each frame on its own makes the
    # flat background shimmer between frames, which is the classic GIF artefact.
    base = frames[0].quantize(colors=MAX_COLORS, method=Image.MEDIANCUT)
    pal = [f.quantize(palette=base, dither=Image.NONE) for f in frames]

    out = os.path.join(OUT, name + ".gif")
    pal[0].save(out, save_all=True, append_images=pal[1:],
                duration=durations, loop=0, optimize=True, disposal=2)
    kb = os.path.getsize(out) / 1024
    print("  %-22s %3d frames  %5.1fs  %6.0f KB  %dx%d"
          % (name, len(pal), sum(durations) / 1000, kb, pal[0].width, pal[0].height))


if __name__ == "__main__":
    os.makedirs(OUT, exist_ok=True)
    wanted = sys.argv[1:]
    names = sorted(d for d in os.listdir(FRAMES)
                   if os.path.isdir(os.path.join(FRAMES, d))
                   and (not wanted or d in wanted))
    if not names:
        raise SystemExit("no captured frames — run tools/capture.mjs first")
    for n in names:
        build(n)
