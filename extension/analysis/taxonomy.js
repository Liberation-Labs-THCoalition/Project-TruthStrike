// TruthStrike 2.0 — Manipulation Technique Taxonomy
//
// The core design shift from v1: we score *techniques* (how text manipulates),
// not *topics* (what it discusses). A regex for "stolen election" flags every
// debunking article ever written. A detector for consensus-faking, stakes
// inflation, and vague attribution works on narratives that don't exist yet.
//
// The pathway structure comes from the Oracle Loop deception research
// (Liberation Labs, 2026): deception in language models decomposes into an
// output-consequentiality substrate plus three distinct pathway signatures —
// threat, social, and reward. Human-directed manipulation exploits the same
// three levers in its audience:
//
//   THREAT  — make the reader afraid, then offer the narrative as shelter
//   SOCIAL  — bind the narrative to group identity; dissent becomes betrayal
//   REWARD  — flatter the reader with secret knowledge and belonging
//
// Two cross-cutting layers:
//
//   EVIDENCE — degraded evidentiary practice (vague attribution, cherry-picked
//              statistics, certainty inflation). Manipulation is expensive to
//              sustain coherently; the evidence layer is where it goes cheap.
//   STAKES   — consequentiality inflation: claimed consequence magnitude far
//              exceeds evidence offered. The single strongest analog to the
//              consequentiality substrate in the model-internals work.
//
// Every technique carries a plain-language explanation. The user always sees
// WHY something was flagged — this tool argues, it never censors.

var TS = globalThis.TS = globalThis.TS || {};

TS.PATHWAYS = {
  threat:   { label: 'Threat',   color: '#e5484d', blurb: 'Fear first, facts later. Content engineered to frighten you into agreement.' },
  social:   { label: 'Social',   color: '#f76b15', blurb: 'Identity pressure. Agreement framed as loyalty, doubt framed as betrayal.' },
  reward:   { label: 'Reward',   color: '#8e4ec6', blurb: 'Flattery and secret knowledge. You, uniquely, are smart enough to see the truth.' },
  evidence: { label: 'Evidence', color: '#0090ff', blurb: 'Degraded sourcing: vague experts, naked numbers, manufactured certainty.' },
  stakes:   { label: 'Stakes',   color: '#e5a000', blurb: 'Apocalyptic consequences claimed, minimal evidence offered.' }
};

