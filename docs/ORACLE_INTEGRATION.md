# How the Oracle Loop Research Shapes TruthStrike 2.0

TruthStrike 2.0 is the public-facing sibling of the Oracle Loop deception
research (Liberation Labs, 2025–2026). Oracle instruments what happens *inside
a model* when it deceives; TruthStrike detects what manipulation looks like
*on the page*. The transfer is architectural, not cosmetic.

## 1. The consequentiality decomposition → the stakes-gap scorer

Oracle finding: the "deception direction" in KV-cache geometry decomposes into
an **output-consequentiality substrate** (L23–L31) plus a **deception
amplifier** (L35–L47). Deception is not a free-floating property — it rides on
the representation of *how much the output matters*.

TruthStrike transfer: manipulation rides on **stakes inflation**. What
separates propaganda from ordinary heated speech is not emotion — it's the gap
between *claimed consequence magnitude* and *offered evidence*. The scorer
implements this literally: `stakes_inflation` is computed on stakes language
**discounted by evidence density** (`scorer.js`). "The republic is at stake,
per these court filings" is argument. "The republic is at stake, share before
it's too late" is the signature.

Validated in tests: a furious op-ed citing the Legislative Fiscal Bureau, CDC
surveillance data, and court records scores **0**; the same emotional register
with no grounding scores **67**.

## 2. Three pathway signatures → the taxonomy's spine

Oracle finding: deception routes through three distinguishable pathway
signatures — **threat, social, reward** — with distinct geometric profiles.

TruthStrike transfer: the 18-technique taxonomy is organized under the same
three psychological levers (plus the cross-cutting evidence layer):

| Oracle pathway | TruthStrike techniques |
|---|---|
| Threat | fear appeal, urgency, menace construction, child-threat leverage |
| Social | othering, consensus faking, ridicule of dissent, epistemic isolation |
| Reward | secret-knowledge appeal, identity flattery, savior framing |

This isn't analogy for its own sake. The claim both projects share: deception
and manipulation are **not content categories, they are process signatures**.
You don't detect a lie by knowing the truth; you detect the machinery that
makes lies land.

## 3. Computational commitment → the multi-pathway bonus

Oracle finding: sustained deception carries measurable computational
commitment — the model does extra representational work to maintain a
deceptive frame, and that work is visible.

TruthStrike transfer: honest-but-angry writing usually runs hot on **one**
pathway. Engineered manipulation runs threat + social + reward
*simultaneously*, because it's built to close every exit: scare you, bind
your identity, and flatter you for staying. The scorer applies a superlinear
commitment multiplier (×1.12 for two hot pathways, ×1.25 for three) and
raises confidence with pathway diversity — coordinated multi-lever pressure
is expensive to produce by accident.

## 4. The meta-discourse guard → learned from judge-noise work

Oracle Loop's judging pipelines had to distinguish a model *discussing*
deception from a model *deceiving* — the same surface tokens, opposite
meaning. TruthStrike inherits the fix as the meta-discourse discount:
fact-checks, research articles, and debunks use the vocabulary of the lies
they dissect, so analytical-register markers (named sources, "rated false",
methodology language) collapse the score by up to 85%. This killed v1's worst
bug, where PolitiFact articles got flagged as disinformation.

## 5. What could come next (research → product pipeline)

- **SAE-feature-informed lexicons.** Sparse autoencoder features that
  activate on manipulative framing in open models could be decompiled into
  new heuristic cues — machine-discovered rhetoric detectors, shipped as
  auditable regex, keeping the extension dependency-free.
- **Local probe models.** The Tier-2 slot currently prompts a generic small
  LLM. A fine-tuned 1–2B "rhetoric probe" trained against Oracle-labeled
  data would be strictly better and still runs in Ollama.
- **Cross-validation.** TruthStrike's field data (which techniques users
  confirm as manipulative) is a natural human-side validation set for the
  pathway decomposition — do the three signatures carve human manipulation
  at the same joints? That's a paper.
