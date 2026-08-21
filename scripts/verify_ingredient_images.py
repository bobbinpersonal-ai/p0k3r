import json
import subprocess

BASE = "https://cdn.shopify.com/s/files/1/0758/4189/6587/files/"
m = json.load(open('scripts/ingredient_images.json'))
used = set()
reg = json.load(open('scripts/spadra_registry.json'))['products']
for p in reg.values():
    used.update(p['ingredients'])

bad = []
ok = 0
for name, fn in sorted(m.items()):
    url = BASE + fn
    code = subprocess.run(
        ['curl', '-s', '-o', '/dev/null', '-w', '%{http_code}', '-L', url],
        capture_output=True, text=True).stdout.strip()
    if code != '200':
        bad.append((name, fn, code))
    else:
        ok += 1

print("resolved OK: %d / %d" % (ok, len(m)))
if bad:
    print("FAILED:")
    for b in bad:
        print("  ", b)

missing = sorted(used - set(m))
print("\ningredients used but with NO photo (%d): %s" % (len(missing), missing))
unused = sorted(set(m) - used)
print("photos present but not used by any pack (%d): %s" % (len(unused), unused))
