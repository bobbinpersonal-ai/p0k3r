#!/usr/bin/env python3
"""Render SPADRA pack images deterministically from the product registry.

No model call per image. The pack artwork is structured information — name,
category, actives, dose count, time of day — so it is rendered from an HTML
master template in headless Chromium. Same config in, byte-identical PNG out.

That also removes the need for OCR. OCR exists to recover text from a
stochastic generator; here the text is an input we control, so Stage A QA
verifies the render instead of trying to read it back.

Usage:
    python3 scripts/render_packs.py                 # every product needing work
    python3 scripts/render_packs.py --only <id,id>  # specific product ids
    python3 scripts/render_packs.py --force         # ignore the fast path
    python3 scripts/render_packs.py --verify        # render twice, prove determinism
"""
from __future__ import annotations

import argparse
import hashlib
import html
import json
import pathlib
import sys

ROOT = pathlib.Path(__file__).resolve().parent
REGISTRY = ROOT / "spadra_registry.json"
# Each pack gets several product photos. A variant is a master template plus a
# filename suffix; the registry stores one image hash per variant, so adding a
# variant does not invalidate the ones already approved and uploaded.
VARIANTS = {
    "a": ("pack_template.html", ""),      # dark sachet, actives printed on the face
    "b": ("pack_template_b.html", "-b"),  # torn sachet flat lay, actives spilled out
}
VARIANT = "a"
OUT_DIR = ROOT / "pack_images"


def template_path() -> pathlib.Path:
    return ROOT / VARIANTS[VARIANT][0]


def out_path(rec: dict) -> pathlib.Path:
    return OUT_DIR / f"{rec['id']}{VARIANTS[VARIANT][1]}.png"
SIDE = 1200
MAX_ACTIVES = 8

# Time of day is derived from the formula, never assigned for visual variety.
# NIGHT_ACTIVES have a genuine evening rationale: sedating, relaxant, overnight
# elimination, or repair dosing that suits the empty overnight window.
NIGHT_ACTIVES = {
    "Melatonin SR", "Herbal Sleep Blend", "Triphala", "Magnesium", "Glucosamine",
    "Calcium Citrate", "Hyaluronic Acid", "Glutamine", "Soothing Fiber",
    "10B Probiotic", "Milk Thistle", "Turmeric", "Biotin", "Saw Palmetto", "DIM",
}

# Actives that must never carry a NIGHT label — stimulant, activating, or tied
# to the morning cortisol rhythm. Presence of any of these forces MORNING, even
# alongside a night active, because telling someone to take Rhodiola or green
# coffee at bedtime is bad guidance no matter how it balances the catalogue.
MORNING_ONLY_ACTIVES = {
    "Green Coffee Extract", "Green Tea Extract", "Rhodiola", "Cordyceps",
    "Tyrosine", "Creatine", "Methyl B-Complex", "DHEA", "NR", "Taurine",
    "BCAA", "Forslean", "Berberine 500",
}

# Escape hatch: force a specific product by handle when the formula rule is not
# the whole story. Keep it small — an entry here is a claim the site has to keep.
WHEN_OVERRIDES: dict[str, str] = {}

SUN = ('<svg width="22" height="22" viewBox="0 0 24 24" fill="none" '
       'stroke="#FFFFFF" stroke-width="1.7" stroke-linecap="round">'
       '<circle cx="12" cy="12" r="4.2"/>'
       '<path d="M12 2.4v2.4M12 19.2v2.4M2.4 12h2.4M19.2 12h2.4'
       'M5.2 5.2l1.7 1.7M17.1 17.1l1.7 1.7M18.8 5.2l-1.7 1.7M6.9 17.1l-1.7 1.7"/>'
       '</svg>')
MOON = ('<svg width="22" height="22" viewBox="0 0 24 24" fill="none" '
        'stroke="#FFFFFF" stroke-width="1.6" stroke-linejoin="round">'
        '<path d="M20 14.2A8.2 8.2 0 1 1 9.8 4a6.6 6.6 0 0 0 10.2 10.2z"/>'
        '</svg>')


def template_hash() -> str:
    return hashlib.sha256(template_path().read_bytes()).hexdigest()[:12]


def when_for(rec: dict) -> str:
    handle = rec["handle"]
    if handle in WHEN_OVERRIDES:
        return WHEN_OVERRIDES[handle]
    if handle.endswith(("-pm-1", "-pm-spadra")):
        return "NIGHT"
    if handle.endswith(("-am-1", "-am-spadra")):
        return "MORNING"
    actives = set(rec["ingredients"])
    if actives & MORNING_ONLY_ACTIVES:
        return "MORNING"
    return "NIGHT" if actives & NIGHT_ACTIVES else "MORNING"


