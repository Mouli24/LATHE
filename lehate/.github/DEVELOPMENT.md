# LATHE Runbook

Hour-by-hour checklist for the v0 sprint.

---

## Phase 1 — Skeleton + ElevenLabs (target: 2h)

- [x] Repo structure created
- [x] `.env.example` and `.gitignore` written
- [x] `runner/providers/base.py` — `Provider` ABC + `SynthesisResult` dataclass
- [x] `runner/providers/elevenlabs.py` — ElevenLabs Turbo v2.5
- [x] `runner/main.py` — minimal orchestrator
- [x] Verified: ElevenLabs produces playable audio ← **checkpoint**

---

## Phase 2 — All Providers + results.json (target: +3h)

- [x] `runner/providers/smallest.py` — Smallest.ai Lightning V3
- [x] `main.py` runs all providers × all tests via `asyncio.gather` + `Semaphore(6)`
- [x] `dashboard/public/results.json` written with correct shape
- [x] Verified full corpus run ← **checkpoint**

Notes:
- ElevenLabs requires paid plan for library voices via API
- Smallest.ai working on free tier: avg_ttfb ~2286ms, avg_total ~3837ms

---

## Phase 3+4 — Dashboard (target: +6h)

- [x] Vite + React + TypeScript scaffolded
- [x] Tailwind v3 installed
- [x] shadcn UI primitives (badge, select, card) written inline
- [x] `App.tsx` fetches `results.json`, renders with filters
- [x] `ResultsTable.tsx` — audio players + TTFB badges + error states
- [x] `Filters.tsx` — category select + provider toggles
- [x] `LatencyChart.tsx` — recharts horizontal grouped bar
- [x] Build passes (`npm run build`)
- [ ] Verified in browser ← **checkpoint**

---

## Phase 5 — README + Vercel (target: +2h)

- [x] `README.md` with tagline, categories, findings table (fill after full run)
- [x] `RUNBOOK.md` (this file)
- [x] `vercel.json` — static build config

---

## Pre-publish Checklist

- [ ] Fill README headline findings table with real numbers
- [ ] Push to GitHub
- [ ] Connect repo to Vercel → import → deploy
- [ ] Copy `dashboard/public/audio/` + `dashboard/public/results.json` into the repo (they're gitignored — either unignore or upload separately)
- [ ] Verify Vercel deploy plays audio at the live URL
- [ ] Write tweet thread

---

## Notes for Full Run

```bash
# Run full corpus (all providers)
python runner/main.py

# Check results
python -c "
import json
r = json.load(open('dashboard/public/results.json'))
for p in r['providers']:
    outs = [t['outputs'].get(p) for t in r['results']]
    ok = [o for o in outs if o and o['ttfb_ms'] is not None]
    err = [o for o in outs if o and o['error']]
    if ok:
        avg = sum(o['ttfb_ms'] for o in ok) / len(ok)
        print(f'{p:12s} avg_ttfb={avg:.0f}ms  ok={len(ok)}  errors={len(err)}')
    else:
        print(f'{p:12s} no successful calls  errors={len(err)}')
"
```
