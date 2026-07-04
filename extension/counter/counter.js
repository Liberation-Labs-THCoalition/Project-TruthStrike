// TruthStrike 2.0 — Counter-Narrative Engine
//
// Three tiers, degrading gracefully:
//   1. Technique scripts — always available, topic-agnostic, from counters.json.
//   2. Curated narrative-family rebuttals with citations — user picks the
//      family (or the LLM suggests one); these are hand-written and sourced.
//   3. Local LLM generation (llm.js) — bespoke counter-framing for novel
//      content, grounded by the style rules and the technique diagnosis.
//
// Output is always: short calm text + sources + verify-it-yourself pointers.
// Share is one click (copies text, opens the platform's share intent) and the
// user always sees and can edit what they share. We are not a botnet.

var TS = globalThis.TS = globalThis.TS || {};

(function () {
  TS.counter = {
    _db: null,

    init: function (countersData) { TS.counter._db = countersData; },

    loadFromExtension: async function () {
      if (TS.counter._db) return;
      var d = await fetch(chrome.runtime.getURL('data/counters.json')).then(function (r) { return r.json(); });
      TS.counter.init(d);
    },

    families: function () {
      return TS.counter._db ? TS.counter._db.families : [];
    },

    familyById: function (id) {
      return (TS.counter.families() || []).filter(function (f) { return f.id === id; })[0] || null;
    },

    // Tier 1: technique-keyed scripts for whatever the scorer flagged.
    techniqueScripts: function (scored) {
      var scripts = (TS.counter._db && TS.counter._db.technique_scripts) || {};
      return (scored.top || []).map(function (t) {
        var tech = TS.techniqueById[t.id];
        return scripts[t.id] ? {
          technique: tech ? tech.name : t.id,
          text: scripts[t.id]
        } : null;
      }).filter(Boolean);
    },

    // Compose a shareable text block from a family (Tier 2).
    composeFromFamily: function (familyId, maxSources) {
      var fam = TS.counter.familyById(familyId);
      if (!fam) return null;
      var text = fam.counters[0];
      var sources = fam.sources.slice(0, maxSources || 2);
      return { text: text, sources: sources, family: fam.name };
    },

    // Tier 3: local LLM, falls back to null (caller then uses tiers 1-2).
    generate: async function (pageText, scored, cfg) {
      if (!TS.llm) return null;
      var out = await TS.llm.counterNarrative(pageText, scored, cfg);
      if (!out) return null;
      return { text: out.text, verify: out.verify, generated: true, backend: out.backend };
    },

    // Share-intent URLs. The user reviews the text in the panel first; these
    // just open a prefilled composer on the chosen platform.
    shareUrls: function (text, sources) {
      var full = text + (sources && sources.length ? '\n\nSources:\n' + sources.join('\n') : '');
      var enc = encodeURIComponent(full);
      return {
        text: full,
        x: 'https://twitter.com/intent/tweet?text=' + enc,
        bluesky: 'https://bsky.app/intent/compose?text=' + enc,
        mastodon: 'https://mastodonshare.com/?text=' + enc,
        threads: 'https://www.threads.net/intent/post?text=' + enc,
        facebook: 'https://www.facebook.com/sharer/sharer.php?quote=' + enc + '&u=' + encodeURIComponent((sources && sources[0]) || 'https://github.com/Liberation-Labs-THCoalition/Project-TruthStrike')
      };
    }
  };
})();

if (typeof module !== 'undefined') module.exports = TS;
