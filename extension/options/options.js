// TruthStrike 2.0 — options controller

var DEFAULTS = {
  enabled: true, autoScan: true, ownerChip: true, minBand: 25,
  llm: { enabled: true, ollamaUrl: 'http://localhost:11434', ollamaModel: 'qwen2.5:1.5b-instruct' },
  fecKey: ''
};

async function load() {
  var d = await chrome.storage.local.get(['settings']);
  var s = Object.assign({}, DEFAULTS, d.settings || {});
  s.llm = Object.assign({}, DEFAULTS.llm, (d.settings || {}).llm || {});

  document.getElementById('enabled').checked = s.enabled;
  document.getElementById('autoScan').checked = s.autoScan;
  document.getElementById('ownerChip').checked = s.ownerChip;
  document.getElementById('minBand').value = String(s.minBand);
  document.getElementById('llmEnabled').checked = s.llm.enabled;
  document.getElementById('ollamaUrl').value = s.llm.ollamaUrl;
  document.getElementById('ollamaModel').value = s.llm.ollamaModel;
  document.getElementById('fecKey').value = s.fecKey || '';
  llmStatus();
}

function llmStatus() {
  var el = document.getElementById('llmStatus');
  chrome.runtime.sendMessage({ type: 'llm-status' }, function (res) {
    if (chrome.runtime.lastError || !res) { el.textContent = 'Status: unknown'; return; }
    el.textContent = 'Status: ' + (
      res.backend === 'prompt-api' ? '✓ Chrome on-device model available' :
      res.backend === 'ollama' ? '✓ Ollama reachable (' + (res.model || '') + ')' :
      res.backend === 'off' ? 'disabled' :
      '✗ no local model found — heuristics still fully functional');
  });
}

document.getElementById('save').addEventListener('click', async function () {
  var s = {
    enabled: document.getElementById('enabled').checked,
    autoScan: document.getElementById('autoScan').checked,
    ownerChip: document.getElementById('ownerChip').checked,
    minBand: parseInt(document.getElementById('minBand').value, 10),
    llm: {
      enabled: document.getElementById('llmEnabled').checked,
      ollamaUrl: document.getElementById('ollamaUrl').value.trim() || DEFAULTS.llm.ollamaUrl,
      ollamaModel: document.getElementById('ollamaModel').value.trim() || DEFAULTS.llm.ollamaModel
    },
    fecKey: document.getElementById('fecKey').value.trim()
  };
  await chrome.storage.local.set({ settings: s });
  var saved = document.getElementById('saved');
  saved.classList.add('on');
  setTimeout(function () { saved.classList.remove('on'); }, 1500);
  llmStatus();
});

document.getElementById('resetFeedback').addEventListener('click', async function () {
  await chrome.storage.local.remove(['feedbackState']);
  this.textContent = 'Done ✓';
});

document.getElementById('clearAll').addEventListener('click', async function () {
  await chrome.storage.local.remove(['feedbackState', 'stats', 'sightings']);
  this.textContent = 'Done ✓';
});

load();
