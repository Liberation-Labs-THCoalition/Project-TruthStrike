// TruthStrike 2.0 — dashboard controller

var VAR_BY_PATHWAY = { threat: '--c-threat', social: '--c-social', reward: '--c-reward', evidence: '--c-evidence', stakes: '--c-stakes' };

function cssVar(n) { return getComputedStyle(document.documentElement).getPropertyValue(n).trim(); }
function pcolor(p) { return cssVar(VAR_BY_PATHWAY[p] || '--c-evidence'); }
function el(tag, cls, text) {
  var e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text != null) e.textContent = text;
  return e;
}
function fmtDate(ts) {
  return new Date(ts).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

async function render() {
  var d = await chrome.storage.local.get(['stats', 'sightings', 'feedbackState']);
  var stats = d.stats || { flags: 0, byBand: {}, byPathway: {}, recent: [] };
  var sightings = d.sightings || [];

  document.getElementById('t-flags').textContent = stats.flags || 0;
  document.getElementById('t-severe').textContent = (stats.byBand.high || 0) + (stats.byBand.severe || 0);
  document.getElementById('t-sightings').textContent = sightings.length;

  // ── Technique bars, colored by pathway ──────────────────────────────────
  var counts = {};
  (stats.recent || []).forEach(function (r) {
    (r.top || []).forEach(function (id) { counts[id] = (counts[id] || 0) + 1; });
  });
  var ids = Object.keys(counts).sort(function (a, b) { return counts[b] - counts[a]; });
  if (ids.length) {
    var legend = document.getElementById('legend');
    Object.keys(TS.PATHWAYS).forEach(function (p) {
      var s = el('span');
      var dot = el('span', 'dot'); dot.style.background = pcolor(p);
      s.appendChild(dot); s.appendChild(document.createTextNode(TS.PATHWAYS[p].label));
      legend.appendChild(s);
    });
    var wrap = document.getElementById('tech-bars');
    wrap.textContent = '';
    var max = counts[ids[0]];
    ids.forEach(function (id) {
      var t = TS.techniqueById[id];
      if (!t) return;
      var row = el('div', 'bar-row');
      var lbl = el('span', 'lbl');
      var dot = el('span', 'dot'); dot.style.background = pcolor(t.pathway);
      lbl.appendChild(dot); lbl.appendChild(document.createTextNode(t.name));
      var track = el('div', 'track');
      var fill = el('div', 'fill');
      fill.style.width = Math.max(2, (counts[id] / max) * 100) + '%';
      fill.style.background = pcolor(t.pathway);
      track.appendChild(fill);
      row.appendChild(lbl); row.appendChild(track); row.appendChild(el('span', 'val', String(counts[id])));
      row.title = t.explain;
      wrap.appendChild(row);
    });
  }

  // ── Coordination clusters with cascade timelines ────────────────────────
  var clusters = [];
  try { clusters = TS.network.clusters(sightings, 3); } catch (e) {}
  document.getElementById('t-clusters').textContent = clusters.length;
  if (clusters.length) {
    var cwrap = document.getElementById('clusters');
    cwrap.textContent = '';
    clusters.slice(0, 8).forEach(function (c) {
      var card = el('div', 'cluster');
      var hd = el('div', 'hd');
      var left = el('span');
      left.appendChild(el('b', null, c.domains.length + ' domains'));
      left.appendChild(document.createTextNode(' · span ' + c.spanHours + 'h · first seen ' + fmtDate(c.firstSeen)));
      hd.appendChild(left);
      hd.appendChild(el('span', 'strength', 'signature match ' + c.strength + '%'));
      card.appendChild(hd);

      // Cascade: dots positioned by time along one axis, labeled by domain.
      var cas = el('div', 'cascade');
      cas.appendChild(el('div', 'axis'));
      var t0 = c.sightings[0].ts;
      var span = Math.max(1, c.sightings[c.sightings.length - 1].ts - t0);
      var seen = {};
      c.sightings.forEach(function (s) {
        if (seen[s.domain]) return; // first appearance per domain
        seen[s.domain] = true;
        var x = 6 + ((s.ts - t0) / span) * 88; // percent, padded
        var stop = el('div', 'stop');
        stop.style.left = x + '%';
        stop.title = s.domain + ' · ' + fmtDate(s.ts) + ' · index ' + s.index;
        var lbl = el('div', 'stop-lbl', s.domain);
        lbl.style.left = x + '%';
        cas.appendChild(stop); cas.appendChild(lbl);
      });
      cas.appendChild(el('span', 't0', 'origin in your browsing → spread'));
      card.appendChild(cas);
      card.appendChild(el('div', 'snippet', '“' + (c.sightings[0].snippet || '') + '…”'));
      cwrap.appendChild(card);
    });
  }

  // ── Calibration table ───────────────────────────────────────────────────
  if (d.feedbackState) {
    var summary = TS.feedback.summary(d.feedbackState).filter(function (r) { return r.votes > 0; });
    if (summary.length) {
      var cw = document.getElementById('calibration');
      cw.textContent = '';
      var table = el('table');
      var thead = el('thead');
      var trh = el('tr');
      ['Technique', '👍', '👎', 'Weight'].forEach(function (h) { trh.appendChild(el('th', null, h)); });
      thead.appendChild(trh); table.appendChild(thead);
      var tbody = el('tbody');
      summary.forEach(function (r) {
        var tr = el('tr');
        tr.appendChild(el('td', null, r.name));
        tr.appendChild(el('td', null, String(r.helpful)));
        tr.appendChild(el('td', null, String(r.unhelpful)));
        var td = el('td', r.multiplier > 1 ? 'mult-up' : r.multiplier < 1 ? 'mult-down' : null, '×' + r.multiplier.toFixed(2));
        tr.appendChild(td);
        tbody.appendChild(tr);
      });
      table.appendChild(tbody);
      cw.appendChild(table);
    }
  }

  // ── Recent flags table ──────────────────────────────────────────────────
  if (stats.recent && stats.recent.length) {
    var rw = document.getElementById('recent');
    rw.textContent = '';
    var table2 = el('table');
    var trh2 = el('tr');
    ['When', 'Domain', 'Index', 'Band', 'Top techniques'].forEach(function (h) { trh2.appendChild(el('th', null, h)); });
    table2.appendChild(trh2);
    stats.recent.slice(0, 25).forEach(function (r) {
      var tr = el('tr');
      tr.appendChild(el('td', null, fmtDate(r.ts)));
      tr.appendChild(el('td', null, r.domain));
      tr.appendChild(el('td', null, String(r.index)));
      tr.appendChild(el('td', null, r.band));
      tr.appendChild(el('td', null, (r.top || []).map(function (id) {
        var t = TS.techniqueById[id]; return t ? t.name : id;
      }).join(', ')));
      table2.appendChild(tr);
    });
    rw.appendChild(table2);
  }
}

render();
