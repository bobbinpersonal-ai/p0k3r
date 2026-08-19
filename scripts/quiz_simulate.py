import json, itertools, re

reg = json.load(open('spadra_registry.json'))['products']
AUD = {"nitric-oxide-women-spadra":"women","nitric-oxide-men-1":"men","womens-fertility-spadra":"women",
"pregnancy-pm-spadra":"women","pregnancy-am-spadra":"women","postnatal-support-spadra":"women",
"lactation-support-spadra":"women","pms-pack-spadra":"women","perimenopause-pack-spadra":"women",
"pcos-pack-spadra":"women","mens-wellness-1":"men","mens-fertility-1":"men","womens-wellness-1":"women",
"womens-hormone-pack-1":"women","mens-hormone-pack-1":"men"}
CAT2FILTER = {"bedroom-performance":"bedroom-performance","glp1-care":"glp1-care","focus-brain":"focus-brain",
"longevity-beauty":"longevity-beauty","detox-recovery":"detox-recovery","mens-womens-health":"mens-womens-health",
"immune-structural":"immune-structural"}

CATALOG=[]
for r in reg.values():
    CATALOG.append({"handle":r["handle"],"title":r["display_name"],
        "group":CAT2FILTER.get(r["category"], r["category"]),
        "components":r["ingredients"],"size":len(r["ingredients"]),
        "audience":AUD.get(r["handle"])})

Q=[
 {"q":"audience","a":[{"audience":"men"},{"audience":"women"},{"audience":None}]},
 {"q":"goal","multi":True,"a":[
  {"label":"Energy and stamina","w":{'energy-pack-spadra':10,'performance-pack-1':9,'muscle-preserve-pack-spadra':7,'adrenal-pack-spadra':6,'mineral-pack-spadra':4}},
  {"label":"Focus and clarity","w":{'focus-pack-spadra':10,'brain-pack-1':9,'nerve-support-pack-spadra':6,'psychedelic-neuro-integration-pack':4,'methylation-pack-spadra':4},"g":{'focus-brain':2}},
  {"label":"Sleep and stress recovery","w":{'sleep-pack-1':10,'sleep-pack-melatonin-spadra':9,'stress-pack-spadra':8,'adrenal-pack-spadra':7,'mood-support-pack-spadra':5}},
  {"label":"Healthy aging, skin and hair","w":{'longevity-nad-repair-pack':10,'beauty-hair-density-pack':9,'hair-pack-spadra':9,'clear-skin-cellular-radiance-pack':7,'antioxidant-pack-spadra':6},"g":{'longevity-beauty':2}},
  {"label":"Performance and circulation","w":{'nitric-oxide-men-1':10,'nitric-oxide-women-spadra':10,'performance-pack-1':8,'heart-health-spadra':6,'blood-pressure-pack-spadra':5}},
  {"label":"Everyday foundation","w":{'mens-wellness-1':9,'womens-wellness-1':9,'vegan-nutrient-pack-spadra':8,'mineral-pack-spadra':7,'immune-pack-spadra':6,'antioxidant-pack-spadra':6}}]},
 {"q":"challenge","multi":True,"a":[
  {"w":{'stress-pack-spadra':6,'adrenal-pack-spadra':5,'mood-support-pack-spadra':4,'sleep-pack-1':3}},
  {"w":{'performance-pack-1':6,'muscle-preserve-pack-spadra':5,'energy-pack-spadra':4,'joint-health-pack-spadra':3}},
  {"w":{'vegan-nutrient-pack-spadra':6,'mineral-pack-spadra':5,'gut-pack-spadra':4,'microbiome-pack-spadra':3}},
  {"w":{'womens-hormone-pack-1':6,'mens-hormone-pack-1':6,'perimenopause-pack-spadra':4,'thyroid-pack-spadra':4,'pms-pack-spadra':3}},
  {"w":{'mens-hormone-pack-1':5,'focus-pack-spadra':5,'energy-pack-spadra':4,'mood-support-pack-spadra':4}}]},
 {"q":"diff","multi":True,"a":[
  {"w":{'sleep-pack-1':6,'sleep-pack-melatonin-spadra':5,'brain-pack-1':3,'stress-pack-spadra':3}},
  {"w":{'energy-pack-spadra':6,'blood-sugar-pack-spadra':5,'focus-pack-spadra':3,'methylation-pack-spadra':3}},
  {"w":{'nitric-oxide-men-1':5,'nitric-oxide-women-spadra':5,'mens-hormone-pack-1':4,'womens-hormone-pack-1':4}},
  {"w":{'hair-pack-spadra':6,'beauty-hair-density-pack':6,'clear-skin-cellular-radiance-pack':5,'antioxidant-pack-spadra':3}},
  {"w":{'performance-pack-1':6,'muscle-preserve-pack-spadra':5,'pain-inflammation-spadra':4,'joint-health-pack-spadra':3}}]},
 {"q":"style","a":[{"style":"simple"},{"style":"comprehensive"},{"style":"open"}]},
]
QW=[0,2,1,1,1]; SW=1.5; MAXR=4; GOALQ=1

