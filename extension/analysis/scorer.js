// TruthStrike 2.0 — Manipulation Index Scorer
//
// Turns heuristic evidence (and optionally a local-LLM judgment) into:
//   - per-technique scores 0–100
//   - per-pathway scores 0–100 (threat / social / reward / evidence / stakes)
//   - overall Manipulation Index 0–100 with a confidence estimate
//
// Scoring philosophy, straight from the Oracle Loop work:
//
//   * Manipulation is a SPECTRUM, not a bit. The index is a dial, not a siren.
//   * The consequentiality insight: what distinguishes manipulation from mere
//     heat is the gap between claimed stakes and offered evidence. A furious
//     op-ed that cites court records is angry journalism. The same fury with
//     zero evidentiary grounding is the signature we're after. stakes_inflation
//     is therefore scored on the GAP, not on stakes language alone.
//   * Computational-commitment analog: sustained manipulation across multiple
//     pathways at once is expensive to fake and rare in honest writing.
//     Multi-pathway agreement raises both score and confidence super-linearly.
//   * Text ABOUT manipulation (fact-checks, research) must score low.

var TS = globalThis.TS = globalThis.TS || {};

(function () {
  // Saturating map from density (hits per 100 words, weight-adjusted) to 0–100.
  // half = density at which a technique reads 50.
  function saturate(density, half) {
    return 100 * (density / (density + half));
  }

  // Per-technique half-saturation points. Structure-heavy techniques fire more
  // often in benign text, so they need higher halves.
  var HALF = {
    fear_appeal: 1.2, urgency: 1.4, menace_construction: 0.7, child_threat_leverage: 0.8,
    othering: 1.0, consensus_faking: 0.8, ridicule_of_dissent: 0.8, source_tribalism: 0.8,
    insider_knowledge: 0.8, identity_flattery: 0.7, savior_framing: 0.7,
    vague_attribution: 1.6, cherry_stats: 1.8, certainty_inflation: 1.4,
    loaded_question: 0.9, hedge_laundering: 1.5,
    stakes_inflation: 0.9
  };

  // Short texts (a tweet) legitimately lack citations; don't punish absence of
  // evidence below this length, and shrink confidence.
  var SHORT_TEXT = 60;   // words
  var FULL_CONF_LEN = 400;

  /**
   * @param {object} analysis   output of TS.analyzeText
   * @param {object} [calibration]  per-technique multipliers from feedback.js
   * @param {object} [llmJudgment]  optional Tier-2 output of TS.llm.analyze
   * @returns scored result
   */
  TS.score = function (analysis, calibration, llmJudgment) {
    calibration = calibration || {};
    var techScores = {};
    var pathwayAgg = {};   // pathway -> {sum, wsum}

    TS.TECHNIQUES.forEach(function (t) {
      var ev = analysis.techniques[t.id] || { density: 0 };
      var s = saturate(ev.density, HALF[t.id] || 1.0);
      var cal = calibration[t.id] != null ? calibration[t.id] : 1.0;
      s = Math.min(100, s * t.weight * cal);
      techScores[t.id] = s;

      if (!pathwayAgg[t.pathway]) pathwayAgg[t.pathway] = { sum: 0, wsum: 0, max: 0 };
      pathwayAgg[t.pathway].sum += s * t.weight;
      pathwayAgg[t.pathway].wsum += t.weight;
      pathwayAgg[t.pathway].max = Math.max(pathwayAgg[t.pathway].max, s);
    });

    // ── Stakes gap (the consequentiality move) ────────────────────────────
    // stakes_inflation only counts to the degree evidence is ABSENT. Rich
    // evidentiary grounding converts "the republic is at stake" from
    // manipulation into (possibly correct) argument.
    var evidenceRelief = Math.min(1, analysis.evidenceDensity / 2.5); // 0..1
    if (analysis.words >= SHORT_TEXT) {
      techScores.stakes_inflation *= (1 - 0.8 * evidenceRelief);
      pathwayAgg.stakes.max = techScores.stakes_inflation;
      pathwayAgg.stakes.sum = techScores.stakes_inflation * TS.techniqueById.stakes_inflation.weight;
    }

    var pathways = {};
    Object.keys(pathwayAgg).forEach(function (p) {
      var a = pathwayAgg[p];
      // Blend mean and max: one screaming technique matters even if its
      // siblings are quiet.
      pathways[p] = Math.min(100, 0.55 * (a.sum / a.wsum) + 0.45 * a.max);
    });

    // ── Multi-pathway commitment bonus ─────────────────────────────────────
    // Honest-but-heated writing usually lights up ONE pathway. Engineered
    // manipulation runs threat+social+reward together. Count psychological
    // pathways (not evidence/stakes) above 30.
    var hotPaths = ['threat', 'social', 'reward'].filter(function (p) { return pathways[p] >= 30; }).length;
    var commitment = hotPaths >= 3 ? 1.25 : hotPaths === 2 ? 1.12 : 1.0;

    // ── Base index ─────────────────────────────────────────────────────────
    var psych = Math.max(pathways.threat || 0, pathways.social || 0, pathways.reward || 0);
    var psychMean = ((pathways.threat || 0) + (pathways.social || 0) + (pathways.reward || 0)) / 3;
    var index =
      0.40 * psych +
      0.15 * psychMean +
      0.25 * (pathways.evidence || 0) +
      0.20 * (pathways.stakes || 0);
    index *= commitment;

    // ── Meta-discourse discount (the debunker fix) ─────────────────────────
    // metaDensity ~0.4+ per 100 words = clearly analytical text about
    // misinformation. Scale discount smoothly up to 85%.
    var metaDiscount = Math.min(0.85, analysis.metaDensity / 0.55 * 0.45);
    index *= (1 - metaDiscount);

    // ── Optional LLM blend (Tier 2) ────────────────────────────────────────
    // The heuristic index anchors; the LLM can move it up to ±30 points and
    // contributes technique flags of its own.
    var llmUsed = false;
    if (llmJudgment && typeof llmJudgment.index === 'number') {
      llmUsed = true;
      var li = Math.max(0, Math.min(100, llmJudgment.index));
      index = 0.55 * index + 0.45 * li;
      (llmJudgment.techniques || []).forEach(function (id) {
        if (techScores[id] != null) techScores[id] = Math.max(techScores[id], 55);
      });
    }

    index = Math.max(0, Math.min(100, index));

    // ── Confidence ─────────────────────────────────────────────────────────
    // Grows with text length, signal diversity, and LLM agreement.
    var lenConf = Math.min(1, analysis.words / FULL_CONF_LEN);
    var firing = Object.keys(techScores).filter(function (id) { return techScores[id] >= 25; }).length;
    var divConf = Math.min(1, firing / 4);
    var confidence = 0.25 + 0.45 * lenConf + 0.20 * divConf + (llmUsed ? 0.10 : 0);
    confidence = Math.round(Math.min(1, confidence) * 100) / 100;

    // Top techniques for display
    var top = Object.keys(techScores)
      .map(function (id) { return { id: id, score: Math.round(techScores[id]) }; })
      .filter(function (x) { return x.score >= 25; })
      .sort(function (a, b) { return b.score - a.score; })
      .slice(0, 5);

    return {
      index: Math.round(index),
      band: TS.bandFor(index),
      confidence: confidence,
      pathways: Object.keys(pathways).reduce(function (o, p) { o[p] = Math.round(pathways[p]); return o; }, {}),
      techniques: techScores,
      top: top,
      commitment: commitment,
      metaDiscount: Math.round(metaDiscount * 100) / 100,
      evidenceDensity: Math.round(analysis.evidenceDensity * 100) / 100,
      words: analysis.words,
      llmUsed: llmUsed
    };
  };

  // Convenience one-shot: text -> scored result (no LLM, optional calibration)
  TS.assess = function (text, calibration, opts) {
    return TS.score(TS.analyzeText(text, opts), calibration);
  };
})();

if (typeof module !== 'undefined') module.exports = TS;