# Each active always renders as the same dosage form and colour, so a shopper
# who learns "the amber softgel is the omega" sees it consistently across packs.
# kind: cap (two-piece), gel (softgel), tab (pressed tablet), clear (granules).
PILL_STYLE = {
    "Omega 3": ("gel", "#E8A33D", "#E8A33D", 118, 84),
    "D Complex": ("gel", "#F2C572", "#F2C572", 96, 70),
    "CoQ10": ("gel", "#F0A23A", "#F0A23A", 104, 76),
    "Vitamin C": ("tab", "#F3A13C", "#F3A13C", 86, 86),
    "Magnesium": ("tab", "#EDE7DC", "#EDE7DC", 92, 92),
    "Calcium Citrate": ("tab", "#F2EFE8", "#F2EFE8", 96, 96),
    "Zinc": ("tab", "#D8DCE0", "#D8DCE0", 82, 82),
    "Iron": ("tab", "#B4553F", "#B4553F", 84, 84),
    "Chromium": ("tab", "#C9CED4", "#C9CED4", 76, 76),
    "Boron": ("tab", "#E4E7EA", "#E4E7EA", 74, 74),
    "Trace Minerals": ("tab", "#CFC6B4", "#CFC6B4", 84, 84),
    "Multivitamin": ("tab", "#E0B24E", "#E0B24E", 98, 98),
    "Melatonin SR": ("tab", "#C7CBE4", "#C7CBE4", 78, 78),
    "Methyl B-Complex": ("cap", "#E24F4F", "#F2D9D9", 130, 62),
    "Berberine 500": ("cap", "#C8A227", "#EFE3B8", 132, 62),
    "Turmeric": ("cap", "#D98E1F", "#F3DEB4", 128, 62),
    "Ashwagandha": ("cap", "#8A6A4B", "#E4D6C4", 128, 62),
    "Rhodiola": ("cap", "#9A5E3C", "#E6D2C0", 124, 60),
    "Cordyceps": ("cap", "#B4682C", "#EBD9C4", 124, 60),
    "Lion's Mane": ("cap", "#C29A6B", "#EFE3D2", 128, 62),
    "Mushroom Immune": ("cap", "#8D6E52", "#E7DBCB", 126, 62),
    "Milk Thistle": ("cap", "#1E5631", "#DCE8DC", 126, 62),
    "Green Tea Extract": ("cap", "#2E6B3E", "#DDE9DD", 124, 60),
    "Green Coffee Extract": ("cap", "#4B7A3A", "#E0EAD9", 124, 60),
    "Saw Palmetto": ("cap", "#2F5D45", "#DCE7E1", 124, 60),
    "Quercetin": ("cap", "#D6B23B", "#F1E7C4", 122, 60),
    "Resveratrol": ("cap", "#7A2E4E", "#EBD8E0", 122, 60),
    "DIM": ("cap", "#5C7A3A", "#E2E9D6", 120, 60),
    "Fenugreek": ("cap", "#A8823C", "#EDE1C6", 122, 60),
    "Tribulus": ("cap", "#6E5A3C", "#E6DEcd", 122, 60),
    "Big Libido": ("cap", "#8C2F3C", "#EDD6D9", 124, 60),
    "DHEA": ("cap", "#C0C4CA", "#EFF1F3", 118, 58),
    "Biotin": ("cap", "#E6C25A", "#F5EBCB", 116, 58),
    "Hyaluronic Acid": ("cap", "#D8DEE6", "#F3F5F8", 120, 60),
    "Glucosamine": ("cap", "#CDBFA6", "#EFE8DA", 128, 62),
    "Alpha Lipoic Acid": ("cap", "#D6C23B", "#F0EAC4", 124, 60),
    "NAC": ("cap", "#E3E6EA", "#F6F7F9", 126, 62),
    "NR": ("cap", "#B94E86", "#F0D9E6", 122, 60),
    "Theanine": ("cap", "#E9EBEE", "#F8F9FA", 122, 60),
    "Tyrosine": ("cap", "#EFEFEF", "#FAFAFA", 126, 62),
    "Taurine": ("cap", "#EDEDED", "#F9F9F9", 124, 60),
    "Carnitine": ("cap", "#F0EFEC", "#FAFAF8", 128, 62),
    "Glutamine": ("clear", "#E8DFC8", "#F3EEDF", 132, 64),
    "Creatine": ("clear", "#F2F0EA", "#FBFAF6", 134, 64),
    "BCAA": ("clear", "#EDE7D6", "#F7F3E8", 132, 64),
    "10B Probiotic": ("clear", "#DCD2BC", "#EFE9D9", 130, 62),
    "Soothing Fiber": ("clear", "#D8CDB4", "#EDE6D2", 132, 64),
    "Triphala": ("cap", "#6B4A2E", "#E3D6C6", 126, 62),
    "Ginger Root": ("cap", "#D9A441", "#F2E2C2", 124, 60),
    "Herbal Sleep Blend": ("cap", "#3F4B7A", "#DCE0EE", 126, 62),
    "Citrulline": ("clear", "#EFEDE6", "#FAF9F5", 134, 64),
    "Arginine": ("clear", "#ECEAE2", "#F8F7F2", 132, 64),
    "Forslean": ("cap", "#A56B3C", "#EDDCC8", 122, 60),
    "Glucosamine Sulfate": ("cap", "#CDBFA6", "#EFE8DA", 128, 62),
}
FALLBACK_PILLS = [
    ("cap", "#8A93A5", "#E4E7EC", 124, 60),
    ("tab", "#E2E0D8", "#E2E0D8", 86, 86),
    ("gel", "#E8A33D", "#E8A33D", 104, 76),
]

