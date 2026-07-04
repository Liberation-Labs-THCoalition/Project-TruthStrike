// TruthStrike 2.0 — Feedback Calibration
//
// Every flag carries "Was this useful? 👍 / 👎". Feedback updates a Beta
// distribution per technique, entirely on-device. The posterior mean becomes
// a multiplier on that technique's score, so the engine tunes itself to the
// user's judgment without any server, account, or telemetry.
//
//   👍 on a flag  -> alpha+1 for every technique that drove the flag
//   👎 on a flag  -> beta+1  for the same techniques
//
// Multiplier = 2 * mean(Beta(a,b)), clamped to [0.4, 1.6]. A technique the
// user always marks unhelpful decays toward 40% influence; one they always
// confirm rises to 160%. Priors (a=3,b=3) make early feedback gentle.

var TS = globalThis.TS = globalThis.TS || {};

(function () {
  var PRIOR_A = 3, PRIOR_B = 3;
  var MIN_MULT = 0.4, MAX_MULT = 1.6;

  TS.feedback = {
    fresh: function () {
      var st = {};
      TS.TECHNIQUES.forEach(function (t) { st[t.id] = { a: PRIOR_A, b: PRIOR_B }; });
      return st;
    },

    // techniques: array of technique ids that drove the flag (result.top ids)
    record: function (state, techniqueIds, helpful) {
      state = state || TS.feedback.fresh();
      (techniqueIds || []).forEach(function (id) {
        if (!state[id]) state[id] = { a: PRIOR_A, b: PRIOR_B };
        if (helpful) state[id].a += 1; else state[id].b += 1;
      });
      return state;
    },

    // -> {techniqueId: multiplier} for TS.score(analysis, calibration)
    multipliers: function (state) {
      var out = {};
      if (!state) return out;
      Object.keys(state).forEach(function (id) {
        var s = state[id];
        var mean = s.a / (s.a + s.b);           // 0..1, prior mean 0.5
        out[id] = Math.max(MIN_MULT, Math.min(MAX_MULT, mean * 2));
      });
      return out;
    },

    // Human-readable calibration summary for the dashboard.
    summary: function (state) {
      var m = TS.feedback.multipliers(state);
      return Object.keys(m).map(function (id) {
        var t = TS.techniqueById[id];
        var s = state[id];
        return {
          id: id,
          name: t ? t.name : id,
          multiplier: Math.round(m[id] * 100) / 100,
          votes: (s.a - 3) + (s.b - 3),
          helpful: s.a - 3,
          unhelpful: s.b - 3
        };
      }).sort(function (a, b) { return b.votes - a.votes; });
    }
  };
})();

if (typeof module !== 'undefined') module.exports = TS;
