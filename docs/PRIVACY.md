# TruthStrike Privacy Architecture

The threat model is honest: a tool that flags propaganda will be used by
people whom powerful actors would like to enumerate. So the privacy posture
is not a policy — it's an architecture, checkable in the code.

## The five commitments

1. **All analysis is local.** Heuristics run in the content script. LLM
   analysis runs on Chrome's on-device model or a localhost Ollama server.
   There is no cloud analysis path in the codebase — not disabled, not
   opt-in: *absent*. Adding one requires editing source, which is the point.

2. **No telemetry.** No analytics, no crash reporting, no update pings beyond
   the browser store's own mechanism. `grep -r "fetch(" extension/` returns:
   extension-local data files, `localhost:11434`, and two public-records APIs.

3. **Network calls are user-initiated and content-free.** ProPublica 990 and
   FEC lookups fire only when you click "Pull receipts", and the query is an
   organization name from our bundled public database — never page content,
   never URLs, never anything derived from your browsing.

4. **Local state is yours and legible.** Feedback calibration, statistics,
   and narrative sightings live in `chrome.storage.local`, documented in
   plain schema, cleared with one button in Options. The coordination
   "field notebook" maps only what *your* browsing encountered and never
   leaves the device.

5. **The community layer is opt-in, pseudonymous, and self-hostable.** If you
   join an instance: annotations are addressed by URL hash, identity is a
   client-side keypair, trend reports carry technique IDs only and are
   published with differential-privacy noise. Whistleblower submissions are
   refused and redirected to SecureDrop — we do not carry that risk for you,
   because we could not carry it well.

## What the browser store sees

Store distribution reveals the install to the store vendor (that's true of
every extension). For higher-risk users, the extension loads unpacked from a
git checkout — the README documents this path first, deliberately.

## Data flow diagram

```
page text ──► content script (heuristics) ──► badge/panel   [device only]
                    │
                    ├─► background worker ──► Chrome on-device model  [device only]
                    │                    └──► localhost Ollama        [device only]
                    │
user click ─────────┴─► ProPublica / FEC  (org name from public DB only)
opt-in daily ─────────► community relay   (technique IDs + DP noise only)
```

## Auditing this yourself

- `extension/` has no build step: the code you read is the code that runs.
- Search for network calls: `grep -rn "fetch(\|XMLHttpRequest\|WebSocket" extension/`
- The manifest requests three host permissions: ProPublica, FEC, localhost.
  A permissions diff on any update is a one-line review.