def eligible(ans):
    sel=ans[0]
    aud=Q[0]["a"][sel[0]]["audience"] if sel else None
    if not aud: return list(CATALOG)
    return [p for p in CATALOG if not p["audience"] or p["audience"]==aud]

def totals_of(ans,pool):
    t={p["handle"]:0.0 for p in pool}; style="open"
    for qi,sel in enumerate(ans):
        if not sel: continue
        mult=(QW[qi] or 1)/len(sel)
        for ai in sel:
            opt=Q[qi]["a"][ai]
            if opt.get("style"): style=opt["style"]
            for h,v in (opt.get("w") or {}).items():
                if h in t: t[h]+=v*mult
            for h,v in (opt.get("g") or {}).items():
                for p in pool:
                    if p["group"]==h: t[p["handle"]]+=v*mult
    for p in pool:
        n=p["size"]
        if not n: continue
        if style=="simple": t[p["handle"]]+=max(0,8-n)*SW
        elif style=="comprehensive": t[p["handle"]]+=n*SW
    return t

def picks_of(ans):
    pool=eligible(ans); t=totals_of(ans,pool)
    ranked=sorted([p for p in pool if t[p["handle"]]>0], key=lambda p:(-t[p["handle"]],p["title"]))
    picks=[]; seen=set()
    for ai in ans[GOALQ]:
        if len(picks)>=MAXR: break
        opt=Q[GOALQ]["a"][ai]
        for p in ranked:
            if p["handle"] in seen: continue
            if not opt["w"].get(p["handle"]): continue
            seen.add(p["handle"]); picks.append((p,opt["label"])); break
    for p in ranked:
        if len(picks)>=MAXR or p["handle"] in seen: continue
        seen.add(p["handle"]); picks.append((p,""))
    return picks

def stacknote(picks):
    if len(picks)<2: return ""
    a,b=picks[0][0],picks[1][0]
    inb={x.lower() for x in b["components"]}
    shared=[x for x in a["components"] if x.lower() in inb]
    if not shared: return "no-overlap"
    if len(shared)<=2: return "small-overlap:"+",".join(shared)
    return f"big-overlap:{len(shared)}"

# ---- exhaustive-ish test ----
leaks=empty=0; runs=0; notes={}; goalmiss=0
goal_sets=[list(c) for r in range(1,4) for c in itertools.combinations(range(6),r)]
for aud in range(3):
    for gs in goal_sets:
        for ch in ([0],[1,3],[0,2,4]):
            for df in ([2],[0,4]):
                for st in range(3):
                    ans=[[aud],gs,ch,df,[st]]
                    ps=picks_of(ans); runs+=1
                    if not ps: empty+=1; continue
                    want = Q[0]["a"][aud]["audience"]
                    if want:
                        for p,_ in ps:
                            if p["audience"] and p["audience"]!=want: leaks+=1
                    labeled={lab for _,lab in ps if lab}
                    if len(labeled) < min(len(gs),MAXR): goalmiss+=1
                    n=stacknote(ps); notes[n.split(':')[0]]=notes.get(n.split(':')[0],0)+1
                    if len({p["handle"] for p,_ in ps})!=len(ps): print("DUPE!",ans)

print(f"runs                 {runs}")
print(f"cross-gender leaks   {leaks}")
print(f"empty results        {empty}")
print(f"goals unrepresented  {goalmiss}")
print(f"stack notes          {notes}")
