// TruthStrike 2.0 — Overlay UI (Shadow DOM)
//
// Design rules, learned the hard way from v1:
//   * NEVER obscure or dim content. v1 set opacity 0.6 and a red border —
//     that's censorship theater and it converts nobody. v2 attaches a small
//     badge; everything else is opt-in click-through.
//   * Everything renders in a closed Shadow DOM so page CSS can't break us
//     and we can't break the page.
//   * Explain, don't accuse: the panel shows WHY (techniques + samples), the
//     score, the confidence, and hands the user tools — never a verdict alone.

var TS = globalThis.TS = globalThis.TS || {};

(function () {
  var PATHWAY_LIGHT = { threat: '#e5484d', social: '#f76b15', reward: '#8e4ec6', evidence: '#0090ff', stakes: '#e5a000' };
  var PATHWAY_DARK  = { threat: '#e5484d', social: '#e35f0a', reward: '#8e4ec6', evidence: '#0090ff', stakes: '#b88500' };

  var CSS = [
    ':host { all: initial; }',
    '* { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }',
    '.badge { display:inline-flex; align-items:center; gap:6px; cursor:pointer; user-select:none;',
    '  font-size:12px; font-weight:600; line-height:1; padding:5px 10px; border-radius:999px;',
    '  background:#fff; color:#1c2024; border:1.5px solid #d9dce0; box-shadow:0 1px 4px rgba(0,0,0,.12); }',
    '.badge:hover { box-shadow:0 2px 8px rgba(0,0,0,.2); }',
    '.badge .dot { width:8px; height:8px; border-radius:50%; }',
    '.badge.elevated .dot { background:#e5a000; } .badge.high .dot { background:#f76b15; } .badge.severe .dot { background:#e5484d; }',
    '.panel { width:400px; max-width:92vw; background:#fff; color:#1c2024; border-radius:12px;',
    '  border:1px solid #e0e3e7; box-shadow:0 12px 40px rgba(0,0,0,.22); margin-top:8px; overflow:hidden; }',
    '.hd { display:flex; align-items:center; justify-content:space-between; padding:12px 14px; border-bottom:1px solid #eceef1; }',
    '.hd .title { font-size:13px; font-weight:700; letter-spacing:.02em; }',
    '.hd .score { font-size:22px; font-weight:800; font-variant-numeric:tabular-nums; }',
    '.hd .close { cursor:pointer; border:none; background:none; font-size:16px; color:#7d858d; padding:4px; }',
    '.sub { font-size:11px; color:#5c6570; padding:0 14px 8px; }',
    '.tabs { display:flex; gap:2px; padding:0 10px; border-bottom:1px solid #eceef1; }',
    '.tab { flex:1; text-align:center; font-size:12px; font-weight:600; color:#5c6570; padding:8px 4px; cursor:pointer; border:none; background:none; border-bottom:2px solid transparent; }',
    '.tab.on { color:#1c2024; border-bottom-color:#1c2024; }',
    '.body { padding:12px 14px; max-height:420px; overflow-y:auto; font-size:12.5px; line-height:1.45; }',
    '.bar-row { display:grid; grid-template-columns:64px 1fr 28px; align-items:center; gap:8px; margin:5px 0; }',
    '.bar-row .lbl { font-size:11px; font-weight:600; color:#3a4149; }',
    '.bar-row .val { font-size:11px; font-weight:700; color:#1c2024; text-align:right; font-variant-numeric:tabular-nums; }',
    '.track { height:6px; border-radius:4px; background:#eef0f2; overflow:hidden; }',
    '.fill { height:100%; border-radius:4px; }',
    '.tech { margin:10px 0; padding:10px; border:1px solid #eceef1; border-radius:8px; }',
    '.tech .nm { font-weight:700; font-size:12px; display:flex; align-items:center; gap:6px; }',
    '.tech .nm .dot { width:7px; height:7px; border-radius:50%; flex:none; }',
    '.tech .ex { color:#4c545d; margin-top:4px; }',
    '.tech .sm { color:#7d858d; font-size:11px; margin-top:5px; font-style:italic; }',
    '.cta { display:flex; gap:8px; flex-wrap:wrap; margin-top:10px; }',
    '.btn { font-size:12px; font-weight:600; padding:7px 12px; border-radius:8px; cursor:pointer;',
    '  border:1px solid #d9dce0; background:#fff; color:#1c2024; }',
    '.btn:hover { background:#f5f6f7; }',
    '.btn.primary { background:#1c2024; border-color:#1c2024; color:#fff; }',
    '.btn.primary:hover { background:#33383d; }',
    '.counter-txt { background:#f7f8f9; border:1px solid #eceef1; border-radius:8px; padding:10px; white-space:pre-wrap; }',
    '.src a { color:#0b68cb; font-size:11.5px; word-break:break-all; display:block; margin-top:4px; }',
    '.owner { padding:10px; border:1px solid #eceef1; border-radius:8px; margin-bottom:8px; }',
    '.owner .on { font-weight:700; }',
    '.owner .ot { color:#5c6570; font-size:11.5px; margin-top:2px; }',
    '.owner .note { margin-top:6px; }',
    '.fb { display:flex; align-items:center; gap:8px; padding:10px 14px; border-top:1px solid #eceef1; font-size:11.5px; color:#5c6570; }',
    '.fb button { cursor:pointer; border:1px solid #d9dce0; background:#fff; border-radius:6px; padding:4px 10px; font-size:13px; }',
    '.fb button:hover { background:#f5f6f7; }',
    '.fb .done { color:#2b823a; font-weight:600; }',
    '.conf { color:#7d858d; }',
    '.select { width:100%; font-size:12px; padding:6px; border:1px solid #d9dce0; border-radius:6px; margin-bottom:8px; background:#fff; color:#1c2024; }',
    '.muted { color:#7d858d; font-size:11.5px; }',
    '.chip-host { position:fixed; bottom:16px; left:16px; z-index:2147483646; }',
    '.chip { display:flex; align-items:center; gap:8px; background:#fff; color:#1c2024; border:1px solid #d9dce0;',
    '  border-radius:10px; padding:9px 12px; font-size:12px; box-shadow:0 4px 16px rgba(0,0,0,.18); max-width:340px; }',
    '.chip .x { cursor:pointer; color:#7d858d; border:none; background:none; font-size:14px; padding:0 2px; }',
    '@media (prefers-color-scheme: dark) {',
    '  .badge { background:#1d2024; color:#edeef0; border-color:#3a4149; }',
    '  .panel, .chip { background:#1d2024; color:#edeef0; border-color:#3a4149; }',
    '  .hd, .tabs, .fb { border-color:#2c3238; } .tech, .owner, .counter-txt, .select { border-color:#2c3238; background:#22262b; }',
    '  .tab.on { color:#edeef0; border-bottom-color:#edeef0; }',
    '  .hd .score, .bar-row .val, .tech .nm { color:#edeef0; }',
    '  .bar-row .lbl { color:#c3c9cf; } .tech .ex { color:#b0b7bd; } .sub, .fb, .muted, .conf { color:#9aa2aa; }',
    '  .track { background:#2c3238; }',
    '  .btn { background:#22262b; color:#edeef0; border-color:#3a4149; } .btn:hover { background:#2c3238; }',
    '  .btn.primary { background:#edeef0; color:#1c2024; border-color:#edeef0; }',
    '  .fb button { background:#22262b; color:#edeef0; border-color:#3a4149; }',
    '  .src a { color:#6cb1f5; }',
    '}'
  ].join('\n');

  function pathwayColor(p) {
    var dark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    return (dark ? PATHWAY_DARK : PATHWAY_LIGHT)[p] || '#7d858d';
  }

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  // ── Pathway bars (direct-labeled, text carries identity, color reinforces) ─
  function pathwayBars(scored) {
    var wrap = el('div');
    ['threat', 'social', 'reward', 'evidence', 'stakes'].forEach(function (p) {
      var v = scored.pathways[p] || 0;
      var row = el('div', 'bar-row');
      row.appendChild(el('span', 'lbl', TS.PATHWAYS[p].label));
      var track = el('div', 'track');
      var fill = el('div', 'fill');
      fill.style.width = Math.max(2, v) + '%';
      fill.style.background = pathwayColor(p);
      track.appendChild(fill);
      row.appendChild(track);
      row.appendChild(el('span', 'val', String(v)));
      row.title = TS.PATHWAYS[p].blurb;
      wrap.appendChild(row);
    });
    return wrap;
  }

  function whyTab(scored) {
    var body = el('div');
    body.appendChild(pathwayBars(scored));
    if (!scored.top.length) body.appendChild(el('p', 'muted', 'No single technique dominates; the score comes from diffuse signals.'));
    scored.top.forEach(function (t) {
      var tech = TS.techniqueById[t.id];
      if (!tech) return;
      var card = el('div', 'tech');
      var nm = el('div', 'nm');
      var dot = el('span', 'dot');
      dot.style.background = pathwayColor(tech.pathway);
      nm.appendChild(dot);
      nm.appendChild(document.createTextNode(tech.name + ' · ' + t.score));
      card.appendChild(nm);
      card.appendChild(el('div', 'ex', tech.explain));
      var samples = (scored._samples && scored._samples[t.id]) || [];
      if (samples.length) card.appendChild(el('div', 'sm', 'Matched: “' + samples.slice(0, 2).map(function (s) { return s.sample; }).join('” · “') + '”'));
      body.appendChild(card);
    });
    var note = el('p', 'muted');
    note.style.marginTop = '8px';
    note.textContent = 'Heuristic ' + (scored.llmUsed ? '+ local model ' : '') + 'analysis · confidence ' +
      Math.round(scored.confidence * 100) + '% · runs entirely on your device.';
    body.appendChild(note);
    return body;
  }

  function counterTab(scored, hooks) {
    var body = el('div');
    var scripts = TS.counter.techniqueScripts(scored);
    if (scripts.length) {
      body.appendChild(el('div', 'muted', 'Technique counters — work on any topic:'));
      scripts.slice(0, 3).forEach(function (s) {
        var card = el('div', 'tech');
        card.appendChild(el('div', 'nm', s.technique));
        card.appendChild(el('div', 'ex', s.text));
        body.appendChild(card);
      });
    }

    var famWrap = el('div');
    famWrap.style.marginTop = '10px';
    famWrap.appendChild(el('div', 'muted', 'Or pick a sourced rebuttal for a known narrative family:'));
    var sel = el('select', 'select');
    sel.appendChild(new Option('— choose narrative family —', ''));
    TS.counter.families().forEach(function (f) { sel.appendChild(new Option(f.name, f.id)); });
    famWrap.appendChild(sel);
    var out = el('div');
    famWrap.appendChild(out);
    sel.addEventListener('change', function () {
      out.textContent = '';
      if (!sel.value) return;
      var c = TS.counter.composeFromFamily(sel.value, 2);
      var txt = el('div', 'counter-txt', c.text);
      var src = el('div', 'src');
      c.sources.forEach(function (s) {
        var a = el('a', null, s); a.href = s; a.target = '_blank'; a.rel = 'noopener';
        src.appendChild(a);
      });
      var cta = el('div', 'cta');
      var copy = el('button', 'btn primary', 'Copy with sources');
      copy.addEventListener('click', function () {
        var share = TS.counter.shareUrls(c.text, c.sources);
        navigator.clipboard.writeText(share.text).then(function () { copy.textContent = 'Copied ✓'; });
      });
      var share = el('button', 'btn', 'Share…');
      share.addEventListener('click', function () {
        var u = TS.counter.shareUrls(c.text, c.sources);
        window.open(u.bluesky, '_blank');
      });
      cta.appendChild(copy); cta.appendChild(share);
      out.appendChild(txt); out.appendChild(src); out.appendChild(cta);
    });
    body.appendChild(famWrap);

    // Tier 3: local model generation via background
    var gen = el('div', 'cta');
    var genBtn = el('button', 'btn', '✨ Draft with local model');
    genBtn.addEventListener('click', function () {
      genBtn.textContent = 'Thinking (local)…'; genBtn.disabled = true;
      hooks.generateCounter(function (res) {
        genBtn.remove();
        if (!res) {
          body.appendChild(el('p', 'muted', 'No local model available. Install Ollama or enable Chrome’s built-in model in Options — content never leaves your device either way.'));
          return;
        }
        var txt = el('div', 'counter-txt', res.text);
        var cta2 = el('div', 'cta');
        var copy2 = el('button', 'btn primary', 'Copy');
        copy2.addEventListener('click', function () {
          navigator.clipboard.writeText(res.text).then(function () { copy2.textContent = 'Copied ✓'; });
        });
        cta2.appendChild(copy2);
        body.appendChild(txt);
        if (res.verify && res.verify.length) {
          body.appendChild(el('div', 'muted', 'Verify yourself: ' + res.verify.join(' · ')));
        }
        body.appendChild(cta2);
      });
    });
    gen.appendChild(genBtn);
    body.appendChild(gen);
    return body;
  }

  function moneyTab(ownerInfo, hooks) {
    var body = el('div');
    if (ownerInfo) {
      var card = el('div', 'owner');
      card.appendChild(el('div', 'on', ownerInfo.outlet + ' — ' + ownerInfo.owners.join(' → ')));
      card.appendChild(el('div', 'ot', ownerInfo.type));
      if (ownerInfo.notes) card.appendChild(el('div', 'note', ownerInfo.notes));
      var src = el('div', 'src');
      (ownerInfo.verify || []).forEach(function (s) {
        var a = el('a', null, 'Receipts: ' + s.replace(/^https?:\/\//, '').slice(0, 60));
        a.href = s; a.target = '_blank'; a.rel = 'noopener';
        src.appendChild(a);
      });
      card.appendChild(src);
      body.appendChild(card);
    } else {
      body.appendChild(el('p', 'muted', 'This domain is not in the bundled ownership database yet. Contributions welcome — the database is a public JSON file in the repo.'));
    }

    body.appendChild(el('div', 'muted', 'Influence-network organizations (bundled database, with 990/FEC receipts):'));
    var sel = el('select', 'select');
    sel.appendChild(new Option('— look up an organization —', ''));
    TS.money.listOrgs().forEach(function (o) { sel.appendChild(new Option(o, o)); });
    var out = el('div');
    sel.addEventListener('change', function () {
      out.textContent = '';
      if (!sel.value) return;
      var p = TS.money.orgProfile(sel.value);
      if (!p) return;
      var card = el('div', 'owner');
      card.appendChild(el('div', 'on', p.name));
      card.appendChild(el('div', 'ot', p.type + ' · ' + (p.scale || 'scale unknown')));
      card.appendChild(el('div', 'note', p.focus + (p.funding ? ' Funding: ' + p.funding : '')));
      var src = el('div', 'src');
      (p.receipts || []).forEach(function (s) {
        var a = el('a', null, s.replace(/^https?:\/\//, '').slice(0, 64));
        a.href = s; a.target = '_blank'; a.rel = 'noopener';
        src.appendChild(a);
      });
      card.appendChild(src);
      var cta = el('div', 'cta');
      var live = el('button', 'btn', 'Pull live 990s (ProPublica)');
      live.addEventListener('click', function () {
        live.textContent = 'Fetching…'; live.disabled = true;
        hooks.pullNonprofit(p.name, function (res) {
          live.remove();
          if (!res || !res.length) { card.appendChild(el('p', 'muted', 'No filings found / network blocked.')); return; }
          res.slice(0, 3).forEach(function (o) {
            var a = el('a', null, o.name + ' (EIN ' + o.ein + ', ' + o.state + ') → filings');
            a.href = o.url; a.target = '_blank'; a.rel = 'noopener';
            var s2 = el('div', 'src'); s2.appendChild(a); card.appendChild(s2);
          });
        });
      });
      cta.appendChild(live);
      card.appendChild(cta);
      out.appendChild(card);
    });
    body.appendChild(sel);
    body.appendChild(out);
    return body;
  }

  TS.overlay = {
    /**
     * Attach a badge (and click-to-open panel) for a flagged element.
     * hooks: { onFeedback(helpful, techniqueIds), generateCounter(cb),
     *          pullNonprofit(name, cb), ownerInfo }
     */
    attach: function (target, scored, hooks) {
      var host = document.createElement('truthstrike-flag');
      var root = host.attachShadow({ mode: 'closed' });
      var style = document.createElement('style');
      style.textContent = CSS;
      root.appendChild(style);

      var badge = el('button', 'badge ' + scored.band.key);
      badge.appendChild(el('span', 'dot'));
      badge.appendChild(document.createTextNode(scored.band.label + ' · ' + scored.index + '/100'));
      badge.title = 'TruthStrike: click to see why (analysis ran locally on your device)';
      root.appendChild(badge);

      var panel = null;
      badge.addEventListener('click', function () {
        if (panel) { panel.remove(); panel = null; return; }
        panel = el('div', 'panel');

        var hd = el('div', 'hd');
        var title = el('div', 'title', '⚡ TRUTHSTRIKE');
        var score = el('div', 'score', scored.index + '/100');
        score.style.color = scored.index >= 75 ? '#e5484d' : scored.index >= 50 ? '#f76b15' : '#e5a000';
        var close = el('button', 'close', '✕');
        close.addEventListener('click', function () { panel.remove(); panel = null; });
        hd.appendChild(title); hd.appendChild(score); hd.appendChild(close);
        panel.appendChild(hd);
        panel.appendChild(el('div', 'sub', scored.band.label + ' — manipulation techniques, not truth or falsity. Judge the content yourself; this shows you the machinery.'));

        var tabs = el('div', 'tabs');
        var bodyWrap = el('div', 'body');
        var tabDefs = [
          { name: 'Why flagged', render: function () { return whyTab(scored); } },
          { name: 'Counter', render: function () { return counterTab(scored, hooks); } },
          { name: 'Follow the money', render: function () { return moneyTab(hooks.ownerInfo, hooks); } }
        ];
        var tabBtns = [];
        tabDefs.forEach(function (td, i) {
          var b = el('button', 'tab' + (i === 0 ? ' on' : ''), td.name);
          b.addEventListener('click', function () {
            tabBtns.forEach(function (x) { x.classList.remove('on'); });
            b.classList.add('on');
            bodyWrap.textContent = '';
            bodyWrap.appendChild(td.render());
          });
          tabBtns.push(b);
          tabs.appendChild(b);
        });
        panel.appendChild(tabs);
        bodyWrap.appendChild(tabDefs[0].render());
        panel.appendChild(bodyWrap);

        var fb = el('div', 'fb');
        fb.appendChild(el('span', null, 'Was this flag useful?'));
        var yes = el('button', null, '👍');
        var no = el('button', null, '👎');
        function vote(helpful) {
          hooks.onFeedback(helpful, scored.top.map(function (t) { return t.id; }));
          fb.textContent = '';
          fb.appendChild(el('span', 'done', 'Thanks — your device recalibrates from this. No data leaves.'));
        }
        yes.addEventListener('click', function () { vote(true); });
        no.addEventListener('click', function () { vote(false); });
        fb.appendChild(yes); fb.appendChild(no);
        panel.appendChild(fb);

        root.appendChild(panel);
      });

      // Place badge just before the flagged element; never touch its styling.
      try {
        target.parentNode.insertBefore(host, target);
      } catch (e) {
        document.body.appendChild(host);
      }
      return host;
    },

    /** Site ownership chip, bottom-left, dismissible. */
    ownerChip: function (ownerInfo) {
      var host = document.createElement('truthstrike-owner');
      var root = host.attachShadow({ mode: 'closed' });
      var style = document.createElement('style');
      style.textContent = CSS;
      root.appendChild(style);
      var wrap = el('div', 'chip-host');
      var chip = el('div', 'chip');
      chip.appendChild(el('span', null, '⚡'));
      var txt = el('span');
      txt.appendChild(el('strong', null, ownerInfo.outlet));
      txt.appendChild(document.createTextNode(' is owned by ' + ownerInfo.owners.join(' → ') + ' (' + ownerInfo.type + ')'));
      chip.appendChild(txt);
      var x = el('button', 'x', '✕');
      x.title = 'Dismiss for this site today';
      x.addEventListener('click', function () { host.remove(); });
      chip.appendChild(x);
      wrap.appendChild(chip);
      root.appendChild(wrap);
      document.documentElement.appendChild(host);
      return host;
    }
  };
})();

if (typeof module !== 'undefined') module.exports = TS;
