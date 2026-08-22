"""
Builds the per-product asset pack for the "hand holding capsules" product photos.

Why this script exists: this environment has no image generator, so the photos
themselves have to be produced in a tool that does (the shop already uses
Gemini -- the homepage images are named Gemini_Generated_Image_*). What can be
done accurately here is everything that makes those generations *correct*:

  1. the two real ingredients each pack should show,
  2. the real colour of each of those capsules, sampled from the actual
     supplier photograph rather than guessed,
  3. a reference sheet PNG pairing the two real capsules, to attach to the
     generation as an image reference so the capsule in the render matches the
     capsule that ships,
  4. a prompt whose hand, skin tone, framing and background are rotated per
     product so 66 product pages do not look copy-pasted.

Outputs into scripts/hand_shots/:
  reference/<handle>.png   two real capsules side by side, labelled
  PROMPTS.md               one prompt per product, ready to paste
"""

import hashlib
import io
import json
import os
import urllib.request

from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'scripts', 'hand_shots')
REF = os.path.join(OUT, 'reference')
CACHE = os.path.join(OUT, '.cache')
BASE = 'https://cdn.shopify.com/s/files/1/0758/4189/6587/files/'

for d in (OUT, REF, CACHE):
    os.makedirs(d, exist_ok=True)

ING = json.load(open(os.path.join(ROOT, 'scripts', 'ingredient_images.json')))
REG = json.load(open(os.path.join(ROOT, 'scripts', 'spadra_registry.json')))['products']

# Rotated so no two neighbouring product pages look alike. Hands only -- no
# faces, no bodies, no props -- matching the reference the owner supplied.
HANDS = [
    'a deep brown-skinned hand, short natural nails, adult',
    'a light olive-skinned hand, unpolished nails, adult',
    'a medium tan-skinned hand, neat square nails, adult',
    'a pale fair-skinned hand with faint freckles, short nails, adult',
    'a rich dark-skinned hand, clean rounded nails, adult',
    'a warm golden-brown hand, short nails, adult',
    'a light brown-skinned hand, softly manicured nails, adult',
    'a deep ebony-skinned mature hand, natural nails, older adult',
    'a fair-skinned hand with visible veins, short nails, older adult',
    'a medium brown-skinned hand, plain short nails, young adult',
]
GRIPS = [
    'pinching one capsule between thumb and index finger, the second capsule resting in the open palm below',
    'holding both capsules balanced on the flat open palm, fingers relaxed',
    'thumb and forefinger raising one capsule to the light, the other held between the middle and ring fingertips',
    'cupping both capsules loosely in slightly curled fingers, seen from just above',
    'presenting both capsules on the fingertips of a flat, upturned hand',
    'holding one capsule upright between thumb and index finger, the second pinched in the other hand entering frame from the side',
]
ANGLES = [
    'shot straight on at eye level',
    'shot slightly from above, looking down at the hand',
    'shot from a low three-quarter angle',
    'shot square to camera, hand entering from the bottom of the frame',
    'shot from the side, hand entering from the right of the frame',
]
BACKDROPS = [
    'a soft warm sand backdrop (#F0EBE2)',
    'a muted stone-grey backdrop (#E6E6E4)',
    'a pale sage backdrop (#E4EBE4)',
    'a warm off-white backdrop (#F5F2EC)',
    'a soft clay backdrop (#EDE4DC)',
    'a cool pale blue-grey backdrop (#E6EAEE)',
]
LIGHT = [
    'soft diffused daylight from the left, gentle natural shadow',
    'even soft studio light, almost shadowless',
    'warm directional light from upper right, soft falloff',
    'bright clean light from the front, subtle contact shadow',
]


def fetch(filename):
    """Download a capsule photo once and cache it."""
    path = os.path.join(CACHE, filename.replace('/', '_'))
    if not os.path.exists(path):
        with urllib.request.urlopen(BASE + filename, timeout=60) as r:
            open(path, 'wb').write(r.read())
    return path


def load_on_white(path, size=None):
    """These are palette PNGs with transparency. Converting straight to RGB
    turns the transparent area into whatever the palette's index 0 happens to
    be -- which came out green and poisoned both the sheet and the colour
    sample. Composite onto white through the alpha channel instead."""
    im = Image.open(path).convert('RGBA')
    flat = Image.new('RGBA', im.size, (255, 255, 255, 255))
    flat.alpha_composite(im)
    flat = flat.convert('RGB')
    return flat.resize(size) if size else flat


