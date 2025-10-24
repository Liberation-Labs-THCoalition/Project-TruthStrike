// TruthStrike Background Service Worker
// Coordinates API calls, money trails, and cross-tab intelligence

class TruthStrikeCommand {
  constructor() {
    this.moneyTrails = new Map();
    this.debunkDatabase = new Map();
    this.reportedContent = [];
    this.init();
  }

  async init() {
    await this.loadMoneyTrails();
    await this.loadDebunks();

    // Listen for messages from content scripts
    chrome.runtime.onMessage.addListener(this.handleMessage.bind(this));

    // Set up context menu for manual scanning
    chrome.contextMenus.create({
      id: 'truthstrike-scan',
      title: 'TruthStrike: Scan for disinformation',
      contexts: ['selection', 'page']
    });

    chrome.contextMenus.onClicked.addListener((info, tab) => {
      if (info.menuItemId === 'truthstrike-scan') {
        chrome.tabs.sendMessage(tab.id, {action: 'scan_page'});
      }
    });
  }

  async loadMoneyTrails() {
    // Money flow data - who funds what
    this.moneyTrails.set('Heritage Foundation', {
      budget: '$86 million/year',
      topDonors: [
        'Bradley Foundation: $15M+',
        'Scaife Foundations: $23M+',
        'Koch Network: $8M+',
        'DeVos Family: $5M+'
      ],
      darkMoney: '40% of funding from untraceable sources',
      lobbying: '$1.2M/year',
      taxStatus: '501(c)(3) - Your tax dollars subsidize their propaganda',
      headquarters: 'Washington, DC',
      founded: '1973',
      purpose: 'Originally created to push Reaganomics, now full culture war',
      outputs: [
        'Project 2025 (fascist takeover blueprint)',
        'Election fraud myths',
        'Anti-trans model legislation',
        'Climate denial reports',
        'Voter suppression strategies'
      ],
      connections: [
        'ALEC (writes corporate legislation)',
        'Federalist Society (packs courts)',
        'State Policy Network (state-level destruction)',
        'Daily Signal (propaganda outlet)'
      ]
    });

    this.moneyTrails.set('Koch Industries', {
      budget: '$400+ million/year in political spending',
      wealth: 'Charles Koch: $64 billion net worth',
      companies: [
        'Georgia-Pacific',
        'Guardian Industries',
        'Invista',
        'Molex',
        'Koch Ag & Energy Solutions'
      ],
      darkMoney: 'Americans for Prosperity, Freedom Partners, dozens of shells',
      environmental: '24 million tons CO2/year, 300+ oil spills',
      headquarters: 'Wichita, Kansas',
      founded: '1940 (built on Soviet oil refineries)',
      purpose: 'Eliminate regulations, taxes, and democracy itself',
      outputs: [
        'Climate denial network',
        'Anti-union campaigns',
        'School privatization',
        'Healthcare sabotage',
        'Voter suppression'
      ],
      bodyCount: 'Estimated 200,000+ premature deaths from pollution'
    });

    this.moneyTrails.set('ALEC', {
      budget: '$10 million/year',
      members: '2000 state legislators, 300+ corporations',
      topDonors: [
        'AT&T', 'ExxonMobil', 'Pfizer', 'Koch Industries',
        'State Farm', 'PhRMA', 'Altria (tobacco)'
      ],
      modelBills: '1000+ copy-paste laws for state legislatures',
      purpose: 'Corporate legislation factory',
      outputs: [
        'Stand Your Ground laws',
        'Voter ID restrictions',
        'Anti-protest laws',
        'Prison privatization',
        'Anti-union "right to work"',
        'Ag-gag laws'
      ],
      success: '20% of all state laws based on ALEC models'
    });

    this.moneyTrails.set('Family Research Council', {
      budget: '$15 million/year',
      taxStatus: '501(c)(3) despite being hate group',
      headquarters: 'Washington, DC',
      founded: '1983 by James Dobson',
      purpose: 'Christian nationalist theocracy',
      outputs: [
        'Anti-LGBTQ+ legislation',
        'Abortion bans',
        'Conversion therapy promotion',
        'Anti-Muslim propaganda',
        'Science denial in schools'
      ],
      designation: 'SPLC-designated hate group'
    });

    this.moneyTrails.set('True the Vote', {
      budget: '$10+ million (mostly dark money)',
      founder: 'Catherine Engelbrecht (Tea Party)',
      taxStatus: 'Under IRS investigation for partisan activity',
      purpose: 'Voter suppression disguised as "election integrity"',
      outputs: [
        '2000 Mules (debunked propaganda film)',
        'Voter intimidation campaigns',
        'Mass voter challenges',
        'Poll watcher harassment training'
      ],
      legal: 'Multiple lawsuits for voter intimidation'
    });
  }

