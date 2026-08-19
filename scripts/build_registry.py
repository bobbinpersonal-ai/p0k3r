#!/usr/bin/env python3
"""Build the compact SPADRA product registry from a catalog export.

One Shopify read produces catalog.json; everything downstream works from the
compact records this writes, so full product objects are never passed around.
Deterministic: same input, byte-identical output, stable config hashes.

Usage:  python3 scripts/build_registry.py catalog.json > /dev/null
"""
import hashlib
import json
import sys

TEMPLATE_VERSION = "1.0"
TEMPLATE_HASH = hashlib.sha256(b"spadra-pack-card-v1").hexdigest()[:12]

CATEGORY_TO_PACK = {
    "bedroom-performance": "Bedroom Performance",
    "glp1-care": "GLP-1 Care",
    "focus-brain": "Focus & Brain",
    "longevity-beauty": "Longevity & Beauty",
    "detox-recovery": "Detox & Recovery",
    "mens-womens-health": "Men's & Women's Health",
    "immune-structural": "Immune & Structural Health",
}


def time_of_day(handle):
    if handle.endswith(("-pm-1", "-pm-spadra")):
        return "PM"
    if handle.endswith(("-am-1", "-am-spadra")):
        return "AM"
    return "Day"


def config_hash(rec):
    """Hash only the fields that change what gets rendered or generated."""
    basis = "|".join([
        rec["display_name"],
        rec["pack"],
        ",".join(rec["ingredients"]),
        str(rec["qty"]),
        rec["time"],
    ])
    return hashlib.sha256(basis.encode()).hexdigest()[:16]


def build(catalog):
    registry = {}
    for p in catalog:
        gid = p["id"].rsplit("/", 1)[-1]
        rec = {
            "id": gid,
            "handle": p["handle"],
            "display_name": p["title"],
            "pack": CATEGORY_TO_PACK.get(p["filter"], p["filter"]),
            "category": p["filter"],
            "ingredients": sorted(p.get("components") or []),
            "qty": 30,
            "time": time_of_day(p["handle"]),
            "template_version": TEMPLATE_VERSION,
            "template_hash": TEMPLATE_HASH,
            "image_status": "SOURCED",
            "status": "READY",
        }
        rec["config_hash"] = config_hash(rec)
        registry[gid] = rec
    return {
        "template_version": TEMPLATE_VERSION,
        "template_hash": TEMPLATE_HASH,
        "count": len(registry),
        "products": registry,
    }


def plan(new, old):
    """What a bulk run would actually do. Print before spending anything."""
    prev = (old or {}).get("products", {})
    skip = gen = regen = 0
    for pid, rec in new["products"].items():
        was = prev.get(pid)
        if not was:
            gen += 1
        elif (was.get("config_hash") == rec["config_hash"]
              and was.get("template_hash") == rec["template_hash"]
              and was.get("status") in ("QA_PASSED", "UPLOADED", "READY")):
            skip += 1
        else:
            regen += 1
    return skip, gen, regen


if __name__ == "__main__":
    src = sys.argv[1] if len(sys.argv) > 1 else "catalog.json"
    out_path = "scripts/spadra_registry.json"
    try:
        old = json.load(open(out_path))
    except (OSError, ValueError):
        old = None

    reg = build(json.load(open(src)))
    skip, gen, regen = plan(reg, old)

    with open(out_path, "w") as fh:
        json.dump(reg, fh, indent=1, ensure_ascii=False)
        fh.write("\n")

    print(f"Products: {reg['count']}", file=sys.stderr)
    print(f"  unchanged (skip): {skip}", file=sys.stderr)
    print(f"  need generation:  {gen}", file=sys.stderr)
    print(f"  need regeneration:{regen}", file=sys.stderr)
    print(f"  model jobs required: {gen + regen}", file=sys.stderr)
