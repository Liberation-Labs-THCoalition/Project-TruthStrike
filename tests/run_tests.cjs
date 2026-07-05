#!/usr/bin/env node
// TruthStrike 2.0 engine tests — run with: node tests/run_tests.cjs [-v]
//
// Validates the two claims that define the rebuild:
//   1. Technique-based detection catches synthetic propaganda it has never seen.
//   2. Fact-checks, straight news, and evidenced opinion do NOT get flagged
//      (the v1 debunker false-positive bug stays dead).

const path = require('path');
const ROOT = path.join(__dirname, '..', 'extension', 'analysis');

require(path.join(ROOT, 'taxonomy.js'));
require(path.join(ROOT, 'lexicons.js'));
require(path.join(ROOT, 'heuristics.js'));
require(path.join(ROOT, 'scorer.js'));
require(path.join(ROOT, 'feedback.js'));

const TS = globalThis.TS;
const fixtures = require('./fixtures.cjs');
const verbose = process.argv.includes('-v');

let pass = 0, fail = 0;
const rows = [];

for (const f of fixtures) {
  const analysis = TS.analyzeText(f.text, { collectSamples: verbose });
  const result = TS.score(analysis);
  const ok =
    (f.expect.min == null || result.index >= f.expect.min) &&
    (f.expect.max == null || result.index <= f.expect.max);
  if (ok) pass++; else fail++;

  rows.push({
    ok, name: f.name, index: result.index, band: result.band.key,
    conf: result.confidence,
    expect: f.expect,
    top: result.top.map(t => `${t.id}:${t.score}`).join(' '),
    meta: result.metaDiscount, evd: result.evidenceDensity,
    pathways: result.pathways
  });
}

for (const r of rows) {
  const mark = r.ok ? '✓' : '✗';
  const exp = [r.expect.min != null ? `>=${r.expect.min}` : '', r.expect.max != null ? `<=${r.expect.max}` : ''].filter(Boolean).join(' ');
  console.log(`${mark} [${String(r.index).padStart(3)}] (${exp.padEnd(6)}) ${r.band.padEnd(8)} conf=${r.conf} ${r.name}`);
  if (verbose || !r.ok) {
    console.log(`    pathways: ${JSON.stringify(r.pathways)} metaDiscount=${r.meta} evidenceDensity=${r.evd}`);
    console.log(`    top: ${r.top || '(none)'}`);
  }
}

// ── Feedback calibration unit checks ────────────────────────────────────────
let st = TS.feedback.fresh();
for (let i = 0; i < 10; i++) st = TS.feedback.record(st, ['fear_appeal'], false);
for (let i = 0; i < 10; i++) st = TS.feedback.record(st, ['othering'], true);
const mult = TS.feedback.multipliers(st);
const fbOk = mult.fear_appeal < 0.6 && mult.othering > 1.4 && Math.abs(mult.urgency - 1.0) < 0.01;
console.log(`${fbOk ? '✓' : '✗'} feedback calibration: fear_appeal→${mult.fear_appeal.toFixed(2)} othering→${mult.othering.toFixed(2)} untouched→${mult.urgency.toFixed(2)}`);
fbOk ? pass++ : fail++;

// Calibration must actually move scores.
const hot = fixtures[0].text;
const base = TS.assess(hot);
const damped = TS.assess(hot, Object.fromEntries(TS.TECHNIQUES.map(t => [t.id, 0.4])));
const calOk = damped.index < base.index;
console.log(`${calOk ? '✓' : '✗'} calibration lowers score: ${base.index} → ${damped.index}`);
calOk ? pass++ : fail++;

// ── Tier-2 LLM blend (content/main.js re-scores with this on tier2-analyze) ─
const blandTechniqueId = 'fear_appeal';
const blandBase = TS.assess(fixtures[5].text); // bland product review, low score
const llmBoost = TS.score(TS.analyzeText(fixtures[5].text), {}, {
  index: 80, techniques: [blandTechniqueId]
});
const llmOk = llmBoost.llmUsed === true && llmBoost.index > blandBase.index &&
  llmBoost.techniques[blandTechniqueId] >= 55;
console.log(`${llmOk ? '✓' : '✗'} llm blend: heuristic-only ${blandBase.index} → blended ${llmBoost.index}, llmUsed=${llmBoost.llmUsed}`);
llmOk ? pass++ : fail++;

