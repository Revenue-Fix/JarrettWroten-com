#!/usr/bin/env python3
"""The business name lives in _brand/name.json. To change it:
  1. edit "name" (and "wordmark_suffix", or set it to "" to drop the small "Web Design" under the logo)
  2. python3 _brand/swap_name.py            (dry run: lists every file and count)
  3. python3 _brand/swap_name.py --apply    (rewrites the site, then records the new name as current)
Folders starting with _ are not published by GitHub Pages. /audit/, /demos/ and /demo/ are left alone."""
import json, os, re, sys
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CFG = os.path.join(ROOT, "_brand", "name.json")
STATE = os.path.join(ROOT, "_brand", ".current.json")
SKIP = ("audit", "demos", "demo", "jarrettwroten-site", "preview-shared", "node_modules", ".git", "_brand")
cfg = json.load(open(CFG))
cur = json.load(open(STATE)) if os.path.exists(STATE) else {"name": "Jarrett Wroten Web Design", "wordmark_suffix": "Web Design"}
apply = "--apply" in sys.argv
old, new = cur["name"], cfg["name"]
osuf, nsuf = cur["wordmark_suffix"], cfg["wordmark_suffix"]
if old == new and osuf == nsuf:
    print("Nothing to change: name.json matches the site."); sys.exit(0)
total = 0
for root, dirs, files in os.walk(ROOT):
    rel = os.path.relpath(root, ROOT)
    if rel.split(os.sep)[0] in SKIP: dirs[:] = []; continue
    for f in files:
        if not f.endswith((".html", ".xml", ".json", ".js", ".txt")): continue
        p = os.path.join(root, f); s0 = s = open(p, encoding="utf-8").read()
        s = s.replace(old, new)
        if osuf != nsuf:
            if nsuf:
                s = s.replace(f'<span class="wm-d">{osuf}</span>', f'<span class="wm-d">{nsuf}</span>')
            else:
                s = s.replace(f' <span class="wm-d">{osuf}</span>', "").replace(f'<span class="wm-d">{osuf}</span>', "")
                # the hand-drawn "Web Design" in the intro is artwork; without its span the script skips it
                s = re.sub(r'<br><span class="iwd">[^<]*</span>', "", s)
        if s != s0:
            n = s0.count(old); total += 1
            print(f"{os.path.relpath(p, ROOT)}: {n} name match(es)")
            if apply: open(p, "w", encoding="utf-8").write(s)
print(f"{total} files {'changed' if apply else 'would change'}.")
if nsuf and osuf != nsuf: print("Note: the intro's hand-drawn suffix is artwork and still says the old words; it needs a new drawing.")
if apply: json.dump(cfg, open(STATE, "w"), indent=2)