# Scatter zone: the upper surface, clear of the sachet that rises from the
# bottom edge. Rejection sampling keeps pills from overlapping.
ZONE = (140, 190, 1060, 760)   # x0, y0, x1, y1
MAX_PILLS = 7


def pill_style(name: str):
    if name in PILL_STYLE:
        return PILL_STYLE[name]
    idx = int(hashlib.sha256(name.encode()).hexdigest(), 16) % len(FALLBACK_PILLS)
    return FALLBACK_PILLS[idx]


def scatter(rec: dict) -> str:
    """Deterministic, non-overlapping placement seeded by the product id."""
    import random

    rng = random.Random(int(rec["id"]))
    actives = rec["ingredients"][:MAX_PILLS]
    placed, out = [], []
    x0, y0, x1, y1 = ZONE

    for name in actives:
        kind, cap, body, w, h = pill_style(name)
        for _ in range(400):
            cx = rng.uniform(x0 + w / 2, x1 - w / 2)
            cy = rng.uniform(y0 + h / 2, y1 - h / 2)
            r = max(w, h) / 2 + 16
            if all((cx - px) ** 2 + (cy - py) ** 2 > (r + pr) ** 2
                   for px, py, pr in placed):
                placed.append((cx, cy, max(w, h) / 2))
                rot = rng.uniform(-72, 72)
                out.append(
                    f'<div class="pill {kind}" style="left:{cx - w / 2:.1f}px;'
                    f'top:{cy - h / 2:.1f}px;width:{w}px;height:{h}px;'
                    f'transform:rotate({rot:.1f}deg);'
                    f'--cap:{cap};--body:{body}"><i></i></div>')
                break
    return "\n  ".join(out)


def tear_polygon(rec: dict) -> str:
    """Ragged top edge for the sachet — it has been torn open, the pills are out."""
    import random

    rng = random.Random(int(rec["id"]) ^ 0x5EED)
    pts, steps = [], 34
    for i in range(steps + 1):
        x = i * 100 / steps
        y = rng.uniform(1.0, 7.0) if i % 2 else rng.uniform(7.0, 15.0)
        pts.append(f"{x:.2f}% {y:.2f}%")
    pts.append("100% 100%")
    pts.append("0% 100%")
    return ", ".join(pts)


def actives_html(rec: dict) -> str:
    """The actives printed on the sachet face, one dosed row each.

    Long formulas are truncated rather than shrunk to unreadable type; the
    remainder is stated honestly as a count so the face never implies the pack
    holds fewer capsules than it does.
    """
    names = rec["ingredients"]
    shown, extra = names[:MAX_ACTIVES], len(names) - MAX_ACTIVES
    rows = [
        f'<li class="active"><span class="dose">1</span>'
        f'<span class="name">{html.escape(n)}</span></li>'
        for n in shown
    ]
    if extra > 0:
        rows.append(f'<li class="active"><span class="more">+ {extra} more actives</span></li>')
    return "".join(rows)


def build_html(rec: dict) -> str:
    tpl = template_path().read_text(encoding="utf-8")
    title = rec["display_name"]
    cls = "is-xlong" if len(title) > 30 else "is-long" if len(title) > 20 else ""
    when = when_for(rec)

    out = tpl
    for key, val in {
        "{{ACTIVES}}": actives_html(rec),
        "{{TITLE_CLASS}}": cls,
        "{{CAPSULES}}": scatter(rec),
        "{{TEAR}}": tear_polygon(rec),
        "{{CATEGORY}}": html.escape(rec["pack"]),
        "{{TITLE}}": html.escape(title),
        "{{NAME_CLASS}}": cls,
        "{{WHEN}}": when,
        "{{ICON}}": MOON if when == "NIGHT" else SUN,
        "{{QTY}}": str(rec["qty"]),
    }.items():
        out = out.replace(key, val)

    if "{{" in out:
        raise RuntimeError(f"unsubstituted placeholder for {rec['id']}")
    return out


