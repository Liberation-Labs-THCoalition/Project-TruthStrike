// TruthStrike 2.0 — popup controller

var PATHWAY_META = {
  threat:   { label: 'Threat',   varName: '--c-threat' },
  social:   { label: 'Social',   varName: '--c-social' },
  reward:   { label: 'Reward',   varName: '--c-reward' },
  evidence: { label: 'Evidence', varName: '--c-evidence' },
  stakes:   { label: 'Stakes',   varName: '--c-stakes' }
};

function cssVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function timeAgo(ts) {
  var s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return 'now';
  if (s < 3600) return Math.floor(s / 60) + 'm';
  if (s < 86400) return Math.floor(s / 3600) + 'h';
  return Math.floor(s / 86400) + 'd';
}

async function render() {
  var d = await chrome.storage.local.get(['stats', 'sightings']);
  var stats = d.stats || { flags: 0, byBand: {}, byPathway: {}, recent: [] };

  document.getElementById('t-flags').textContent = stats.flags || 0;
  document.getElementById('t-high').textContent = (stats.byBand.high || 0) + (stats.byBand.severe || 0);

  // Coordination clusters need the fingerprint module — computed in dashboard;
  // here we show the stored sighting count grouped cheaply.
  var sightings = d.sightings || [];
  var clusterEl = document.getElementById('t-clusters');
  try {
    var clusters = TS.network.clusters(sightings, 3);
    clusterEl.textContent = clusters.length;
  } catch (e) {
    clusterEl.textContent = '–';
  }

  // Pathway bars: counts of flags where each pathway ran hot.
  var wrap = document.getElementById('pathways');
  wrap.textContent = '';
  var byPathway = stats.byPathway || {};
  var max = Math.max(1, ...Object.values(byPathway));
  Object.keys(PATHWAY_META).forEach(function (p) {
    var v = byPathway[p] || 0;
    var row = document.createElement('div'); row.className = 'bar-row';
    var lbl = document.createElement('span'); lbl.className = 'lbl'; lbl.textContent = PATHWAY_META[p].label;
    var track = document.createElement('div'); track.className = 'track';
    var fill = document.createElement('div'); fill.className = 'fill';
    fill.style.width = Math.max(2, (v / max) * 100) + '%';
    fill.style.background = cssVar(PATHWAY_META[p].varName);
    track.appendChild(fill);
    var val = document.createElement('span'); val.className = 'val'; val.textContent = v;
    row.appendChild(lbl); row.appendChild(track); row.appendChild(val);
    row.title = PATHWAY_META[p].label + ' pathway: ' + v + ' flags';
    wrap.appendChild(row);
  });

  // Paste-army alert
  if (stats.lastPasteArmy && Date.now() - stats.lastPasteArmy.ts < 24 * 3600e3) {
    var army = document.getElementById('army');
    army.hidden = false;
    army.innerHTML = '<b>Paste-army pattern</b> on ' + stats.lastPasteArmy.domain +
      ': ' + stats.lastPasteArmy.pairs + ' near-identical post pairs (' + stats.lastPasteArmy.score + '% similarity rate).';
  }

  // Recent flags
  var recent = document.getElementById('recent');
  if (stats.recent && stats.recent.length) {
    recent.textContent = '';
    stats.recent.slice(0, 6).forEach(function (r) {
      var row = document.createElement('div'); row.className = 'catch';
      var dEl = document.createElement('span'); dEl.className = 'd';
      dEl.textContent = r.domain + ' · ' + (r.top || []).join(', ');
      var sEl = document.createElement('span'); sEl.className = 's';
      sEl.textContent = r.index + ' · ' + timeAgo(r.ts);
      row.appendChild(dEl); row.appendChild(sEl);
      recent.appendChild(row);
    });
  }
}

async function llmStatus() {
  var el = document.getElementById('llm-status');
  chrome.runtime.sendMessage({ type: 'llm-status' }, function (res) {
    if (chrome.runtime.lastError || !res) { el.textContent = 'heuristics only'; return; }
    el.textContent = res.backend === 'prompt-api' ? '● on-device model (Chrome)'
      : res.backend === 'ollama' ? '● local model (' + (res.model || 'ollama') + ')'
      : res.backend === 'off' ? 'local model disabled'
      : 'heuristics only — add a local model in Options';
  });
}

document.getElementById('scan').addEventListener('click', async function () {
  var tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tabs[0]) return;
  var btn = this;
  chrome.tabs.sendMessage(tabs[0].id, { type: 'scan-now' }, function (res) {
    if (chrome.runtime.lastError) { btn.textContent = 'Not scannable here'; return; }
    btn.textContent = '✓ Scanned — ' + ((res && res.flagged) || 0) + ' flags';
    setTimeout(function () { btn.textContent = 'Scan this page'; render(); }, 1600);
  });
});

document.getElementById('dashboard').addEventListener('click', function () {
  chrome.tabs.create({ url: chrome.runtime.getURL('dashboard/dashboard.html') });
});
document.getElementById('options').addEventListener('click', function () {
  chrome.runtime.openOptionsPage();
});

render();
llmStatus();
