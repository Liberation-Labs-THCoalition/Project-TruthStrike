# TruthStrike 2.0 — The Fable Rebuild

**Date:** 2026-07-03 · **Built by:** CC (Coalition Code) with Fable 5
**Lineage:** v1 (October 2025, preserved in `legacy/`) → v2 (this)

v1 was CC's first independent build: regex patterns, a Flask server, a red
border around lies. It worked — and it had a fatal flaw and a dated
architecture. v2 keeps the mission and rebuilds everything on what we learned
in the year between: the Oracle Loop deception research, and the fact that
small local models became free infrastructure.

**The mission, unchanged:** put deception detection in the hands of the
people who need it — community organizers and local journalists, not ML
researchers.

---

## The core insight (what v1 got wrong)

v1 detected **topics**: `/stolen\s+election/gi`. That flags every debunking
article, every news report, every researcher — anyone *discussing* the lie.
It could never work, and worse, it made the tool the caricature its enemies
wanted: a list of forbidden sentences.

v2 detects **technique**: *how* text manipulates, never *what* it discusses.
Consensus-faking, stakes inflation, menace metaphors, naked statistics,
phantom attribution. Techniques are topic-agnostic — the detector works on
narratives that don't exist yet, and a fact-check quoting the propaganda
verbatim scores near zero because it *practices* good evidence while
*mentioning* bad rhetoric.

Measured (in `tests/`, all green):

| Text | Manipulation Index |
|---|---|
| Multi-pathway synthetic rage-bait | **67** (high) |
| Dehumanization/menace sample | **47** |
| Fact-check article quoting those same claims | **2** |
| Furious op-ed *with citations* (court records, CDC data) | **0** |
| Straight news, science news, product review | **0–4** |

That last contrast is the whole design: **fury with receipts is journalism;
fury without them is the signature.**

## The Oracle Loop transfer

The taxonomy and scorer are shaped by the consequentiality decomposition work
(see `docs/ORACLE_INTEGRATION.md` for the full mapping):

1. **Consequentiality substrate → stakes-gap scoring.** Deception rides on
   how much the output *matters*. In text: manipulation is the gap between
   claimed stakes and offered evidence. `stakes_inflation` is scored on that
   gap, not on stakes language alone.
2. **Three pathway signatures → taxonomy spine.** Threat / social / reward —
   the same three levers, aimed at the reader instead of routed through
   model internals.
3. **Computational commitment → multi-pathway bonus.** Engineered propaganda
   runs all three levers at once (close every exit); honest heat runs one.
   Superlinear score/confidence bonus for pathway agreement.
4. **Judge-noise lessons → meta-discourse guard.** Text *about* manipulation
   discounts by up to 85%. This is the debunker fix.

---

## Architecture

```
extension/                      ← MV3 WebExtension, Chrome+Firefox, NO build step
├── analysis/                   ← the engine (plain JS, zero deps, Node-testable)
│   ├── taxonomy.js             18 techniques / 5 pathways, severity bands
│   ├── lexicons.js             cue regexes (machinery only — zero topic words)
│   ├── heuristics.js           Tier 1: quote discounting, naked-number & phantom-
│   │                           attribution structural checks, meta-discourse density
│   ├── scorer.js               spectrum score 0–100 + confidence; stakes-gap;
│   │                           commitment multiplier; LLM blending
│   ├── feedback.js             per-technique Beta-posterior calibration (on-device)
│   └── llm.js                  Tier 2: Chrome Prompt API → Ollama → none. No cloud.
├── money/money.js              ownership lookup + ProPublica 990 + FEC adapters
├── counter/counter.js          technique scripts, sourced rebuttals, LLM drafting, share intents
├── network/fingerprint.js      MinHash narrative signatures, 3-domain/72h coordination
│                               clusters, paste-army scoring — all local
├── content/                    extract (platform-aware) → assess → shadow-DOM overlay
├── background.js               LLM + receipts proxy, badge counts, context menu
├── popup/ options/ dashboard/  stat tiles, pathway bars, cascade timelines,
│                               calibration table (palette CVD-validated, light+dark)
└── data/                       ownership.json (48 domains) · organizations.json
                                (22 orgs w/ receipts links) · counters.json
                                (9 narrative families + 18 technique scripts)
server/                         ← OPTIONAL community relay (FastAPI prototype)
tests/                          ← node tests/run_tests.cjs — 16/16 green
docs/                           ← ORACLE_INTEGRATION · PRIVACY · COMMUNITY_LAYER · CROSS_PLATFORM
legacy/                         ← v1, preserved intact
```

**No build step is a feature.** The code that reviewers read is the code that
runs. For a tool whose users include people at risk, auditability beats
toolchain ergonomics.

### The three-tier detection ladder

| Tier | What | Cost | Availability |
|---|---|---|---|
| 1 | Heuristic engine (lexicons + structural analysis) | ~ms, free | Always |
| 2 | Local LLM refinement (Chrome on-device model, or Ollama `qwen2.5:1.5b-instruct`) | ~1s | If installed |
| 3 | — | — | **There is no Tier 3. No cloud path exists in the code.** |

Tier 1 stands alone (all test results above are Tier-1-only). Tier 2 blends
in at 45% weight and can flag techniques heuristics miss.

### Learning from feedback

Every flag asks "was this useful?" 👍/👎 updates a Beta(α,β) posterior per
technique, on-device; posterior means become score multipliers (0.4×–1.6×).
A user who finds `hedge_laundering` flags noisy will stop seeing them without
ever touching a setting. Verified: sustained downvotes move a 67-score text
to 21.

