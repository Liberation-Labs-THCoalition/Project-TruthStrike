// TruthStrike 2.0 — Background Service Worker
//
// Small on purpose. Jobs:
//   * Tier-2 local LLM analysis + counter-narrative generation (llm.js) —
//     runs here so content scripts don't fight page CSP for localhost fetches.
//   * Live receipts lookups (ProPublica 990s / FEC) on explicit user click.
//   * Toolbar badge count per tab.
//   * Context menu: analyze selection.
//
// There is no telemetry endpoint. Search this file: zero non-user-initiated
// network calls, and every host is either localhost or a public records API.

// Chrome runs this as a service worker (importScripts); Firefox loads the
// module files via the manifest background.scripts array first, so here they
// are already present and importScripts doesn't exist.
if (typeof importScripts === 'function' && !(globalThis.TS && globalThis.TS.llm)) {
  importScripts(
    'analysis/taxonomy.js',
    'analysis/lexicons.js',
    'analysis/heuristics.js',
    'analysis/scorer.js',
    'analysis/feedback.js',
    'analysis/llm.js',
    'money/money.js',
    'counter/counter.js',
    'network/fingerprint.js'
  );
}

var TSBG = globalThis.TS;

async function getSettings() {
  var d = await chrome.storage.local.get(['settings']);
  var s = d.settings || {};
  return {
    llm: Object.assign({ enabled: true, ollamaUrl: 'http://localhost:11434', ollamaModel: 'qwen2.5:1.5b-instruct' }, s.llm || {}),
    fecKey: s.fecKey || null
  };
}

chrome.runtime.onMessage.addListener(function (req, sender, sendResponse) {
  (async function () {
    try {
      switch (req.type) {
        case 'tier2-analyze': {
          var cfg = (await getSettings()).llm;
          var j = await TSBG.llm.analyze(req.text, cfg);
          sendResponse(j); // may be null; content script treats Tier 2 as optional
          break;
        }
        case 'counter-generate': {
          var cfg2 = (await getSettings()).llm;
          var out = await TSBG.llm.counterNarrative(req.text, req.scored || { top: [] }, cfg2);
          sendResponse(out);
          break;
        }
        case 'nonprofit-search': {
          var res = await TSBG.money.nonprofitSearch(req.name);
          sendResponse(res);
          break;
        }
        case 'nonprofit-filings': {
          sendResponse(await TSBG.money.nonprofitFilings(req.ein));
          break;
        }
        case 'fec-receipts': {
          var st = await getSettings();
          sendResponse(await TSBG.money.fecReceipts(req.name, st.fecKey));
          break;
        }
        case 'llm-status': {
          var cfg3 = (await getSettings()).llm;
          sendResponse(await TSBG.llm.detectBackend(cfg3));
          break;
        }
        case 'flag-count': {
          if (sender.tab && sender.tab.id != null) {
            chrome.action.setBadgeText({ tabId: sender.tab.id, text: String(req.count || '') });
            chrome.action.setBadgeBackgroundColor({ tabId: sender.tab.id, color: '#e5484d' });
          }
          sendResponse({ ok: true });
          break;
        }
        default:
          sendResponse(null);
      }
    } catch (e) {
      sendResponse(null);
    }
  })();
  return true; // async response
});

// Context menu: analyze highlighted text anywhere, results via notification-
// style popup window is overkill — we just flag inline by asking the tab to
// rescan (selection is part of the page; the scan will catch its container).
chrome.runtime.onInstalled.addListener(function () {
  chrome.contextMenus.create({
    id: 'truthstrike-scan',
    title: 'TruthStrike: scan this page',
    contexts: ['page', 'selection']
  });
});

chrome.contextMenus.onClicked.addListener(function (info, tab) {
  if (info.menuItemId === 'truthstrike-scan' && tab && tab.id != null) {
    chrome.tabs.sendMessage(tab.id, { type: 'scan-now' }, function () {
      void chrome.runtime.lastError; // tab without content script — fine
    });
  }
});
