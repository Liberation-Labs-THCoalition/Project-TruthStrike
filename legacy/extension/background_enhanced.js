// Enhanced TruthStrike Background Service Worker with Pattern Updates
// Includes local API integration for dynamic pattern updates

class TruthStrikeCommand {
  constructor() {
    this.API_URL = 'http://localhost:5000';  // Local pattern server
    this.UPDATE_INTERVAL = 60 * 60 * 1000;  // Check for updates hourly
    this.moneyTrails = new Map();
    this.debunkDatabase = new Map();
    this.reportedContent = [];
    this.patternVersion = null;
    this.init();
  }

  async init() {
    // Try to load patterns from API first, fallback to hardcoded
    const apiPatterns = await this.fetchPatternsFromAPI();
    if (apiPatterns) {
      await this.updatePatterns(apiPatterns);
    } else {
      await this.loadHardcodedPatterns();
    }

    // Set up periodic pattern updates
    setInterval(() => this.checkForPatternUpdates(), this.UPDATE_INTERVAL);

    // Listen for messages from content scripts
    chrome.runtime.onMessage.addListener(this.handleMessage.bind(this));

    // Set up context menu
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

    // Initialize stats if not present
    const stats = await chrome.storage.local.get(['totalLiesCaught', 'totalMoneyExposed', 'totalReports']);
    if (!stats.totalLiesCaught) {
      await chrome.storage.local.set({
        totalLiesCaught: 0,
        totalMoneyExposed: 0,
        totalReports: 0,
        recentCatches: []
      });
    }
  }

  async fetchPatternsFromAPI() {
    try {
      const response = await fetch(`${this.API_URL}/api/patterns`);
      if (!response.ok) throw new Error('API unavailable');

      const data = await response.json();
      return data;
    } catch (error) {
      console.log('TruthStrike: Using local patterns (API unavailable)');
      return null;
    }
  }

  async updatePatterns(data) {
    // Check if patterns have changed
    if (data.version === this.patternVersion) {
      return false;  // No update needed
    }

    // Store new patterns for content scripts
    await chrome.storage.local.set({
      patterns: data.patterns,
      patternVersion: data.version,
      lastUpdated: data.updated
    });

    // Update version
    this.patternVersion = data.version;

    // Notify all tabs to reload patterns
    const tabs = await chrome.tabs.query({});
    tabs.forEach(tab => {
      chrome.tabs.sendMessage(tab.id, {
        action: 'update_patterns',
        patterns: data.patterns
      }).catch(() => {});  // Ignore errors for non-compatible tabs
    });

    console.log('TruthStrike: Patterns updated to version', data.version);
    return true;
  }

  async checkForPatternUpdates() {
    const data = await this.fetchPatternsFromAPI();
    if (data) {
      const updated = await this.updatePatterns(data);
      if (updated) {
        // Show notification if patterns were updated
        chrome.notifications.create('pattern-update', {
          type: 'basic',
          iconUrl: 'icons/icon-48.png',
          title: 'TruthStrike Updated',
          message: 'New disinformation patterns loaded. Stay vigilant!'
        });
      }
    }
  }

  async loadHardcodedPatterns() {
    // Fallback patterns if API is unavailable
    const patterns = {
      'election_fraud': {
        patterns: [
          'stolen\\s+election',
          'dominion\\s+voting',
          'stop\\s+the\\s+steal'
        ],
        severity: 'high',
        category: 'election_integrity',
        funders: ['Heritage Foundation', 'ALEC', 'True the Vote'],
        counterPoints: [
          'No evidence found in 60+ court cases',
          'Confirmed secure by Trump\'s DHS',
          'Audits confirmed results'
        ]
      }
    };

    await chrome.storage.local.set({
      patterns: patterns,
      patternVersion: 'hardcoded',
      lastUpdated: new Date().toISOString()
    });
  }