// ── Money module ────────────────────────────────────────────────────────────
require(path.join(__dirname, '..', 'extension', 'money', 'money.js'));
TS.money.init(
  require(path.join(__dirname, '..', 'extension', 'data', 'ownership.json')),
  require(path.join(__dirname, '..', 'extension', 'data', 'organizations.json'))
);
const fox = TS.money.ownerOf('www.foxnews.com');
const foxSub = TS.money.ownerOf('video.foxnews.com');
const heritage = TS.money.orgProfile('Heritage Foundation');
const heritageLoose = TS.money.orgProfile('heritage');
const moneyOk = fox && fox.owners[0] === 'Fox Corporation' && foxSub && heritage && heritageLoose &&
  heritage.receipts.length > 0 && TS.money.ownerOf('example.com') === null;
console.log(`${moneyOk ? '✓' : '✗'} money: domain lookup (exact+subdomain), org profile (exact+loose), unknown domain -> null`);
moneyOk ? pass++ : fail++;

// ── Counter module ──────────────────────────────────────────────────────────
require(path.join(__dirname, '..', 'extension', 'counter', 'counter.js'));
TS.counter.init(require(path.join(__dirname, '..', 'extension', 'data', 'counters.json')));
const hotScored = TS.assess(fixtures[0].text);
const scripts = TS.counter.techniqueScripts(hotScored);
const composed = TS.counter.composeFromFamily('election_fraud', 2);
const share = TS.counter.shareUrls(composed.text, composed.sources);
const counterOk = scripts.length >= 3 && composed.sources.length === 2 &&
  share.x.includes('twitter.com/intent') && share.text.includes('Sources:');
console.log(`${counterOk ? '✓' : '✗'} counter: ${scripts.length} technique scripts for hot text, family compose + share intents`);
counterOk ? pass++ : fail++;

// ── Network fingerprinting ──────────────────────────────────────────────────
require(path.join(__dirname, '..', 'extension', 'network', 'fingerprint.js'));
const narrativeA = `Officials confirmed today that the new city budget proposal will
raise property taxes by four percent next year to fund road repairs and the
expansion of emergency services across all districts of the metro area.`;
const narrativeA2 = narrativeA.replace('Officials confirmed', 'Sources confirmed').replace('four percent', 'four percent');
const narrativeB = `A completely different story about a local bakery winning a
national award for its sourdough bread after thirty years of family operation
delighting customers throughout the neighborhood every single morning.`;
const sigA = TS.network.signature(narrativeA);
const simSame = TS.network.similarity(sigA, TS.network.signature(narrativeA2));
const simDiff = TS.network.similarity(sigA, TS.network.signature(narrativeB));
const simOk = simSame >= 0.5 && simDiff < 0.2;
console.log(`${simOk ? '✓' : '✗'} network: near-duplicate sim=${simSame.toFixed(2)} (>=0.5), unrelated sim=${simDiff.toFixed(2)} (<0.2)`);
simOk ? pass++ : fail++;

const t0 = 1700000000000;
let records = [];
[['siteone.com', 0], ['sitetwo.com', 3600e3], ['sitethree.com', 7200e3]].forEach(([d, dt]) => {
  records = TS.network.addSighting(records, { sig: TS.network.signature(narrativeA2), domain: d, ts: t0 + dt, index: 55, snippet: 'budget...' });
});
records = TS.network.addSighting(records, { sig: TS.network.signature(narrativeB), domain: 'bakery.com', ts: t0, index: 10, snippet: 'bread' });
const clusters = TS.network.clusters(records, 3);
const clusterOk = clusters.length === 1 && clusters[0].domains.length === 3 && clusters[0].spanHours === 2;
console.log(`${clusterOk ? '✓' : '✗'} network: coordination cluster across 3 domains detected, unrelated text excluded`);
clusterOk ? pass++ : fail++;

const army = TS.network.pasteArmyScore([narrativeA, narrativeA2, narrativeA, narrativeA2, narrativeB]);
const organic = TS.network.pasteArmyScore([narrativeA, narrativeB,
  'Totally unique comment about the weather being nice today in the park with my dog running around happily chasing squirrels near the fountain.',
  'Another completely original take on the local sports team and their chances in the playoffs this year given the injuries to key players.']);
const armyOk = army.score > organic.score && army.pairs >= 4;
console.log(`${armyOk ? '✓' : '✗'} network: paste-army score ${army.score} > organic ${organic.score}`);
armyOk ? pass++ : fail++;

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
