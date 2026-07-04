// TruthStrike 2.0 — Follow the Money engine
//
// Three layers, all optional-network EXCEPT the first:
//   1. Bundled databases (ownership.json, organizations.json) — zero network,
//      always available, shipped with the extension and auditable in git.
//   2. ProPublica Nonprofit Explorer API — public, keyless. Pulls real 990
//      revenue/asset figures for any named org, on user click only.
//   3. FEC API — public (DEMO_KEY works; users can add a free api.data.gov
//      key in options). Campaign-finance receipts by contributor/committee,
//      on user click only.
//
// Privacy rule: layers 2–3 fire only on explicit user action ("Pull receipts"),
// never automatically, and queries contain org names from our public database —
// never page content or URLs.

var TS = globalThis.TS = globalThis.TS || {};

(function () {
  TS.money = {
    _ownership: null,
    _orgs: null,

    // In the extension, data files are loaded via runtime URL; in tests, pass
    // the parsed objects directly to init().
    init: function (ownership, organizations) {
      TS.money._ownership = ownership;
      TS.money._orgs = organizations;
    },

    loadFromExtension: async function () {
      if (TS.money._ownership) return;
      var [o, g] = await Promise.all([
        fetch(chrome.runtime.getURL('data/ownership.json')).then(function (r) { return r.json(); }),
        fetch(chrome.runtime.getURL('data/organizations.json')).then(function (r) { return r.json(); })
      ]);
      TS.money.init(o, g);
    },

    // Who owns the site the user is looking at?
    ownerOf: function (hostname) {
      if (!TS.money._ownership) return null;
      var domains = TS.money._ownership.domains;
      var h = String(hostname || '').toLowerCase().replace(/^www\./, '');
      // exact, then suffix match (news.foxnews.com -> foxnews.com)
      if (domains[h]) return Object.assign({ domain: h }, domains[h]);
      var parts = h.split('.');
      for (var i = 1; i < parts.length - 1; i++) {
        var candidate = parts.slice(i).join('.');
        if (domains[candidate]) return Object.assign({ domain: candidate }, domains[candidate]);
      }
      return null;
    },

    // Full org profile from the bundled influence-network database.
    orgProfile: function (name) {
      if (!TS.money._orgs) return null;
      var orgs = TS.money._orgs.organizations;
      if (orgs[name]) return Object.assign({ name: name }, orgs[name]);
      // loose match
      var lower = String(name || '').toLowerCase();
      var keys = Object.keys(orgs);
      for (var i = 0; i < keys.length; i++) {
        if (keys[i].toLowerCase().indexOf(lower) !== -1 || lower.indexOf(keys[i].toLowerCase()) !== -1) {
          return Object.assign({ name: keys[i] }, orgs[keys[i]]);
        }
      }
      return null;
    },

    listOrgs: function () {
      return TS.money._orgs ? Object.keys(TS.money._orgs.organizations) : [];
    },

    // ── Layer 2: ProPublica Nonprofit Explorer (keyless, user-triggered) ────
    nonprofitSearch: async function (orgName) {
      var url = 'https://projects.propublica.org/nonprofits/api/v2/search.json?q=' +
        encodeURIComponent(orgName);
      var r = await fetch(url, { signal: AbortSignal.timeout(8000) });
      if (!r.ok) throw new Error('propublica http ' + r.status);
      var data = await r.json();
      return (data.organizations || []).slice(0, 5).map(function (o) {
        return {
          name: o.name, ein: o.ein, city: o.city, state: o.state,
          url: 'https://projects.propublica.org/nonprofits/organizations/' + o.ein
        };
      });
    },

    nonprofitFilings: async function (ein) {
      var r = await fetch('https://projects.propublica.org/nonprofits/api/v2/organizations/' + ein + '.json',
        { signal: AbortSignal.timeout(8000) });
      if (!r.ok) throw new Error('propublica http ' + r.status);
      var data = await r.json();
      var filings = (data.filings_with_data || []).slice(0, 5).map(function (f) {
        return { year: f.tax_prd_yr, revenue: f.totrevenue, expenses: f.totfuncexpns, assets: f.totassetsend };
      });
      return { name: data.organization && data.organization.name, ein: ein, filings: filings };
    },

    // ── Layer 3: FEC (DEMO_KEY by default; user key via options) ───────────
    fecReceipts: async function (contributorName, apiKey) {
      var key = apiKey || 'DEMO_KEY';
      var url = 'https://api.open.fec.gov/v1/schedules/schedule_a/?api_key=' + encodeURIComponent(key) +
        '&contributor_name=' + encodeURIComponent(contributorName) +
        '&sort=-contribution_receipt_amount&per_page=10';
      var r = await fetch(url, { signal: AbortSignal.timeout(10000) });
      if (!r.ok) throw new Error('fec http ' + r.status);
      var data = await r.json();
      return (data.results || []).map(function (x) {
        return {
          contributor: x.contributor_name,
          amount: x.contribution_receipt_amount,
          committee: x.committee && x.committee.name,
          date: x.contribution_receipt_date,
          link: 'https://www.fec.gov/data/receipts/?contributor_name=' + encodeURIComponent(contributorName)
        };
      });
    }
  };
})();

if (typeof module !== 'undefined') module.exports = TS;
