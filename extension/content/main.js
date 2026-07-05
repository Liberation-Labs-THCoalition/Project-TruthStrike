// TruthStrike 2.0 — Content Orchestrator
//
// Pipeline per content unit:
//   extract → heuristic assess (Tier 1, sync, ~instant)
//     → if band ≥ elevated: badge
//     → if band ≥ high: fingerprint for coordination log + offer Tier 2
//        refinement via the background worker's local LLM (if configured)
//
// All storage is chrome.storage.local. Nothing is transmitted anywhere, ever.

(function () {
  'use strict';
  if (window.__truthstrikeActive) return;
  window.__truthstrikeActive = true;

  var TS = globalThis.TS;
  var settings = {
    enabled: true, autoScan: true, ownerChip: true, minBand: 25,
    llm: { enabled: true, ollamaUrl: 'http://localhost:11434', ollamaModel: 'qwen2.5:1.5b-instruct' }
  };
  var calibration = {};
  var processed = new WeakSet();
  var flaggedCount = 0;
  var scanScheduled = false;

  function send(msg) {
    return new Promise(function (resolve) {
      try {
        chrome.runtime.sendMessage(msg, function (res) {
          if (chrome.runtime.lastError) resolve(null);
          else resolve(res);
        });
      } catch (e) { resolve(null); }
    });
  }

  async function loadData() {
    var urls = {
      ownership: chrome.runtime.getURL('data/ownership.json'),
      orgs: chrome.runtime.getURL('data/organizations.json'),
      counters: chrome.runtime.getURL('data/counters.json')
    };
    var [own, orgs, counters] = await Promise.all([
      fetch(urls.ownership).then(function (r) { return r.json(); }),
      fetch(urls.orgs).then(function (r) { return r.json(); }),
      fetch(urls.counters).then(function (r) { return r.json(); })
    ]);
    TS.money.init(own, orgs);
    TS.counter.init(counters);
  }

  async function loadSettings() {
    var data = await chrome.storage.local.get(['settings', 'feedbackState']);
    if (data.settings) {
      settings = Object.assign(settings, data.settings);
      settings.llm = Object.assign({ enabled: true }, data.settings.llm || {});
    }
    calibration = TS.feedback.multipliers(data.feedbackState || null);
  }

  function hooksFor(text, scored) {
    return {
      ownerInfo: TS.money.ownerOf(location.hostname),
      onFeedback: function (helpful, techniqueIds) {
        chrome.storage.local.get(['feedbackState']).then(function (d) {
          var st = TS.feedback.record(d.feedbackState || TS.feedback.fresh(), techniqueIds, helpful);
          chrome.storage.local.set({ feedbackState: st });
          calibration = TS.feedback.multipliers(st);
        });
      },
      generateCounter: function (cb) {
        send({ type: 'counter-generate', text: text.slice(0, 3000), scored: { top: scored.top } })
          .then(cb);
      },
      pullNonprofit: function (name, cb) {
        send({ type: 'nonprofit-search', name: name }).then(cb);
      }
    };
  }

  async function recordSighting(text, scored) {
    var sig = TS.network.signature(text);
    if (!sig) return;
    var d = await chrome.storage.local.get(['sightings']);
    var recs = TS.network.addSighting(d.sightings || [], {
      sig: sig,
      domain: location.hostname.replace(/^www\./, ''),
      ts: Date.now(),
      index: scored.index,
      snippet: text.slice(0, 140)
    });
    await chrome.storage.local.set({ sightings: recs });
  }

  async function bumpStats(scored) {
    var d = await chrome.storage.local.get(['stats']);
    var s = d.stats || { flags: 0, scans: 0, byBand: {}, byPathway: {}, recent: [] };
    s.flags += 1;
    s.byBand[scored.band.key] = (s.byBand[scored.band.key] || 0) + 1;
    Object.keys(scored.pathways).forEach(function (p) {
      if (scored.pathways[p] >= 30) s.byPathway[p] = (s.byPathway[p] || 0) + 1;
    });
    s.recent.unshift({
      domain: location.hostname.replace(/^www\./, ''),
      index: scored.index, band: scored.band.key,
      top: scored.top.slice(0, 2).map(function (t) { return t.id; }),
      ts: Date.now()
    });
    s.recent = s.recent.slice(0, 50);
    await chrome.storage.local.set({ stats: s });
  }

  // Attach matched samples for the "Why" tab (same for a given analysis
  // regardless of which tier produced the score).
  function withSamples(scored, analysis) {
    scored._samples = {};
    scored.top.forEach(function (t) {
      scored._samples[t.id] = (analysis.techniques[t.id] || {}).samples || [];
    });
    return scored;
  }

  function analyzeCandidate(c) {
    if (processed.has(c.element)) return;
    // Skip if a flagged ancestor already covers this element.
    if (c.element.closest && c.element.closest('[data-ts-flagged]')) { processed.add(c.element); return; }
    processed.add(c.element);

    var analysis = TS.analyzeText(c.text, { collectSamples: true });
    var scored = withSamples(TS.score(analysis, calibration), analysis);

    if (scored.index < settings.minBand) return;

    c.element.setAttribute('data-ts-flagged', scored.band.key);
    var host = TS.overlay.attach(c.element, scored, hooksFor(c.text, scored));
    flaggedCount++;
    bumpStats(scored);
    send({ type: 'flag-count', count: flaggedCount });

    if (scored.index >= 50) {
      recordSighting(c.text, scored);
      // Tier 2: ask background to refine with a local model. The heuristic
      // badge already stands on its own; if the model is reachable we blend
      // its judgment in and, if that moves the band or score, swap the badge.
      if (settings.llm.enabled) {
        send({ type: 'tier2-analyze', text: c.text.slice(0, 6000) }).then(function (llmJudgment) {
          if (!llmJudgment) return;
          var scored2 = withSamples(TS.score(analysis, calibration, llmJudgment), analysis);
          if (scored2.index === scored.index && scored2.band.key === scored.band.key) return;
          host.remove();
          c.element.setAttribute('data-ts-flagged', scored2.band.key);
          host = TS.overlay.attach(c.element, scored2, hooksFor(c.text, scored2));
          bumpStats(scored2);
        });
      }
    }
  }

  function scan() {
    if (!settings.enabled) return;
    var candidates = TS.extract.candidates();
    candidates.forEach(analyzeCandidate);

    // Paste-army check on social feeds: many near-identical posts in view.
    if (TS.extract.isSocial() && candidates.length >= 6) {
      var army = TS.network.pasteArmyScore(candidates.map(function (c) { return c.text; }));
      if (army.score >= 40) {
        chrome.storage.local.get(['stats']).then(function (d) {
          var s = d.stats || {};
          s.lastPasteArmy = { domain: location.hostname, score: army.score, pairs: army.pairs, ts: Date.now() };
          chrome.storage.local.set({ stats: s });
        });
      }
    }
  }

  function scheduleScan() {
    if (scanScheduled) return;
    scanScheduled = true;
    setTimeout(function () {
      scanScheduled = false;
      try { scan(); } catch (e) { /* page weirdness must never break browsing */ }
    }, 800);
  }

  async function init() {
    try {
      await loadSettings();
      if (!settings.enabled) return;
      await loadData();

      // Ownership chip: once per site per day.
      var owner = TS.money.ownerOf(location.hostname);
      if (owner && settings.ownerChip) {
        var key = 'chipShown:' + location.hostname;
        var d = await chrome.storage.session.get([key]).catch(function () { return {}; });
        if (!d || !d[key]) {
          TS.overlay.ownerChip(owner);
          try { await chrome.storage.session.set(Object.fromEntries([[key, true]])); } catch (e) {}
        }
      }

      if (settings.autoScan) {
        scan();
        var mo = new MutationObserver(scheduleScan);
        mo.observe(document.body, { childList: true, subtree: true });
      }

      chrome.runtime.onMessage.addListener(function (req, sender, sendResponse) {
        if (req.type === 'scan-now') {
          scan();
          sendResponse({ flagged: flaggedCount });
        }
        return false;
      });
    } catch (e) {
      // Never break the page.
      console.debug('[TruthStrike] init skipped:', e && e.message);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
