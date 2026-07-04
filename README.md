# ⚡ TruthStrike 2.0

**Local-first manipulation detection for your browser.**
Scores the rhetorical machinery of what you read, shows who owns the outlet
and who funds the narrative, and arms you with sourced counter-speech.
Nothing you read ever leaves your device.

Built for community organizers and local journalists. No account, no cloud,
no telemetry, no build step — the code you can read is the code that runs.

## What it does

- **Detects manipulation *technique*, not topics.** Eighteen detectors —
  fear appeals, consensus faking, menace metaphors, phantom "experts say"
  attribution, naked statistics, stakes inflation — organized under the
  threat/social/reward pathway model from the Oracle Loop deception research.
  A fact-check quoting a lie scores ~0. A lie scores like a lie, even if
  nobody's seen that particular lie before.
- **Scores a spectrum, never a verdict.** 0–100 Manipulation Index with
  confidence, per-pathway breakdown, and plain-language explanations of every
  matched technique. Annotates; never hides or dims content.
- **Follow the Money.** Who owns this outlet (48-domain database with
  receipts links), who funds this narrative (22 influence orgs), and live
  IRS 990 / FEC lookups — fired only when you click, queried only with
  public org names.
- **Counter-narratives with receipts.** Topic-agnostic technique counters,
  sourced rebuttals for known narrative families, optional local-LLM
  drafting, one-click share (you always review first).
- **Coordination detection.** Fingerprints high-scoring narratives locally
  and shows you when the same talking points hit 3+ different domains within
  72 hours of each other in your browsing — with a cascade timeline.
- **Learns from you.** 👍/👎 on flags recalibrates technique weights
  on-device. Your calibration is yours; it never syncs anywhere.

## Install (2 minutes)

**Chrome / Brave / Edge:** `chrome://extensions` → enable *Developer mode* →
*Load unpacked* → select the `extension/` folder.

**Firefox:** `about:debugging` → *This Firefox* → *Load Temporary Add-on* →
pick any file in `extension/`.

**Optional local model (sharper analysis + drafted counter-speech):**
install [Ollama](https://ollama.com), then `ollama pull qwen2.5:1.5b-instruct`
(~1 GB). TruthStrike finds it automatically. Chrome's built-in on-device
model is used if present. There is no cloud option — by design.

## Verify it yourself

```bash
node tests/run_tests.cjs        # 16 checks: detection, calibration, money,
                                # counter, coordination — all offline
grep -rn "fetch(" extension/    # audit the complete network surface
```

## Project layout

| Path | What |
|---|---|
| `extension/analysis/` | The detection engine (plain JS, zero dependencies, importable in Node) |
| `extension/data/` | Ownership, influence-org, and counter-narrative databases (plain JSON, PRs welcome) |
| `server/` | Optional self-hostable community relay (annotations, verified reporters, DP trend stats) |
| `docs/` | Privacy architecture, Oracle research integration, community & cross-platform design |
| `FABLE_REBUILD.md` | Full architecture, status, and deployment plan |
| `legacy/` | v1 (October 2025), preserved |

## Contributing

- **Data PRs** are the easiest high-impact contribution: ownership entries,
  org receipts, counter-narrative sources. Every claim needs a public link.
- **Lexicon PRs**: new technique cues — machinery only, never topic words
  (that rule is load-bearing; see `extension/analysis/lexicons.js`).
- **Languages**: the taxonomy is language-agnostic; the cues are English.
  A `lexicons.<lang>.js` is a self-contained contribution.
- **False positives/negatives**: open an issue with the text and the score
  from the "Why flagged" panel.

## License

CC-BY-SA 4.0. Use it, fork it, ship it — keep it open.

---

*"In a time of universal deceit, telling the truth is a revolutionary act."*

Built by the Transparent Humboldt Coalition. **Solidarity forever.**
