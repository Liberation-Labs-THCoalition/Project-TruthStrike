// TruthStrike 2.0 — Heuristic Analysis Pass (Tier 1)
//
// Instant, free, fully local. Produces per-technique evidence that the scorer
// (scorer.js) turns into a calibrated Manipulation Index. When a local LLM is
// available (llm.js), its judgment is blended in as Tier 2 — but the system
// is designed to be genuinely useful with heuristics alone.
//
// Two guards that v1 lacked, both critical:
//
//   1. QUOTE DISCOUNTING — cues inside quotation marks are usually someone
//      being quoted, often precisely because a journalist is examining the
//      claim. Quoted spans score at 35%.
//
//   2. META-DISCOURSE DISCOUNTING — fact-checks and research articles use the
//      vocabulary of the lies they dissect. High meta-discourse density
//      collapses the final score. A PolitiFact article must NOT get flagged.

var TS = globalThis.TS = globalThis.TS || {};

(function () {
  var QUOTE_DISCOUNT = 0.35;

  // Split text into spans marked quoted / unquoted. Handles "…" and “…” pairs
  // plus curly ‘…’; straight single quotes are ignored because apostrophes
  // would turn half the page into phantom quotations. Unterminated quotes
  // fall back to unquoted.
  function splitQuotedSpans(text) {
    var spans = [];
    var re = /["“”]([^"“”]{15,600})["“”]|‘([^‘’]{15,600})’/g;
    var last = 0, m;
    while ((m = re.exec(text)) !== null) {
      if (m.index > last) spans.push({ text: text.slice(last, m.index), quoted: false });
      spans.push({ text: m[1] || m[2], quoted: true });
      last = re.lastIndex;
    }
    if (last < text.length) spans.push({ text: text.slice(last), quoted: false });
    return spans;
  }

  function countWords(text) {
    var m = text.match(/\S+/g);
    return m ? m.length : 0;
  }

  // Sum lexicon hits over quoted/unquoted spans with discounting.
  // Returns { raw, hits: [{cue, sample, quoted}] }
  function scoreLexicon(spans, cues, collectSamples) {
    var raw = 0;
    var hits = [];
    for (var s = 0; s < spans.length; s++) {
      var span = spans[s];
      var mult = span.quoted ? QUOTE_DISCOUNT : 1.0;
      for (var c = 0; c < cues.length; c++) {
        var cue = cues[c];
        cue.re.lastIndex = 0;
        var m, count = 0;
        while ((m = cue.re.exec(span.text)) !== null) {
          count++;
          if (collectSamples && hits.length < 8) {
            hits.push({ sample: m[0].slice(0, 120), quoted: span.quoted });
          }
          if (count > 25) break; // pathological repetition cap
        }
        raw += count * cue.w * mult;
      }
    }
    return { raw: raw, hits: hits };
  }

  // Structural check for cherry_stats: a naked number is only "naked" if no
  // baseline language appears within its sentence neighborhood.
  var BASELINE_RE = /\b(compared (to|with)|versus|vs\.?|up from|down from|out of|per\s+(capita|100|1,?000|million)|a year (ago|earlier)|since \d{4}|the same period|baseline|on average|median|of (all|the|total))\b/i;
  var NUMBER_RE = /\b\d{2,4}\s?%|\b\d+x\b|\b\d{1,3}(,\d{3})+\b/g;

  function nakedNumberScore(text) {
    var sentences = text.split(/(?<=[.!?])\s+/);
    var naked = 0, grounded = 0;
    for (var i = 0; i < sentences.length; i++) {
      var sent = sentences[i];
      NUMBER_RE.lastIndex = 0;
      if (!NUMBER_RE.test(sent)) continue;
      // Look at the sentence plus its neighbors for baseline language.
      var hood = (sentences[i - 1] || '') + ' ' + sent + ' ' + (sentences[i + 1] || '');
      if (BASELINE_RE.test(hood)) grounded++;
      else naked++;
    }
    // Grounded numbers are a GOOD sign; they offset naked ones.
    return Math.max(0, naked - grounded * 0.5);
  }

  // Structural check for vague_attribution: "experts say" is only vague if no
  // named person/institution appears nearby.
  var NAMED_SOURCE_RE = /\b(Dr\.|Prof\.|Sen\.|Rep\.|Judge|Justice)?\s*[A-Z][a-z]{2,}\s+[A-Z][a-z]{2,}\b|\bUniversity of\b|\bInstitute\b/;

  function attributionAdjustment(spans) {
    // Count vague-attribution cue sentences that DO have a named source nearby;
    // each one refunds part of the vague score.
    var refund = 0;
    var cueRe = /\b(experts?|scientists?|doctors?|researchers?|studies|research|sources?) (say|says|show|shows|claim|warn|confirm|prove|proves)\b/gi;
    for (var s = 0; s < spans.length; s++) {
      var sentences = spans[s].text.split(/(?<=[.!?])\s+/);
      for (var i = 0; i < sentences.length; i++) {
        cueRe.lastIndex = 0;
        if (cueRe.test(sentences[i])) {
          var hood = (sentences[i - 1] || '') + ' ' + sentences[i] + ' ' + (sentences[i + 1] || '');
          if (NAMED_SOURCE_RE.test(hood)) refund += 0.7;
        }
      }
    }
    return refund;
  }

  // Density helpers — hits per 100 words, which is what the scorer normalizes on.
  function density(raw, words) {
    return words > 0 ? (raw * 100) / words : 0;
  }

  /**
   * Analyze a block of text. Pure function, no DOM, no network.
   * @param {string} text
   * @param {object} [opts] {collectSamples: boolean}
   * @returns analysis object consumed by scorer.js
   */
  TS.analyzeText = function (text, opts) {
    opts = opts || {};
    text = (text || '').slice(0, 60000); // hard cap for pathological pages
    var words = countWords(text);
    var spans = splitQuotedSpans(text);

    var techniques = {};
    for (var i = 0; i < TS.TECHNIQUES.length; i++) {
      var t = TS.TECHNIQUES[i];
      var cues = TS.LEXICONS[t.id] || [];
      var res = scoreLexicon(spans, cues, opts.collectSamples);
      var raw = res.raw;

      // Structural refinements
      if (t.id === 'cherry_stats') {
        raw = raw * 0.5 + nakedNumberScore(text) * 0.9;
      }
      if (t.id === 'vague_attribution') {
        raw = Math.max(0, raw - attributionAdjustment(spans));
      }

      techniques[t.id] = {
        raw: raw,
        density: density(raw, words),
        samples: res.hits
      };
    }

    // Meta-discourse density: is this text ABOUT manipulation?
    var meta = scoreLexicon(spans, TS.META_DISCOURSE, false).raw;
    // Evidence density: does this text practice good sourcing?
    var evidence = scoreLexicon(spans, TS.EVIDENCE_MARKERS, false).raw;

    return {
      words: words,
      techniques: techniques,
      metaDensity: density(meta, words),
      evidenceDensity: density(evidence, words)
    };
  };
})();

if (typeof module !== 'undefined') module.exports = TS;
