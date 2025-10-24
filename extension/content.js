// TruthStrike Content Script - Real-time Disinformation Detection & Counter-Narrative
// Part of the Coalition's Counter-Propaganda Infrastructure

class TruthStrike {
  constructor() {
    this.knownDisinfoPatterns = new Map();
    this.moneyTrailCache = new Map();
    this.counterNarratives = new Map();
    this.init();
  }

  async init() {
    // Load disinformation patterns and counter-narratives
    await this.loadPatterns();

    // Start monitoring page content
    this.observeContent();

    // Listen for messages from background script
    chrome.runtime.onMessage.addListener(this.handleMessage.bind(this));
  }

  async loadPatterns() {
    // Core disinformation patterns to detect
    this.knownDisinfoPatterns.set('election_fraud', {
      patterns: [
        /stolen\s+election/gi,
        /dominion\s+voting/gi,
        /stop\s+the\s+steal/gi,
        /rigged\s+election/gi,
        /ballot\s+harvesting/gi,
        /dead\s+people\s+vot/gi
      ],
      severity: 'high',
      category: 'election_integrity',
      funders: ['Heritage Foundation', 'ALEC', 'True the Vote'],
      counterPoints: [
        'No evidence of widespread fraud found in 60+ court cases',
        'Election security confirmed by Trump\'s own DHS',
        'Paper ballot audits confirmed electronic tallies'
      ]
    });

    this.knownDisinfoPatterns.set('climate_denial', {
      patterns: [
        /climate\s+hoax/gi,
        /global\s+warming\s+scam/gi,
        /co2\s+is\s+plant\s+food/gi,
        /solar\s+panels.*toxic/gi,
        /wind\s+turbines.*kill.*birds/gi
      ],
      severity: 'high',
      category: 'climate',
      funders: ['Koch Industries', 'ExxonMobil', 'Heartland Institute', 'API'],
      counterPoints: [
        '99.9% of climate scientists confirm human-caused warming',
        'Fossil fuel companies knew since 1970s (their own research)',
        'Coal kills 100x more birds than wind turbines'
      ]
    });

    this.knownDisinfoPatterns.set('vaccine_misinfo', {
      patterns: [
        /vaccine.*population\s+control/gi,
        /mrna.*alter.*dna/gi,
        /vaccine.*5g/gi,
        /died\s+suddenly/gi,
        /pure\s+blood/gi
      ],
      severity: 'critical',
      category: 'public_health',
      funders: ['ICAN', 'CHD', 'NVIC', 'Mercola'],
      counterPoints: [
        'mRNA cannot alter DNA - basic biology',
        'Billions safely vaccinated worldwide',
        'Unvaccinated 10x more likely to die from COVID'
      ]
    });

    this.knownDisinfoPatterns.set('trans_panic', {
      patterns: [
        /groomer/gi,
        /trans.*agenda/gi,
        /biological\s+man/gi,
        /mutilat.*children/gi,
        /drag.*groom/gi
      ],
      severity: 'high',
      category: 'civil_rights',
      funders: ['Alliance Defending Freedom', 'Family Research Council', 'Heritage Foundation'],
      counterPoints: [
        'Gender-affirming care follows medical consensus',
        'Trans people are 4x more likely to be victims of violence',
        'Major medical associations support trans healthcare'
      ]
    });

    this.knownDisinfoPatterns.set('soros_conspiracy', {
      patterns: [
        /soros.*funded/gi,
        /soros.*paid/gi,
        /globalist.*soros/gi,
        /soros.*da/gi
      ],
      severity: 'medium',
      category: 'antisemitism',
      funders: ['Various dark money groups'],
      counterPoints: [
        'Classic antisemitic trope (rich Jew controlling world)',
        'Soros gives less politically than Koch, Adelson, or Thiel',
        'Attacking philanthropy that supports democracy'
      ]
    });

    this.knownDisinfoPatterns.set('crt_panic', {
      patterns: [
        /critical\s+race\s+theory.*schools/gi,
        /crt.*indoctrinat/gi,
        /teaching.*hate.*america/gi,
        /white\s+guilt.*schools/gi
      ],
      severity: 'medium',
      category: 'education',
      funders: ['Manhattan Institute', 'Heritage Foundation', 'Hillsdale College'],
      counterPoints: [
        'CRT is graduate-level legal theory, not K-12 curriculum',
        'Teaching accurate history is not "hate"',
        'Manufactured panic to censor Black history'
      ]
    });

    this.knownDisinfoPatterns.set('welfare_myths', {
      patterns: [
        /welfare\s+queen/gi,
        /food\s+stamp.*lobster/gi,
        /lazy.*unemployment/gi,
        /handouts.*don't\s+work/gi
      ],
      severity: 'medium',
      category: 'economic_justice',
      funders: ['Heritage Foundation', 'AEI', 'Cato Institute'],
      counterPoints: [
        'Corporate welfare exceeds social programs 3:1',
        'Most benefit recipients work full-time',
        'Food assistance has highest economic multiplier effect'
      ]
    });
  }

