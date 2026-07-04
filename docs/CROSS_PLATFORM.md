# Cross-Platform Plan

## Now (this repo, working)

- **Chrome / Brave / Edge / Vivaldi / Arc**: MV3, load unpacked or store.
- **Firefox**: same codebase — the manifest carries both `service_worker`
  (Chromium) and `background.scripts` (Gecko), plus `browser_specific_settings`.
  Firefox is the browser of much of this audience; it is a first-class target,
  not a port.

## Near (straightforward work)

- **Safari (macOS/iOS)**: Apple's `safari-web-extension-converter` wraps the
  same WebExtension. Tier-2 LLM falls back to Ollama-on-localhost (macOS) or
  heuristics-only (iOS). Requires an Apple developer account and an Xcode
  shell project — mechanical, ~a weekend, plus review friction.
- **Android via Firefox for Android**: Firefox on Android runs desktop
  WebExtensions. This is the cheapest mobile path and needs mostly popup-CSS
  work. Kiwi/Edge Canary also load Chrome extensions on Android.

## Mobile companion app (design)

A standalone app can't see inside other apps' feeds — that's a permission
reality, not a design failure. So the companion app is a **share-target
analyzer**, which matches how mobile misinformation actually moves (links and
screenshots forwarded in group chats):

1. User shares a link/text/screenshot from any app → TruthStrike appears in
   the share sheet.
2. Analysis runs locally: the same JS engine in a WebView/JS runtime
   (identical files — the engine is dependency-free by design), OCR via
   platform vision APIs for screenshots, optional on-device LLM
   (llama.cpp/MLC) on capable phones.
3. Result screen = the extension panel: score, techniques, ownership card,
   counter-narrative with sources, one-tap share-back into the chat where
   the link came from.

The share-back loop is the killer feature: the counter-narrative lands in the
same group chat as the propaganda, minutes later, with receipts.

Stack recommendation: React Native or Capacitor specifically because the
analysis engine is plain JS with zero dependencies — one engine, three
platforms, no rewrite. `analysis/` is the shared package.

## API for other tools

The engine is importable today (`require('extension/analysis/scorer.js')` —
see `tests/`). Publishing `@truthstrike/engine` to npm gives newsroom CMS
plugins, Discord/Matrix moderation bots, and researcher notebooks the same
detector. The data files (`ownership.json`, `organizations.json`,
`counters.json`) are separately importable as plain JSON — they are useful
datasets independent of the engine.