  async loadDebunks() {
    // Comprehensive debunking information
    this.debunkDatabase.set('election_fraud', {
      title: 'The Big Lie: Dissecting Election Fraud Claims',
      facts: [
        {
          claim: 'Dead people voted',
          truth: 'Every case investigated, found clerical errors or Jr/Sr confusion',
          source: 'AP investigation of 350+ cases'
        },
        {
          claim: 'Dominion machines rigged',
          truth: 'Hand recounts confirmed machine counts in every audit',
          source: 'Georgia manual recount, Arizona audit'
        },
        {
          claim: 'Mail ballots are fraudulent',
          truth: 'Mail voting used safely by military since Civil War',
          source: 'MIT Election Data and Science Lab'
        },
        {
          claim: '2000 Mules proves trafficking',
          truth: 'Geolocation data can\'t prove anything, no actual evidence',
          source: 'Debunked by Republican officials, courts, and experts'
        }
      ],
      whoWon: '60+ courts, including Trump-appointed judges, found zero evidence',
      realProblem: 'Voter suppression: 400+ restrictive bills in 47 states since 2020',
      resources: [
        'https://www.brennancenter.org/issues/ensure-every-american-can-vote',
        'https://protectdemocracy.org/our-work/elections/',
        'https://www.commoncause.org/our-work/voting-and-elections/'
      ]
    });

    this.debunkDatabase.set('climate_denial', {
      title: 'Climate Denial: A Fossil Fuel Industry Production',
      facts: [
        {
          claim: 'Climate naturally changes',
          truth: 'Current rate is 100x faster than natural changes',
          source: 'NASA, NOAA, every national science academy'
        },
        {
          claim: 'CO2 is plant food',
          truth: 'Too much CO2 actually reduces crop nutrition',
          source: 'Harvard School of Public Health'
        },
        {
          claim: 'Models are unreliable',
          truth: 'Models have UNDERESTIMATED warming and impacts',
          source: 'IPCC comparison studies'
        }
      ],
      moneyTrail: 'Fossil fuel companies spent $3.6 billion on climate denial',
      realCost: '1.2 million deaths/year from fossil fuel air pollution',
      resources: [
        'https://skepticalscience.com/',
        'https://www.climatecommunication.org/',
        'https://www.ucsusa.org/climate'
      ]
    });
  }

  async handleMessage(request, sender, sendResponse) {
    switch(request.action) {
      case 'show_money_trail':
        await this.showMoneyTrail(request.type, request.funders);
        break;

      case 'show_debunk':
        await this.showDebunk(request.type);
        break;

      case 'report_content':
        await this.reportContent(request.data);
        break;

      case 'get_stats':
        sendResponse({
          reported: this.reportedContent.length,
          trails: this.moneyTrails.size,
          debunks: this.debunkDatabase.size
        });
        break;
    }

    return true; // Keep message channel open for async response
  }

  async showMoneyTrail(type, funders) {
    // Create new tab with money trail visualization
    const trails = funders.map(funder => {
      const trail = this.moneyTrails.get(funder);
      return trail ? {name: funder, ...trail} : {name: funder, data: 'Researching...'};
    });

    // Store data for popup to retrieve
    await chrome.storage.local.set({
      currentMoneyTrails: trails,
      currentType: type
    });

    // Open money trail popup
    chrome.windows.create({
      url: 'moneytrail.html',
      type: 'popup',
      width: 900,
      height: 700
    });
  }

  async showDebunk(type) {
    const debunk = this.debunkDatabase.get(type);
    if (!debunk) return;

    // Store for popup
    await chrome.storage.local.set({
      currentDebunk: debunk,
      currentType: type
    });

    // Open debunk popup
    chrome.windows.create({
      url: 'debunk.html',
      type: 'popup',
      width: 800,
      height: 600
    });
  }

  async reportContent(data) {
    // Add to local storage
    this.reportedContent.push(data);

    // In production, this would POST to Coalition API
    // For now, store locally
    const reports = await chrome.storage.local.get('reports') || [];
    reports.push(data);
    await chrome.storage.local.set({reports: reports});

    // If we have 10+ reports, batch send to server
    if (this.reportedContent.length >= 10) {
      await this.batchSendReports();
    }
  }

  async batchSendReports() {
    // In production: POST to https://api.thcoalition.net/truthstrike/reports
    console.log('Batch sending', this.reportedContent.length, 'reports');

    // Clear after sending
    this.reportedContent = [];
  }
}

// Initialize background service
const truthStrikeCommand = new TruthStrikeCommand();