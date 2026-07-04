// TruthStrike 2.0 — Technique Cue Lexicons
//
// Each technique has an array of cues. A cue is { re, w } — a regex and a
// weight. Weights are relative within a technique; the scorer normalizes by
// text length, so a long investigative article with two hot phrases does not
// outscore a 40-word rage post built from nothing else.
//
// DESIGN RULE: no topic words. Nothing in here matches "election", "vaccine",
// "climate", "trans", or any other subject. Only rhetorical machinery.
// If you find yourself adding a topic word, you are rebuilding v1's bug.

var TS = globalThis.TS = globalThis.TS || {};

TS.LEXICONS = {
  // ── THREAT ────────────────────────────────────────────────────────────────
  fear_appeal: [
    { re: /\b(destroy(ed|ing)?|annihilat\w+|obliterat\w+|catastroph\w+|apocalyp\w+|nightmare|horrif\w+|terrifying)\b/gi, w: 1.0 },
    { re: /\b(collapse|implode|implosion|meltdown)\b.{0,40}\b(society|country|nation|economy|civilization|way of life)\b/gi, w: 1.4 },
    { re: /\b(society|country|nation|economy|civilization|way of life)\b.{0,40}\b(collapse|implode|imploding|melting down)\b/gi, w: 1.4 },
    { re: /\byou(r family)? (won'?t|will not) be safe\b/gi, w: 1.6 },
    { re: /\b(they'?re|they are) coming for (you|your)\b/gi, w: 1.8 },
    { re: /\bno(where| one) is safe\b/gi, w: 1.5 },
    { re: /\b(existential threat|fight for (our|your) (survival|existence|lives))\b/gi, w: 1.4 }
  ],

  urgency: [
    { re: /\bbefore it'?s too late\b/gi, w: 1.5 },
    { re: /\b(wake up|act now|share (this )?(now|before)|time is running out|last chance|final warning)\b/gi, w: 1.3 },
    { re: /\bwhile you still can\b/gi, w: 1.5 },
    { re: /\b(right now|immediately|this instant),? or\b/gi, w: 1.0 },
    { re: /\bthey'?re about to\b/gi, w: 0.8 },
    { re: /!{2,}/g, w: 0.4 },
    { re: /\b[A-Z]{4,}(\s+[A-Z]{2,}){2,}\b/g, w: 0.5 } // sustained ALL-CAPS shouting
  ],

  menace_construction: [
    { re: /\b(invasion|invaders?|invading|horde|swarm|flood(ing)?|infest\w+|plague)\b.{0,60}\b(people|migrants?|immigrants?|refugees?|foreigners?|them|these)\b/gi, w: 1.8 },
    { re: /\b(migrants?|immigrants?|refugees?|foreigners?)\b.{0,60}\b(invasion|invaders?|invading|horde|swarm|flood(ing)?|infest\w+)\b/gi, w: 1.8 },
    { re: /\b(vermin|parasites?|leeches|cockroach\w*|animals)\b.{0,50}\b(these people|they|them|those)\b/gi, w: 2.0 },
    { re: /\b(poisoning|polluting|contaminating|diluting)\b.{0,40}\b(blood|culture|nation|country|society)\b/gi, w: 2.0 },
    { re: /\b(predators?|groomers?)\b.{0,60}\b(everywhere|among us|in (our|your) (schools|neighborhoods|towns))\b/gi, w: 1.6 },
    { re: /\b(enemy within|enemies of the (people|state|nation))\b/gi, w: 1.8 },
    { re: /\btaking over\b.{0,40}\b(our|your)\b.{0,30}\b(country|cities|towns|neighborhoods|schools)\b/gi, w: 1.2 }
  ],

  child_threat_leverage: [
    { re: /\b(protect|save|defend)\b.{0,20}\b(our|your|the) (kids|children|babies)\b/gi, w: 1.0 },
    { re: /\b(they|the\w*)\b.{0,30}\b(after|coming for|targeting|preying on)\b.{0,20}\b(our|your|the) (kids|children|babies)\b/gi, w: 1.8 },
    { re: /\b(our|your) (kids|children|babies)\b.{0,40}\b(in danger|at risk|not safe|under attack)\b/gi, w: 1.3 },
    { re: /\bwhat (they'?re|they are) doing to (our|your) (kids|children)\b/gi, w: 1.6 }
  ],

  // ── SOCIAL ────────────────────────────────────────────────────────────────
  othering: [
    { re: /\b(real|true|actual) (americans?|patriots?|citizens?|men|women|people)\b/gi, w: 1.2 },
    { re: /\b(these people|those people)\b.{0,40}\b(hate|despise|want to destroy|are destroying)\b/gi, w: 1.5 },
    { re: /\bthey (hate|despise) (you|us|this country|america|everything we)\b/gi, w: 1.6 },
    { re: /\b(globalists?|elites?|the establishment|deep state|the regime)\b.{0,50}\b(want|plan|agenda|scheme|plot)\w*\b/gi, w: 1.4 },
    { re: /\b(us|we) (vs\.?|versus|against) them\b/gi, w: 1.3 },
    { re: /\bif you'?re not with us\b/gi, w: 1.5 },
    { re: /\b(traitors?|treason(ous)?|fifth column)\b/gi, w: 1.2 },
    { re: /\bsick, twisted (people|individuals|ideology)\b/gi, w: 1.2 }
  ],

  consensus_faking: [
    { re: /\beverybody knows\b|\beveryone knows\b/gi, w: 1.4 },
    { re: /\bpeople are saying\b|\bfolks are saying\b|\bmany (people )?are saying\b/gi, w: 1.6 },
    { re: /\b(americans?|people|everyone|the whole country) (is|are) (waking up|finally seeing|fed up|done with)\b/gi, w: 1.3 },
    { re: /\bwe all know\b/gi, w: 1.2 },
    { re: /\bnobody (actually )?believes\b/gi, w: 1.0 },
    { re: /\bit'?s (just )?common sense\b/gi, w: 0.9 },
    { re: /\bmillions (of (people|americans?) )?(agree|know|have seen)\b/gi, w: 1.2 }
  ],

  ridicule_of_dissent: [
    { re: /\b(sheep|sheeple|npcs?|lemmings|drones)\b/gi, w: 1.4 },
    { re: /\b(drank|drink(ing)?) the kool[- ]?aid\b/gi, w: 1.4 },
    { re: /\bonly (an idiot|a fool|a moron|the gullible) (would|could) (believe|think)\b/gi, w: 1.5 },
    { re: /\bif you (still )?believe .{0,60}(i have a bridge|you'?re (beyond help|hopeless|part of the problem))/gi, w: 1.4 },
    { re: /\b(low[- ]?iq|brain[- ]?dead|brainwashed) (people|masses|voters|viewers)\b/gi, w: 1.3 },
    { re: /\bcan'?t think for themselves\b/gi, w: 1.1 }
  ],

  source_tribalism: [
    { re: /\b(the )?(mainstream media|msm|legacy media|corporate media)\b.{0,50}\b(won'?t|will never|refuses? to|is hiding|is lying|buried|silent)\b/gi, w: 1.5 },
    { re: /\byou won'?t (see|hear|read) this (anywhere else|on the news|in the media)\b/gi, w: 1.6 },
    { re: /\b(censored|banned|suppressed|shadow[- ]?banned)\b.{0,40}\b(truth|this|for telling)\b/gi, w: 1.2 },
    { re: /\bdo your own research\b/gi, w: 0.9 },
    { re: /\bdon'?t (trust|believe) (anything|a word) (from|of|the)\b/gi, w: 1.2 },
    { re: /\bthe only (place|source|one) (telling|reporting) the truth\b/gi, w: 1.7 }
  ],

  // ── REWARD ────────────────────────────────────────────────────────────────
  insider_knowledge: [
    { re: /\bwhat they don'?t want you to (know|see|hear|find out)\b/gi, w: 1.7 },
    { re: /\bthey don'?t want (you|us) to (know|see|talk about)\b/gi, w: 1.5 },
    { re: /\b(hidden|secret|suppressed|buried) (truth|evidence|facts?|documents?|agenda)\b/gi, w: 1.3 },
    { re: /\bthe truth (about|behind) .{0,40}(revealed|exposed|they'?re hiding)\b/gi, w: 1.3 },
    { re: /\bwhat'?s really (going on|happening)\b/gi, w: 1.0 },
    { re: /\bconnect the dots\b/gi, w: 1.0 },
    { re: /\bthis is the (story|video|thread) they tried to (bury|ban|delete)\b/gi, w: 1.6 }
  ],

  identity_flattery: [
    { re: /\b(those of us|people like (you|us)) who (can still think|see through|haven'?t been fooled)\b/gi, w: 1.6 },
    { re: /\bif you'?re (smart|awake|paying attention), you (already )?know\b/gi, w: 1.5 },
    { re: /\bthe (awakened|enlightened|informed) (few|ones|minority)\b/gi, w: 1.4 },
    { re: /\byou'?re not (crazy|alone|imagining (it|things))\b/gi, w: 0.9 },
    { re: /\bsmart (people|readers|viewers) (are|have) (already|all)\b/gi, w: 1.1 }
  ],

  savior_framing: [
    { re: /\b(only|the only) (one|man|woman|person|leader|movement) (who|that) can (save|fix|stop|restore)\b/gi, w: 1.7 },
    { re: /\b(he|she|they) alone can (fix|save|stop)\b/gi, w: 1.8 },
    { re: /\bour (last|only) (hope|chance)\b/gi, w: 1.3 },
    { re: /\bsent by god\b|\bchosen (one|by god)\b/gi, w: 1.4 },
    { re: /\bwill (single-?handedly|finally) (end|fix|solve|drain)\b/gi, w: 1.2 }
  ],

  // ── EVIDENCE ──────────────────────────────────────────────────────────────
  // vague_attribution & cherry_stats also get structural analysis in
  // heuristics.js; the lexicon side catches the classic phrasings.
  vague_attribution: [
    { re: /\b(experts?|scientists?|doctors?|researchers?|economists?|insiders?|officials?) (say|says|claim|agree|warn|admit|confirm)\b/gi, w: 1.0 },
    { re: /\b(studies|research|the science|data|the numbers) (show|shows|prove|proves|confirm|confirms)\b/gi, w: 1.0 },
    { re: /\b(sources?|people familiar with) (say|said|tell|told|confirm)\b/gi, w: 0.9 },
    { re: /\baccording to (some|many|several|reports)\b/gi, w: 0.8 },
    { re: /\bit (has been|was) (reported|revealed|confirmed)\b/gi, w: 0.8 }
  ],

  cherry_stats: [
    // percentage / multiplier with no nearby baseline language — the
    // structural check in heuristics.js decides if a baseline is present.
    { re: /\b\d{2,4}\s?%(\s+(increase|surge|spike|jump|rise|more))?\b/gi, w: 0.6 },
    { re: /\b\d+x (more|higher|worse|greater)\b/gi, w: 0.7 },
    { re: /\b(skyrocket\w*|surg\w+|explod\w+|spik\w+)\b.{0,30}\b\d/gi, w: 0.8 },
    { re: /\b(record|unprecedented|all[- ]time) (high|low|levels?|numbers?)\b/gi, w: 0.6 }
  ],

  certainty_inflation: [
    { re: /\b(proves?|proven) (beyond (all|any) doubt|once and for all|definitively)\b/gi, w: 1.4 },
    { re: /\b(undeniable|irrefutable|incontrovertible|indisputable) (proof|evidence|fact)\b/gi, w: 1.3 },
    { re: /\bthere (is|can be) no (doubt|question|debate)\b/gi, w: 1.1 },
    { re: /\b(everyone|anyone) with (half a brain|two brain cells|eyes) can see\b/gi, w: 1.3 },
    { re: /\b(always|never|every single (time|one))\b.{0,30}\b(they|these people|the\w+ party)\b/gi, w: 0.8 },
    { re: /\bfact:? /gi, w: 0.5 },
    { re: /\b100% (certain|true|proof|fact)\b/gi, w: 1.2 }
  ],

  loaded_question: [
    { re: /\bwhy (is nobody|isn'?t anyone|won'?t (anyone|they|the media)) (talking about|covering|reporting|asking)\b/gi, w: 1.5 },
    { re: /\bwhat are they (hiding|so afraid of|not telling us)\??/gi, w: 1.4 },
    { re: /\b(coincidence|makes you wonder|asking for a friend)\s*[?.]/gi, w: 1.1 },
    { re: /\bjust asking questions\b/gi, w: 1.2 },
    { re: /\bhow (convenient|interesting) (is it )?that\b/gi, w: 1.1 },
    { re: /\bwho benefits\??\B/gi, w: 0.8 }
  ],

  hedge_laundering: [
    { re: /\bsome (say|people (say|believe|think)|would argue)\b/gi, w: 1.0 },
    { re: /\bcritics (say|claim|argue|warn)\b/gi, w: 0.7 },
    { re: /\bit'?s been (suggested|said|claimed|alleged)\b/gi, w: 1.0 },
    { re: /\bmany (believe|think|suspect|are convinced)\b/gi, w: 1.0 },
    { re: /\brumors? (are swirling|has it|suggest)\b/gi, w: 1.2 },
    { re: /\bi'?m (just )?hearing (that|things|a lot)\b/gi, w: 1.1 }
  ],

  // ── STAKES ────────────────────────────────────────────────────────────────
  stakes_inflation: [
    { re: /\b(end|death|destruction) of (america|our country|the republic|democracy|western civilization|freedom|everything)\b/gi, w: 1.6 },
    { re: /\b(this|it) (will|would|could) (destroy|end|doom|kill) (america|the country|our nation|us all|everything)\b/gi, w: 1.6 },
    { re: /\bmost important (election|moment|fight|battle) (of|in) (our lifetimes?|history|a generation)\b/gi, w: 1.2 },
    { re: /\b(civil war|world war (3|iii|three))\b.{0,40}\b(coming|inevitable|near|around the corner)\b/gi, w: 1.5 },
    { re: /\bnothing less than (the survival|our survival|the future) of\b/gi, w: 1.4 },
    { re: /\bif (we|they) (lose|win) this,? (there won'?t be|it'?s over|we lose everything)\b/gi, w: 1.5 }
  ]
};

// ── Meta-discourse guard ─────────────────────────────────────────────────────
// The debunker fix. Text ABOUT misinformation (fact-checks, research articles,
// debunks, quality journalism quoting a false claim to refute it) uses the
// same surface vocabulary as the misinformation itself. These markers indicate
// the text is analyzing manipulation rather than performing it; the scorer
// applies a discount proportional to their density.
TS.META_DISCOURSE = [
  { re: /\b(fact[- ]?check\w*|debunk\w*|fals(e(ly)?|ehood)|misinformation|disinformation|conspiracy theor\w+|baseless(ly)?|unfounded|unsubstantiated|without evidence|no evidence (that|for|of|supports))\b/gi, w: 1.0 },
  { re: /\b(claim(s|ed)? (that|falsely)|alleg(ed|es|ation)|purport(s|ed)?|so[- ]called)\b/gi, w: 0.6 },
  { re: /\b(according to|researchers at|a study (published|in)|professor|university of|peer[- ]reviewed|journal of)\b.{0,60}\b[A-Z]/g, w: 0.7 },
  { re: /\b(rated|ruled|found to be) (false|pants on fire|mostly false|misleading)\b/gi, w: 1.4 },
  { re: /\b(experts?|historians?|scientists?) (interviewed|contacted|consulted) (by|for)\b/gi, w: 0.9 },
  { re: /\b(reuters|associated press|ap news|snopes|politifact|factcheck\.org|afp fact check)\b/gi, w: 1.2 }
];

// Evidentiary GOOD practice markers — named sources, links, specific citation.
// Their presence raises the bar for evidence-layer techniques and feeds the
// stakes-inflation gap computation (claimed stakes vs. offered evidence).
TS.EVIDENCE_MARKERS = [
  { re: /\bhttps?:\/\//gi, w: 0.8 },                                        // outbound links
  { re: /\((\d{4})\)/g, w: 0.6 },                                           // year citations
  { re: /\b(said|according to|testified|wrote|told\s+\w+)\s+(Dr\.|Prof\.|Sen\.|Rep\.|Judge|Justice)?\s*[A-Z][a-z]+ [A-Z][a-z]+/g, w: 1.0 }, // named humans
  { re: /\b(court (filing|records?|documents?)|sworn testimony|deposition|transcript|public records?|freedom of information|foia)\b/gi, w: 1.0 },
  { re: /\b(the study|the report|the audit|the data),? (published|released|available) (in|by|at)\b/gi, w: 1.0 },
  { re: /\bp\s*[<=]\s*0?\.\d+/gi, w: 1.0 },                                 // statistical reporting
  { re: /\b(margin of error|confidence interval|sample size|n\s*=\s*\d+)\b/gi, w: 1.0 },
  { re: /\b(compared (to|with)|versus|up from|down from|a year (ago|earlier)|the same period)\b/gi, w: 0.7 } // baselines
];

if (typeof module !== 'undefined') module.exports = TS;