TS.TECHNIQUES = [
  // ── THREAT pathway ────────────────────────────────────────────────────────
  {
    id: 'fear_appeal', pathway: 'threat', weight: 1.0,
    name: 'Fear appeal',
    explain: 'Catastrophic language aimed at your amygdala, not your judgment. Fear narrows thinking — that’s the point.'
  },
  {
    id: 'urgency', pathway: 'threat', weight: 0.8,
    name: 'Manufactured urgency',
    explain: 'Artificial time pressure ("before it’s too late", "wake up NOW"). Urgency suppresses verification.'
  },
  {
    id: 'menace_construction', pathway: 'threat', weight: 1.2,
    name: 'Menace construction',
    explain: 'Invasion, contamination, and predator metaphors applied to groups of people. The oldest move in the propaganda playbook.'
  },
  {
    id: 'child_threat_leverage', pathway: 'threat', weight: 1.1,
    name: 'Threat-to-children leverage',
    explain: '"Protect the children" deployed as an argument-ender. Real child-safety writing cites cases, laws, and experts; leverage cites none.'
  },

  // ── SOCIAL pathway ────────────────────────────────────────────────────────
  {
    id: 'othering', pathway: 'social', weight: 1.2,
    name: 'Us-vs-them othering',
    explain: 'Splits the world into a virtuous "us" and a corrupt "them". Disagreement stops being analysis and becomes treason.'
  },
  {
    id: 'consensus_faking', pathway: 'social', weight: 1.0,
    name: 'Consensus faking',
    explain: '"Everyone knows", "people are saying", "Americans are waking up" — manufactured agreement standing in for evidence.'
  },
  {
    id: 'ridicule_of_dissent', pathway: 'social', weight: 0.8,
    name: 'Ridicule of dissent',
    explain: 'Opposing views dismissed with mockery ("sheep", "NPCs", "drank the kool-aid") instead of argument.'
  },
  {
    id: 'source_tribalism', pathway: 'social', weight: 0.9,
    name: 'Epistemic isolation',
    explain: '"The media won’t tell you this" — pre-emptively discredits every outside source, so the narrative can never be checked.'
  },

  // ── REWARD pathway ────────────────────────────────────────────────────────
  {
    id: 'insider_knowledge', pathway: 'reward', weight: 1.0,
    name: 'Secret-knowledge appeal',
    explain: '"What they don’t want you to know." Being in on the secret feels good; the feeling is the product.'
  },
  {
    id: 'identity_flattery', pathway: 'reward', weight: 0.8,
    name: 'Identity flattery',
    explain: '"Real patriots", "those of us who can still think" — agreement bundled with a compliment.'
  },
  {
    id: 'savior_framing', pathway: 'reward', weight: 0.9,
    name: 'Savior framing',
    explain: 'One person or movement presented as the sole fix for a complex problem. Complexity denial with a hero attached.'
  },

  // ── EVIDENCE layer ────────────────────────────────────────────────────────
  {
    id: 'vague_attribution', pathway: 'evidence', weight: 1.0,
    name: 'Vague attribution',
    explain: '"Experts say", "studies show", "sources confirm" — with no named expert, study, or source. Real reporting names names.'
  },
  {
    id: 'cherry_stats', pathway: 'evidence', weight: 1.0,
    name: 'Naked statistics',
    explain: 'Numbers with no denominator, baseline, or timeframe. "300% increase" of what, from what, since when?'
  },
  {
    id: 'certainty_inflation', pathway: 'evidence', weight: 0.8,
    name: 'Certainty inflation',
    explain: 'Absolute language ("proves", "always", "no doubt whatsoever") on contested empirical questions. Honest analysis carries error bars.'
  },
  {
    id: 'loaded_question', pathway: 'evidence', weight: 0.7,
    name: 'Loaded questions',
    explain: 'Claims smuggled in as questions ("Why is nobody talking about…?"). Questions can’t be fact-checked; that’s why they’re used.'
  },
  {
    id: 'hedge_laundering', pathway: 'evidence', weight: 0.7,
    name: 'Hedge laundering',
    explain: '"Some say", "critics claim", "it’s been suggested" — assertions laundered through phantom third parties.'
  },

  // ── STAKES layer ──────────────────────────────────────────────────────────
  {
    id: 'stakes_inflation', pathway: 'stakes', weight: 1.3,
    name: 'Stakes inflation',
    explain: 'Civilizational consequences ("this will destroy America") resting on thin or absent evidence. When claimed stakes outrun offered proof, the gap is the manipulation.'
  }
];

TS.techniqueById = {};
TS.TECHNIQUES.forEach(function (t) { TS.techniqueById[t.id] = t; });

// Severity bands for the overall Manipulation Index (0–100).
// Deliberately conservative: nothing is hidden at any band; higher bands only
// change how loudly the overlay annotates.
TS.BANDS = [
  { min: 0,  key: 'low',      label: 'Low signal',             action: 'silent' },
  { min: 25, key: 'elevated', label: 'Elevated rhetoric',      action: 'badge'  },
  { min: 50, key: 'high',     label: 'Heavy manipulation',     action: 'panel'  },
  { min: 75, key: 'severe',   label: 'Saturated manipulation', action: 'panel'  }
];

TS.bandFor = function (score) {
  var band = TS.BANDS[0];
  for (var i = 0; i < TS.BANDS.length; i++) if (score >= TS.BANDS[i].min) band = TS.BANDS[i];
  return band;
};

if (typeof module !== 'undefined') module.exports = TS;