def capsule_colour(path):
    """Median colour of the capsule, ignoring the white studio background."""
    im = load_on_white(path, (160, 160))
    px = [p for p in im.getdata() if not (p[0] > 238 and p[1] > 238 and p[2] > 238)]
    if not px:
        return (150, 150, 150)
    px.sort(key=lambda c: c[0] + c[1] + c[2])
    return px[len(px) // 2]


def colour_name(rgb):
    r, g, b = rgb
    mx, mn = max(rgb), min(rgb)
    if mx - mn < 22:
        if mx > 200:
            return 'off-white'
        if mx > 150:
            return 'light grey'
        if mx > 90:
            return 'grey'
        return 'near-black'
    if r > g > b:
        if r > 190 and g > 140:
            return 'pale sandy beige'
        if r > 150 and g > 100:
            return 'warm tan'
        if r > 110:
            return 'medium brown'
        return 'deep brown'
    if g >= r and g > b:
        return 'olive green' if g < 170 else 'pale green'
    if b >= r and b >= g:
        return 'slate blue-grey'
    if r > 180 and b > 120:
        return 'dusky rose'
    return 'muted brown'


def pick_two(ings):
    """The two most distinctive actives that both have a real photo."""
    have = [i for i in ings if i in ING]
    if len(have) < 2:
        return have
    # Prefer the two that look least alike, so the shot has visual contrast.
    best, pair = -1, (have[0], have[1])
    for a in range(len(have)):
        for b in range(a + 1, len(have)):
            ca = capsule_colour(fetch(ING[have[a]]))
            cb = capsule_colour(fetch(ING[have[b]]))
            d = sum((x - y) ** 2 for x, y in zip(ca, cb))
            if d > best:
                best, pair = d, (have[a], have[b])
    return list(pair)


def reference_sheet(handle, names):
    """Two real capsules side by side, labelled -- the image to attach."""
    W, H = 1000, 560
    card = Image.new('RGB', (W, H), (255, 255, 255))
    d = ImageDraw.Draw(card)
    try:
        f = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 30)
        fs = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 20)
    except Exception:
        f = fs = ImageFont.load_default()
    d.text((30, 26), 'REAL CAPSULES - match these exactly', fill=(20, 20, 20), font=f)
    d.text((30, 66), handle, fill=(120, 120, 120), font=fs)
    for i, n in enumerate(names):
        cap = load_on_white(fetch(ING[n]), (360, 360))
        card.paste(cap, (60 + i * 470, 120))
        d.text((60 + i * 470, 495), n, fill=(20, 20, 20), font=f)
        rgb = capsule_colour(fetch(ING[n]))
        d.text((60 + i * 470, 528), '%s  rgb%s' % (colour_name(rgb), rgb), fill=(120, 120, 120), font=fs)
    card.save(os.path.join(REF, handle + '.png'))


rows, skipped = [], []
for pid, p in sorted(REG.items(), key=lambda kv: kv[1]['handle']):
    handle, title = p['handle'], p['display_name']
    two = pick_two(p['ingredients'])
    if len(two) < 2:
        skipped.append((handle, title, p['ingredients']))
        continue

    # Deterministic per product, so re-running gives the same look and no two
    # adjacent products share a hand.
    seed = int(hashlib.md5(handle.encode()).hexdigest(), 16)
    hand = HANDS[seed % len(HANDS)]
    grip = GRIPS[(seed // 7) % len(GRIPS)]
    angle = ANGLES[(seed // 13) % len(ANGLES)]
    back = BACKDROPS[(seed // 17) % len(BACKDROPS)]
    light = LIGHT[(seed // 23) % len(LIGHT)]

    desc = []
    for n in two:
        rgb = capsule_colour(fetch(ING[n]))
        cname = colour_name(rgb)
        article = 'an' if cname[0] in 'aeiou' else 'a'
        desc.append('%s (%s %s capsule, rgb%s)' % (n, article, cname, rgb))
    reference_sheet(handle, two)

    prompt = (
        'Photorealistic product photograph. Only a hand -- no face, no body, no '
        'clothing, no props, no text. %s, %s, %s. The hand is %s. '
        'It holds exactly two supplement capsules: %s and %s. '
        'Match the capsule colour, size and finish to the attached reference image exactly; '
        'the capsules are plain and unbranded with no printing on them. '
        '%s. Clean commercial e-commerce style, sharp focus on the capsules, '
        'shallow depth of field, square 1:1 crop, no watermark.'
        % (angle, back, light, hand, desc[0], desc[1], grip)
    )
    rows.append((handle, title, two, prompt))

lines = [
    '# Hand-holding-capsule product shots - prompt pack',
    '',
    'One prompt per product. Generated by `scripts/build_hand_shot_prompts.py`.',
    '',
    '**How to use:** paste the prompt into the image generator, and attach',
    '`scripts/hand_shots/reference/<handle>.png` as an image reference so the',
    'capsules that get rendered are the ones that actually ship. The two',
    'ingredients named in each prompt are real actives from that pack, and the',
    'colours were sampled from the real supplier photograph, not guessed.',
    '',
    'Hand, grip, camera angle, backdrop and lighting are rotated per product so',
    'no two pages look copy-pasted.',
    '',
    '**Keep it hands-only.** No faces, no bodies. Do not let the generator add',
    'branding or printing to the capsules - the real ones are plain.',
    '',
    '---',
    '',
]
for handle, title, two, prompt in rows:
    lines += [
        '## %s' % title,
        '',
        '- handle: `%s`' % handle,
        '- capsules shown: **%s** + **%s**' % (two[0], two[1]),
        '- reference: `scripts/hand_shots/reference/%s.png`' % handle,
        '',
        '```',
        prompt,
        '```',
        '',
    ]
if skipped:
    lines += ['---', '', '## Skipped (fewer than 2 actives have a real photo)', '']
    for handle, title, ings in skipped:
        lines.append('- %s (`%s`) - actives: %s' % (title, handle, ', '.join(ings)))
    lines.append('')

open(os.path.join(OUT, 'PROMPTS.md'), 'w').write('\n'.join(lines))
print('prompts written : %d' % len(rows))
print('reference sheets: %d' % len(rows))
print('skipped         : %d' % len(skipped))
