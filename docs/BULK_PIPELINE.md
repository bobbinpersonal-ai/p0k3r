# Bulk product processing

How SPADRA content is generated across 66 (soon hundreds of) products without
burning model calls. The governing rule: **the application decides whenever a
normal program can decide reliably. A model is invoked only where it adds
something code cannot.**

## What this buys

Every piece of product copy now on the site — the 30-60-90 protocol plans, the
"You may also like" lists, the per-ingredient mechanism lines, the seven
category education blocks — was produced by deterministic code from a compact
table, not by asking a model per product. Re-running any of it produces
byte-identical output.

## The compact record

`scripts/spadra_registry.json` is the working representation. A Shopify product
reduces to this, and nothing downstream ever needs the full product object:

```json
{
  "id": "8382491623563",
  "handle": "glp-1-muscle-support-1",
  "display_name": "GLP-1 Muscle Preservation Pack",
  "pack": "GLP-1 Care",
  "category": "glp1-care",
  "ingredients": ["BCAA", "Carnitine", "Cordyceps", "Creatine", "DHEA"],
  "qty": 30,
  "time": "Day",
  "template_version": "1.0",
  "template_hash": "9f7ffe0d6dc6",
  "config_hash": "4b92aa56cf612007",
  "image_status": "SOURCED",
  "status": "READY"
}
```

Products are addressed by Shopify product ID throughout. Titles, descriptions,
variants and collections are fetched once at build time and not passed around
afterwards.

## Hashing and the fast path

```
config_hash  = sha256(display_name | pack | ingredients | qty | time)[:16]
template_hash = sha256(template identity)[:12]
```

A generated artifact is identified by `product_id + config_hash + template_hash`.
Before any expensive call:

```
approved artifact exists?  →  config_hash unchanged?  →  template_hash unchanged?
        │                            │                          │
        └────────────── all yes ─────┴──────────────────────────┘
                              ↓
                            REUSE — zero model calls
```

This is the first check in the pipeline, not the last. A second `GENERATE ALL`
run should report mostly skips.

## Status codes

`UNCONFIGURED → READY → GENERATING → QA_PENDING → QA_PASSED → UPLOADED`, with
`QA_FAILED → REGENERATING` and a terminal `MANUAL_REVIEW`. Completed products
are never reprocessed.

## Two-stage QA

Stage A is deterministic and local — required fields present, product ID match,
expected text present, filename, config hash, template version, image opens,
dimensions correct. Failures here are fixed in code and never reach a model.

Stage B (vision) runs only after Stage A passes, and only for what genuinely
needs eyes: packaging appearance, perspective, typography rendering, wordmark
placement, artifacts, similarity to the master template.

Where OCR is available it sits between the two: extract text, compare to the
expected config, and escalate to vision only on low confidence, an ambiguous
comparison, or a post-regeneration review.

## Batching and concurrency

Shopify reads and metafield writes are batched. The seven category education
blocks were written in **one** `metafieldsSet` call carrying one JSON metafield
per collection (~6.3 KB total) rather than 7 calls × 5 fields. The 132
protocol/related metafields went out in 6 calls, against a 25-item cap.

Independent products are processed concurrently with a bounded worker pool —
never unbounded fan-out — respecting Shopify's rate limits.

## Persisted decisions

Mappings that are deterministic are stored, never re-derived by a model:

- category → pack label (`CATEGORY_TO_PACK` in `scripts/build_registry.py`)
- product → audience (`spadra.audience`) and its counterpart pack
- ingredient → mechanism phrase (the `MECH` table)
- category → 30-60-90 objectives and expected experience (the `CATEGORY` table)

Name and pack assignments, once made, are read back from the registry.

## Logging

One line per product on success, detail only on failure:

```
✓ GLP-1 Muscle Preservation — GLP-1 Care — PASS — 1 attempt
✗ 8382491623563 — Beauty
  Issue: OCR mismatch
  Expected: Pooja's Daily
  Detected: Pooja's Dally
  Attempts: 3
  Status: MANUAL_REVIEW
```

A run opens with the plan, so cost is known before anything executes:

```
Products: 66
Already approved: 63    Need generation: 2    Manual review: 1
Model jobs required: 2  Skipped: 63
```

## Not yet built

The registry, hashing, status model, batching and deterministic content
generation are in place and in use. The **image** half — generation, OCR, and
vision QA against a master pack template — is specified here but not
implemented, because no image-generation or vision service is wired into this
project yet. The 66 current pack images were supplied, not generated.

When that service is added, it plugs in behind the fast-path check above; no
change to the registry format is needed.