  observeContent() {
    // Monitor for new content (infinite scroll, dynamic loading)
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === 1) { // Element node
            this.scanElement(node);
          }
        });
      });
    });

    // Start observing
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    // Initial scan
    this.scanElement(document.body);
  }

  scanElement(element) {
    // Get text content
    const text = element.textContent || '';
    if (text.length < 20) return; // Skip short text

    // Check against all patterns
    for (const [key, disinfo] of this.knownDisinfoPatterns) {
      for (const pattern of disinfo.patterns) {
        if (pattern.test(text)) {
          this.flagContent(element, key, disinfo);
          break;
        }
      }
    }
  }

  flagContent(element, type, disinfo) {
    // Don't double-flag
    if (element.dataset.truthstrikeProcessed) return;
    element.dataset.truthstrikeProcessed = 'true';

    // Create warning wrapper
    const wrapper = document.createElement('div');
    wrapper.className = 'truthstrike-warning';
    wrapper.innerHTML = `
      <div class="truthstrike-header truthstrike-${disinfo.severity}">
        ⚠️ DISINFORMATION DETECTED: ${disinfo.category.replace('_', ' ').toUpperCase()}
      </div>
      <div class="truthstrike-content">
        <div class="truthstrike-funders">
          <strong>💰 Who profits from this lie:</strong>
          ${disinfo.funders.join(', ')}
        </div>
        <div class="truthstrike-facts">
          <strong>📌 Quick Facts:</strong>
          <ul>
            ${disinfo.counterPoints.map(point => `<li>${point}</li>`).join('')}
          </ul>
        </div>
        <div class="truthstrike-actions">
          <button class="truthstrike-btn" data-action="details">Full Debunk</button>
          <button class="truthstrike-btn" data-action="share">Share Facts</button>
          <button class="truthstrike-btn" data-action="report">Report Post</button>
          <button class="truthstrike-btn" data-action="follow-money">Follow the Money</button>
        </div>
      </div>
    `;

    // Add click handlers
    wrapper.querySelectorAll('.truthstrike-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.handleAction(e.target.dataset.action, type, element);
      });
    });

    // Insert warning before the flagged content
    element.style.opacity = '0.6';
    element.style.border = '2px solid red';
    element.parentNode.insertBefore(wrapper, element);
  }

  async handleAction(action, type, element) {
    switch(action) {
      case 'details':
        this.showDetailedDebunk(type);
        break;
      case 'share':
        this.shareCounterNarrative(type);
        break;
      case 'report':
        this.reportContent(element);
        break;
      case 'follow-money':
        this.showMoneyTrail(type);
        break;
    }
  }

  async showMoneyTrail(type) {
    // Send message to background script to open money trail visualization
    chrome.runtime.sendMessage({
      action: 'show_money_trail',
      type: type,
      funders: this.knownDisinfoPatterns.get(type).funders
    });
  }

  async showDetailedDebunk(type) {
    // Send message to background script to open detailed debunk
    chrome.runtime.sendMessage({
      action: 'show_debunk',
      type: type
    });
  }

  shareCounterNarrative(type) {
    const disinfo = this.knownDisinfoPatterns.get(type);
    const text = `FACT CHECK: ${disinfo.counterPoints[0]} Learn more: https://thcoalition.net/truthstrike`;

    // Copy to clipboard
    navigator.clipboard.writeText(text);

    // Show notification
    this.showNotification('Counter-narrative copied to clipboard!');
  }

  reportContent(element) {
    // Log to our database (would connect to Coalition API)
    const report = {
      url: window.location.href,
      content: element.textContent.substring(0, 500),
      timestamp: new Date().toISOString(),
      platform: this.detectPlatform()
    };

    chrome.runtime.sendMessage({
      action: 'report_content',
      data: report
    });

    this.showNotification('Content reported to Coalition database');
  }

  detectPlatform() {
    const hostname = window.location.hostname;
    if (hostname.includes('twitter.com') || hostname.includes('x.com')) return 'Twitter/X';
    if (hostname.includes('facebook.com')) return 'Facebook';
    if (hostname.includes('youtube.com')) return 'YouTube';
    if (hostname.includes('reddit.com')) return 'Reddit';
    if (hostname.includes('truthsocial.com')) return 'Truth Social';
    if (hostname.includes('gab.com')) return 'Gab';
    if (hostname.includes('gettr.com')) return 'Gettr';
    return hostname;
  }

  showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'truthstrike-notification';
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
      notification.remove();
    }, 3000);
  }

  handleMessage(request, sender, sendResponse) {
    if (request.action === 'scan_page') {
      this.scanElement(document.body);
      sendResponse({status: 'complete'});
    }
  }
}

// Initialize TruthStrike when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new TruthStrike());
} else {
  new TruthStrike();
}