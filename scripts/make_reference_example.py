"""
Single-product example of the capsule reference sheet, in two variants, so the
look can be approved before the other 65 are generated.

No instruction text is baked into the image. The "match the capsules exactly"
direction belongs in the prompt sent to the generator, not printed on the
picture -- if a sheet ever leaked onto the site it should still look like a
clean product still, not a work order.
"""

import json
import os
import urllib.request

from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'scripts', 'hand_shots', 'example')
CACHE = os.path.join(ROOT, 'scripts', 'hand_shots', '.cache')
BASE = 'https://cdn.shopify.com/s/files/1/0758/4189/6587/files/'
os.makedirs(OUT, exist_ok=True)
os.makedirs(CACHE, exist_ok=True)

ING = json.load(open(os.path.join(ROOT, 'scripts', 'ingredient_images.json')))

HANDLE = 'nitric-oxide-women-spadra'
PAIR = ['Arginine', 'Fenugreek']

WARM = (245, 242, 236)   # matches the site's off-white
INK = (26, 26, 26)
MUTED = (122, 122, 116)


def fetch(fn):
    p = os.path.join(CACHE, fn.replace('/', '_'))
    if not os.path.exists(p):
        with urllib.request.urlopen(BASE + fn, timeout=60) as r:
            open(p, 'wb').write(r.read())
    return p


def load_on_white(path, size, bg):
    im = Image.open(path).convert('RGBA')
    flat = Image.new('RGBA', im.size, bg + (255,))
    flat.alpha_composite(im)
    return flat.convert('RGB').resize(size, Image.LANCZOS)


def letterspace(d, xy, text, font, fill, extra=3):
    x, y = xy
    for ch in text:
        d.text((x, y), ch, font=font, fill=fill)
        x += d.textlength(ch, font=font) + extra
    return x - xy[0]


def spaced_width(d, text, font, extra=3):
    return sum(d.textlength(c, font=font) + extra for c in text) - extra


# ---- Variant A: capsules only, no text at all ------------------------------
W = H = 1200
a = Image.new('RGB', (W, H), WARM)
CAP = 520
for i, n in enumerate(PAIR):
    cap = load_on_white(fetch(ING[n]), (CAP, CAP), WARM)
    a.paste(cap, (70 + i * 540, (H - CAP) // 2))
a.save(os.path.join(OUT, HANDLE + '-A-clean.png'))

# ---- Variant B: capsules with a quiet ingredient caption -------------------
b = Image.new('RGB', (W, H), WARM)
d = ImageDraw.Draw(b)
try:
    cap_font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 26)
except Exception:
    cap_font = ImageFont.load_default()

# the whole content group -- capsules, captions, rule -- is centred as one
# block so the frame doesn't read bottom-heavy.
BCAP = 480
TOP = 230
for i, n in enumerate(PAIR):
    cap = load_on_white(fetch(ING[n]), (BCAP, BCAP), WARM)
    cx = 90 + i * 540
    b.paste(cap, (cx, TOP))
    label = n.upper()
    w = spaced_width(d, label, cap_font)
    letterspace(d, (cx + (BCAP - w) / 2, TOP + BCAP + 70), label, cap_font, MUTED)

# one hairline rule, nothing else
d.line([(90, TOP + BCAP + 160), (W - 90, TOP + BCAP + 160)], fill=(222, 218, 210), width=1)
b.save(os.path.join(OUT, HANDLE + '-B-labelled.png'))

print('wrote:')
for f in sorted(os.listdir(OUT)):
    print('  scripts/hand_shots/example/' + f)