def stage_a_qa(path: pathlib.Path, rec: dict) -> str | None:
    """Deterministic local checks. Returns an error string, or None on pass."""
    from PIL import Image, ImageStat

    if not path.exists():
        return "file missing"
    if path.stat().st_size < 10_000:
        return f"file suspiciously small ({path.stat().st_size}B)"
    try:
        with Image.open(path) as im:
            im.verify()
        with Image.open(path) as im:
            if im.size != (SIDE, SIDE):
                return f"wrong dimensions {im.size}"
            stat = ImageStat.Stat(im.convert("L"))
            if stat.stddev[0] < 8:
                return f"image looks blank (stddev {stat.stddev[0]:.1f})"
    except Exception as exc:  # noqa: BLE001 - report any decode failure verbatim
        return f"unreadable: {exc}"
    return None


def render(records: list[dict], verify: bool = False) -> list[tuple[dict, str | None, str]]:
    from playwright.sync_api import sync_playwright

    OUT_DIR.mkdir(exist_ok=True)
    results = []
    with sync_playwright() as p:
        # This image ships Chromium at a pinned revision that may not match the
        # one playwright-python expects, so point at whatever is on disk rather
        # than triggering a download.
        launch = {"args": ["--force-color-profile=srgb", "--disable-lcd-text"]}
        for candidate in sorted(pathlib.Path("/opt/pw-browsers").glob("chromium-*/chrome-linux/chrome")):
            launch["executable_path"] = str(candidate)
            break
        browser = p.chromium.launch(**launch)
        page = browser.new_page(viewport={"width": SIDE, "height": SIDE},
                                device_scale_factor=1)
        for rec in records:
            path = out_path(rec)
            page.set_content(build_html(rec), wait_until="load")
            page.screenshot(path=str(path), type="png")
            digest = hashlib.sha256(path.read_bytes()).hexdigest()[:16]

            if verify:
                page.set_content(build_html(rec), wait_until="load")
                again = page.screenshot(type="png")
                if hashlib.sha256(again).hexdigest()[:16] != digest:
                    results.append((rec, "non-deterministic render", digest))
                    continue

            results.append((rec, stage_a_qa(path, rec), digest))
        browser.close()
    return results


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--only", help="comma-separated product ids")
    ap.add_argument("--force", action="store_true", help="skip the fast path")
    ap.add_argument("--verify", action="store_true", help="render twice and compare")
    ap.add_argument("--variant", default="a", choices=sorted(VARIANTS),
                    help="which master template to render")
    args = ap.parse_args()

    global VARIANT
    VARIANT = args.variant

    reg = json.loads(REGISTRY.read_text())
    products = reg["products"]
    th = template_hash()

    if args.only:
        wanted = [products[i] for i in args.only.split(",") if i in products]
    else:
        wanted = list(products.values())

    # Fast path: unchanged config + unchanged template + an image already on
    # disk means there is nothing to do.
    todo, skipped = [], 0
    for rec in wanted:
        img = out_path(rec)
        fresh = (img.exists()
                 and rec.get(f"image_template_hash_{VARIANT}") == th
                 and rec.get(f"image_config_hash_{VARIANT}") == rec["config_hash"])
        if fresh and not args.force:
            skipped += 1
        else:
            todo.append(rec)

    print(f"SPADRA PACK RENDER   template {th}")
    print(f"  products:        {len(wanted)}")
    print(f"  already current: {skipped}")
    print(f"  to render:       {len(todo)}")
    if not todo:
        print("  image jobs required: 0")
        return 0

    results = render(todo, verify=args.verify)

    failures = []
    for rec, err, digest in results:
        if err:
            failures.append((rec, err))
            continue
        rec[f"image_template_hash_{VARIANT}"] = th
        rec[f"image_config_hash_{VARIANT}"] = rec["config_hash"]
        rec[f"image_sha_{VARIANT}"] = digest
        rec[f"image_status_{VARIANT}"] = "RENDERED"
        rec["status"] = "QA_PASSED"
        print(f"  ✓ {rec['display_name'][:38]:38} {when_for(rec):7} {digest}")

    for rec, err in failures:
        rec[f"image_status_{VARIANT}"] = "QA_FAILED"
        rec["status"] = "MANUAL_REVIEW"
        print(f"  ✗ {rec['id']} — {rec['display_name']}", file=sys.stderr)
        print(f"      Issue: {err}", file=sys.stderr)

    reg["template_hash"] = reg.get("template_hash", th)
    REGISTRY.write_text(json.dumps(reg, indent=1, ensure_ascii=False) + "\n")

    print(f"\n  rendered {len(results) - len(failures)}/{len(results)}"
          f"   failed {len(failures)}")
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