  async handleMessage(request, sender, sendResponse) {
    switch(request.action) {
      case 'pattern_detected':
        await this.recordDetection(request.data);
        break;

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
        const stats = await this.getStats();
        sendResponse(stats);
        break;

      case 'check_updates':
        await this.checkForPatternUpdates();
        break;
    }

    return true;
  }

  async recordDetection(data) {
    // Update statistics
    const stats = await chrome.storage.local.get(['totalLiesCaught', 'recentCatches']);

    const newCount = (stats.totalLiesCaught || 0) + 1;
    const catches = stats.recentCatches || [];

    // Add to recent catches
    catches.unshift({
      type: data.type,
      site: data.platform,
      timestamp: Date.now()
    });

    // Keep only last 50 catches
    if (catches.length > 50) {
      catches.length = 50;
    }

    await chrome.storage.local.set({
      totalLiesCaught: newCount,
      recentCatches: catches
    });

    // Report to API if available
    this.sendToAPI('/api/report', {
      ...data,
      feedback: 'detected'
    });
  }

  async reportContent(data) {
    // Add to local storage
    this.reportedContent.push(data);

    // Update report count
    const stats = await chrome.storage.local.get(['totalReports']);
    await chrome.storage.local.set({
      totalReports: (stats.totalReports || 0) + 1
    });

    // Send to API
    await this.sendToAPI('/api/report', data);

    // Batch send if we have many reports
    if (this.reportedContent.length >= 10) {
      await this.batchSendReports();
    }
  }

  async sendToAPI(endpoint, data) {
    try {
      const response = await fetch(`${this.API_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) throw new Error('API error');
      return await response.json();
    } catch (error) {
      // Store for later if API is down
      const pending = await chrome.storage.local.get('pendingReports') || [];
      pending.push({endpoint, data, timestamp: Date.now()});
      await chrome.storage.local.set({pendingReports: pending});
    }
  }

  async batchSendReports() {
    // Try to send any pending reports
    const pending = await chrome.storage.local.get('pendingReports');
    if (pending && pending.pendingReports) {
      for (const report of pending.pendingReports) {
        await this.sendToAPI(report.endpoint, report.data);
      }
      // Clear pending reports
      await chrome.storage.local.set({pendingReports: []});
    }

    this.reportedContent = [];
  }

  async getStats() {
    const stats = await chrome.storage.local.get([
      'totalLiesCaught',
      'totalMoneyExposed',
      'totalReports',
      'patternVersion',
      'lastUpdated'
    ]);

    // Try to get live stats from API
    try {
      const response = await fetch(`${this.API_URL}/api/stats`);
      if (response.ok) {
        const apiStats = await response.json();
        return {
          ...stats,
          ...apiStats,
          apiConnected: true
        };
      }
    } catch (error) {
      // API unavailable
    }

    return {
      ...stats,
      apiConnected: false
    };
  }

  async showMoneyTrail(type, funders) {
    // Try to get fresh data from API
    try {
      const response = await fetch(`${this.API_URL}/api/money_trails`);
      if (response.ok) {
        const trails = await response.json();
        // Update local cache
        trails.forEach(trail => {
          this.moneyTrails.set(trail.organization, trail);
        });
      }
    } catch (error) {
      // Use cached data
    }

    const trails = funders.map(funder => {
      const trail = this.moneyTrails.get(funder);
      return trail ? {name: funder, ...trail} : {name: funder, data: 'Researching...'};
    });

    await chrome.storage.local.set({
      currentMoneyTrails: trails,
      currentType: type
    });

    chrome.windows.create({
      url: 'moneytrail.html',
      type: 'popup',
      width: 900,
      height: 700
    });
  }
}

// Initialize enhanced background service
const truthStrikeCommand = new TruthStrikeCommand();

// Listen for extension install/update
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    // Open welcome page on first install
    chrome.tabs.create({
      url: 'welcome.html'
    });
  } else if (details.reason === 'update') {
    // Check for pattern updates on extension update
    truthStrikeCommand.checkForPatternUpdates();
  }
});