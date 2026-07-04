// TruthStrike 2.0 — Narrative Fingerprinting & Coordination Detection
//
// Coordinated inauthentic behavior has one unfakeable signature: the same
// talking points surfacing across nominally independent sources in a tight
// time window. State Policy Network affiliates publishing "independent" op-eds
// in 40 states the same week; Sinclair anchors reading identical scripts.
//
// This module fingerprints flagged text as MinHash signatures of normalized
// word 5-grams, stores (signature, domain, day) tuples locally, and reports
// clusters where similar signatures appear across ≥3 distinct domains within
// 72 hours. Everything stays on-device: this maps what YOUR browsing has
// encountered — it is your own field notebook, not a surveillance feed.
//
// The dashboard renders clusters as cascade timelines: which domain you saw
// the narrative on first, and how it propagated through your reading.

var TS = globalThis.TS = globalThis.TS || {};

(function () {
  var SHINGLE = 5;         // words per shingle
  var SIG_SIZE = 24;       // MinHash signature length
  var SIM_THRESHOLD = 0.5; // estimated Jaccard to call two texts "same narrative"
  var WINDOW_MS = 72 * 3600 * 1000;
  var MAX_RECORDS = 600;   // rolling local cap

  // FNV-1a 32-bit — fast, deterministic, dependency-free.
  function fnv1a(str, seed) {
    var h = 0x811c9dc5 ^ (seed >>> 0);
    for (var i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;
    }
    return h >>> 0;
  }

  function normalize(text) {
    return String(text || '')
      .toLowerCase()
      .replace(/https?:\/\/\S+/g, ' ')
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function shingles(text) {
    var words = normalize(text).split(' ').filter(function (w) { return w.length > 1; });
    var out = [];
    for (var i = 0; i + SHINGLE <= words.length; i++) {
      out.push(words.slice(i, i + SHINGLE).join(' '));
    }
    return out;
  }

  TS.network = {
    /** MinHash signature of a text; null if too short to fingerprint. */
    signature: function (text) {
      var sh = shingles(text);
      if (sh.length < 8) return null;
      var sig = new Array(SIG_SIZE);
      for (var s = 0; s < SIG_SIZE; s++) {
        var min = 0xffffffff;
        for (var i = 0; i < sh.length; i++) {
          var h = fnv1a(sh[i], s * 2654435761);
          if (h < min) min = h;
        }
        sig[s] = min;
      }
      return sig;
    },

    /** Estimated Jaccard similarity of two signatures. */
    similarity: function (a, b) {
      if (!a || !b || a.length !== b.length) return 0;
      var same = 0;
      for (var i = 0; i < a.length; i++) if (a[i] === b[i]) same++;
      return same / a.length;
    },

    /**
     * Add a sighting to the local record set (pure: returns new array).
     * record: {sig, domain, ts, index, snippet}
     */
    addSighting: function (records, sighting) {
      records = (records || []).slice();
      records.push(sighting);
      if (records.length > MAX_RECORDS) records = records.slice(records.length - MAX_RECORDS);
      return records;
    },

    /**
     * Find coordination clusters: groups of sightings with pairwise-similar
     * signatures spanning >= minDomains distinct domains within the window.
     * Greedy single-link clustering — fine at these scales.
     */
    clusters: function (records, minDomains) {
      minDomains = minDomains || 3;
      var recs = (records || []).filter(function (r) { return r && r.sig; });
      var used = new Array(recs.length).fill(false);
      var out = [];

      for (var i = 0; i < recs.length; i++) {
        if (used[i]) continue;
        var cluster = [recs[i]];
        used[i] = true;
        for (var j = i + 1; j < recs.length; j++) {
          if (used[j]) continue;
          for (var k = 0; k < cluster.length; k++) {
            if (TS.network.similarity(cluster[k].sig, recs[j].sig) >= SIM_THRESHOLD) {
              cluster.push(recs[j]);
              used[j] = true;
              break;
            }
          }
        }
        if (cluster.length < 2) continue;

        cluster.sort(function (a, b) { return a.ts - b.ts; });
        var span = cluster[cluster.length - 1].ts - cluster[0].ts;
        var domains = {};
        cluster.forEach(function (c) { domains[c.domain] = true; });
        var nDomains = Object.keys(domains).length;

        if (nDomains >= minDomains && span <= WINDOW_MS) {
          out.push({
            sightings: cluster.map(function (c) {
              return { domain: c.domain, ts: c.ts, index: c.index, snippet: c.snippet };
            }),
            domains: Object.keys(domains),
            firstSeen: cluster[0].ts,
            spanHours: Math.round(span / 3600000 * 10) / 10,
            strength: Math.round(
              cluster.slice(1).reduce(function (acc, c) {
                return acc + TS.network.similarity(cluster[0].sig, c.sig);
              }, 0) / (cluster.length - 1) * 100)
          });
        }
      }
      return out.sort(function (a, b) { return b.domains.length - a.domains.length; });
    },

    // Bot-like amplification heuristic for social feeds: many near-identical
    // short posts inside one page (paste armies). Runs on extracted post texts.
    pasteArmyScore: function (postTexts) {
      var sigs = postTexts
        .map(function (t) { return TS.network.signature(t); })
        .filter(Boolean);
      if (sigs.length < 4) return { score: 0, pairs: 0 };
      var pairs = 0, similar = 0;
      for (var i = 0; i < sigs.length; i++) {
        for (var j = i + 1; j < sigs.length; j++) {
          pairs++;
          if (TS.network.similarity(sigs[i], sigs[j]) >= SIM_THRESHOLD) similar++;
        }
      }
      return { score: pairs ? Math.round((similar / pairs) * 100) : 0, pairs: similar };
    }
  };
})();

if (typeof module !== 'undefined') module.exports = TS;