---

## Mission scorecard (the 7 asks)

| # | Ask | Status |
|---|---|---|
| 1 | LLM detection engine, spectrum scoring, feedback learning | ✅ **Built + tested.** Technique taxonomy, 0–100 spectrum w/ confidence, three-tier local ladder, Beta-posterior feedback. |
| 2 | Follow the Money 2.0 | ✅ **Built.** Ownership DB (48 domains, receipts links), influence-org DB (22 orgs), live ProPublica 990 + FEC pulls on user click, ownership chip + panel tab. OpenSecrets API is dead (2025) — replaced with FEC (better: primary source) + ProPublica. |
| 3 | Counter-narrative engine | ✅ **Built.** 18 topic-agnostic technique scripts, 9 sourced narrative-family rebuttals, local-LLM drafting w/ style rules, one-click share (X/Bluesky/Mastodon/Threads/FB) — user always reviews before sending. Community voting: in relay prototype. |
| 4 | Network analysis | ✅ **Built (local) + designed (federated).** MinHash fingerprints, cross-domain coordination clusters w/ cascade timelines in dashboard, paste-army detection on feeds. Federated (opt-in, DP-noised) trend aggregation: prototyped in relay. |
| 5 | Community layer | 🔶 **Prototype + design.** FastAPI relay: hash-addressed annotations, pseudonymous keys, verified-reporter badges, DP trend stats. Whistleblowing deliberately redirected to SecureDrop (`docs/COMMUNITY_LAYER.md` explains why). Needs: server-side sig verification, pilot newsroom. |
| 6 | Privacy-first | ✅ **Built as architecture, not policy.** Zero telemetry; grep-auditable network surface (3 hosts: ProPublica, FEC, localhost); all state local + one-button erase. `docs/PRIVACY.md`. |
| 7 | Cross-platform | ✅ Chrome+Firefox from one codebase (manifest carries both background styles). 🔶 Safari = converter + Xcode shell (designed). 🔶 Mobile = share-target companion app design; engine is dependency-free JS precisely so it ports without rewrite (`docs/CROSS_PLATFORM.md`). |

## What v2 deliberately removed

- **The Flask report-home server.** v1 posted user reports to `localhost:5000`
  and dreamed of a central database of what users saw. That's a surveillance
  liability wearing a liberation t-shirt. Gone; the community layer is opt-in,
  federated, and content-blind instead.
- **Auto-dimming flagged content** (opacity 0.6 + red border). We annotate;
  we never obscure. A tool that hides text is doing the censor's job with
  the censor's UX, and it converts nobody.
- **"Body count" money-trail rhetoric.** v1's org cards included lines like
  "Body Count: ~200,000 deaths." v2's cards state documented facts with
  receipts links (990s, court settlements, FEC records). We win on evidence
  quality or we don't deserve to.
- **Fake impact stats** ($50M "money exposed" per flag). The dashboard now
  counts real things only.

## Deployment plan

**Phase 0 — now.** Load unpacked (`chrome://extensions` → Developer mode →
`extension/`). Firefox: `about:debugging` → Load Temporary Add-on. Run tests:
`node tests/run_tests.cjs`.

**Phase 1 — hardening (1–2 weeks).**
- Fixture corpus expansion: 100+ real-world texts (news, opinion, propaganda,
  debunks) scored blind by humans → precision/recall baseline; tune HALF
  constants against it.
- Live-page QA across the platform selector set (X, Reddit, FB, YouTube — 
  selectors rot; test weekly).
- Firefox MV3 event-page QA; Ollama timeout tuning on low-end hardware.

**Phase 2 — release (weeks 3–6).**
- AMO first (Firefox review is compatible with our no-build, no-minification
  stance), Chrome Web Store second. Signed releases from CI with reproducible
  zips.
- `@truthstrike/engine` npm package (engine + data files) for bots, CMS
  plugins, researchers.

**Phase 3 — community pilot (quarter).**
- One partner newsroom runs the relay; 5–10 verified reporters; server-side
  ed25519 enforcement; moderation-load report.
- Opt-in DP trend dashboard: "what's surging this week" for organizers.

**Phase 4 — research loop.**
- Fine-tuned 1–2B rhetoric-probe model for Tier 2 (trained on Oracle-labeled
  data), distributed via Ollama registry.
- SAE-feature-derived cues decompiled into auditable Tier-1 lexicon entries.
- Field-feedback data (aggregated, DP) as human-side validation of the
  threat/social/reward decomposition. That's a paper.

## Honest limitations

- English-only lexicons today. The taxonomy is language-agnostic; the cues
  are not. i18n is a contributor invitation, structured to make it easy
  (one file per language).
- Heuristics can be gamed by an adversary who reads them (they're public).
  Mitigations: technique diversity (gaming all 18 while still manipulating
  is nearly self-defeating), Tier-2 LLM (not cue-based), and the feedback
  loop. Security-through-obscurity was never on the table for an auditable
  tool.
- Manipulation ≠ falsehood. The panel says this explicitly: TruthStrike
  scores machinery, the user judges truth. A true cause argued with
  manipulative technique will flag — and should.
- Ownership/org data ages. Every entry carries `as_of` and receipts links;
  the DB is a JSON file designed for community PRs.

---

*v1's README said: "The fascists have better funding. We have better code."
Still true. Now the code is actually better.*
