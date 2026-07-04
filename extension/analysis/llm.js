// TruthStrike 2.0 — Local LLM Adapter (Tier 2)
//
// Privacy contract: page content NEVER leaves the machine. The adapter probes,
// in order:
//
//   1. Chrome's built-in Prompt API (Gemini Nano, fully on-device)
//   2. A local Ollama server (http://localhost:11434) — user-configurable
//      model, default qwen2.5:1.5b-instruct (~1GB, runs on most laptops)
//   3. Nothing — the heuristic engine stands alone.
//
// There is deliberately NO cloud fallback and no way to configure one from
// the UI. If someone wants to point this at a remote endpoint they must edit
// source, which makes the privacy posture auditable rather than promised.
//
// The prompt asks for a structured judgment over the same technique taxonomy
// the heuristics use, so Tier 1 and Tier 2 speak the same language and the
// scorer can blend them.

var TS = globalThis.TS = globalThis.TS || {};

(function () {
  var OLLAMA_URL = 'http://localhost:11434';
  var DEFAULT_MODEL = 'qwen2.5:1.5b-instruct';

  var TECH_IDS = TS.TECHNIQUES ? TS.TECHNIQUES.map(function (t) { return t.id; }) : [];

  function buildPrompt(text) {
    return [
      'You are a propaganda-technique analyst. Analyze the TEXT for manipulation techniques.',
      'Score how strongly the text USES each technique to persuade its reader (not whether it merely mentions or debunks such rhetoric — fact-checks and research articles about misinformation should score near 0).',
      '',
      'Techniques: ' + TECH_IDS.join(', '),
      '',
      'Respond with ONLY a JSON object, no prose:',
      '{"index": <0-100 overall manipulation intensity>,',
      ' "techniques": [<ids of techniques clearly present>],',
      ' "rationale": "<one sentence, plain language, for a general reader>",',
      ' "counter_points": ["<up to 3 short factual counter-framing bullets>"]}',
      '',
      'TEXT:',
      '"""',
      String(text || '').slice(0, 6000),
      '"""'
    ].join('\n');
  }

  // Tolerant JSON extraction: models wrap JSON in prose/fences constantly.
  function extractJSON(s) {
    if (!s) return null;
    var m = s.match(/\{[\s\S]*\}/);
    if (!m) return null;
    try { return JSON.parse(m[0]); } catch (e) { /* try repairs */ }
    try { return JSON.parse(m[0].replace(/,\s*([}\]])/g, '$1')); } catch (e) { return null; }
  }

  function sanitize(j) {
    if (!j || typeof j !== 'object') return null;
    var idx = Number(j.index);
    if (!isFinite(idx)) return null;
    return {
      index: Math.max(0, Math.min(100, idx)),
      techniques: Array.isArray(j.techniques)
        ? j.techniques.filter(function (id) { return TECH_IDS.indexOf(id) !== -1; })
        : [],
      rationale: typeof j.rationale === 'string' ? j.rationale.slice(0, 400) : '',
      counterPoints: Array.isArray(j.counter_points)
        ? j.counter_points.slice(0, 3).map(function (c) { return String(c).slice(0, 300); })
        : []
    };
  }

  // ── Backend: Chrome Prompt API (Gemini Nano) ──────────────────────────────
  async function promptAPIAvailable() {
    try {
      if (typeof LanguageModel === 'undefined') return false;
      var avail = await LanguageModel.availability();
      return avail === 'available' || avail === 'readily';
    } catch (e) { return false; }
  }

  async function runPromptAPI(prompt) {
    var session = await LanguageModel.create({
      temperature: 0.1, topK: 3,
      initialPrompts: [{ role: 'system', content: 'You analyze rhetoric. You respond only with JSON.' }]
    });
    try {
      return await session.prompt(prompt);
    } finally {
      try { session.destroy(); } catch (e) { /* noop */ }
    }
  }

  // ── Backend: Ollama ───────────────────────────────────────────────────────
  async function ollamaAvailable(cfg) {
    try {
      var r = await fetch((cfg.ollamaUrl || OLLAMA_URL) + '/api/tags', { signal: AbortSignal.timeout(1200) });
      return r.ok;
    } catch (e) { return false; }
  }

  async function runOllama(prompt, cfg) {
    var r = await fetch((cfg.ollamaUrl || OLLAMA_URL) + '/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: cfg.ollamaModel || DEFAULT_MODEL,
        prompt: prompt,
        stream: false,
        format: 'json',
        options: { temperature: 0.1, num_predict: 400 }
      }),
      signal: AbortSignal.timeout(30000)
    });
    if (!r.ok) throw new Error('ollama http ' + r.status);
    var data = await r.json();
    return data.response;
  }

  TS.llm = {
    DEFAULT_MODEL: DEFAULT_MODEL,
    OLLAMA_URL: OLLAMA_URL,

    /** Probe which backend is usable. cfg: {enabled, ollamaUrl, ollamaModel} */
    detectBackend: async function (cfg) {
      cfg = cfg || {};
      if (cfg.enabled === false) return { backend: 'off' };
      if (await promptAPIAvailable()) return { backend: 'prompt-api' };
      if (await ollamaAvailable(cfg)) return { backend: 'ollama', model: cfg.ollamaModel || DEFAULT_MODEL };
      return { backend: 'none' };
    },

    /**
     * Analyze text with whichever local backend is available.
     * Returns sanitized judgment or null (never throws; Tier 2 is optional).
     */
    analyze: async function (text, cfg) {
      cfg = cfg || {};
      try {
        var b = await TS.llm.detectBackend(cfg);
        if (b.backend === 'off' || b.backend === 'none') return null;
        var prompt = buildPrompt(text);
        var rawOut = b.backend === 'prompt-api'
          ? await runPromptAPI(prompt)
          : await runOllama(prompt, cfg);
        var j = sanitize(extractJSON(rawOut));
        if (j) j.backend = b.backend;
        return j;
      } catch (e) {
        return null;
      }
    },

    /**
     * Generate a counter-narrative for flagged content. Same privacy rules.
     * Returns { text, points } or null.
     */
    counterNarrative: async function (text, scored, cfg) {
      cfg = cfg || {};
      try {
        var b = await TS.llm.detectBackend(cfg);
        if (b.backend === 'off' || b.backend === 'none') return null;
        var topNames = (scored.top || []).map(function (t) {
          var tt = TS.techniqueById[t.id]; return tt ? tt.name : t.id;
        }).join(', ');
        var prompt = [
          'A reader encountered content that uses these manipulation techniques: ' + topNames + '.',
          'Write a short, calm, factual counter-framing a person could post in reply.',
          'Rules: no insults, no sarcasm, no percent-certain claims you cannot support,',
          'acknowledge any legitimate underlying concern, 2-4 sentences, then up to 2',
          'bullet suggestions of what a reader could verify themselves.',
          'Respond ONLY with JSON: {"text": "...", "verify": ["...", "..."]}',
          '',
          'CONTENT:', '"""', String(text || '').slice(0, 3000), '"""'
        ].join('\n');
        var rawOut = b.backend === 'prompt-api'
          ? await runPromptAPI(prompt)
          : await runOllama(prompt, cfg);
        var j = extractJSON(rawOut);
        if (!j || typeof j.text !== 'string') return null;
        return {
          text: j.text.slice(0, 900),
          verify: Array.isArray(j.verify) ? j.verify.slice(0, 2).map(String) : [],
          backend: b.backend
        };
      } catch (e) {
        return null;
      }
    }
  };
})();

if (typeof module !== 'undefined') module.exports = TS;
