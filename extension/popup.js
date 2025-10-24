// TruthStrike Popup Controller

document.addEventListener('DOMContentLoaded', async () => {
  // Load stats
  await loadStats();
  await loadRecentCatches();

  // Load settings
  const settings = await chrome.storage.local.get(['autoScan']);
  document.getElementById('auto-scan').checked = settings.autoScan !== false;

  // Event listeners
  document.getElementById('scan-page').addEventListener('click', scanCurrentPage);
  document.getElementById('view-money-trails').addEventListener('click', openMoneyTrails);
  document.getElementById('report-dashboard').addEventListener('click', openDashboard);
  document.getElementById('auto-scan').addEventListener('change', saveSettings);
});

async function loadStats() {
  const stats = await chrome.storage.local.get(['totalLiesCaught', 'totalMoneyExposed', 'totalReports']);

  document.getElementById('lies-caught').textContent = stats.totalLiesCaught || 0;

  // Format money amount
  const money = stats.totalMoneyExposed || 0;
  if (money > 1000000000) {
    document.getElementById('money-exposed').textContent = `$${(money / 1000000000).toFixed(1)}B`;
  } else if (money > 1000000) {
    document.getElementById('money-exposed').textContent = `$${(money / 1000000).toFixed(1)}M`;
  } else {
    document.getElementById('money-exposed').textContent = `$${money}`;
  }

  document.getElementById('reports-sent').textContent = stats.totalReports || 0;
}

async function loadRecentCatches() {
  const data = await chrome.storage.local.get(['recentCatches']);
  const catches = data.recentCatches || [];

  if (catches.length === 0) {
    return;
  }

  const container = document.getElementById('recent-catches');
  container.innerHTML = '';

  catches.slice(0, 5).forEach(catch_ => {
    const item = document.createElement('div');
    item.className = 'catch-item';
    item.innerHTML = `
      <div class="catch-type">${catch_.type}</div>
      <div class="catch-site">${catch_.site} - ${timeAgo(catch_.timestamp)}</div>
    `;
    container.appendChild(item);
  });
}

function timeAgo(timestamp) {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

async function scanCurrentPage() {
  // Get active tab
  const [tab] = await chrome.tabs.query({active: true, currentWindow: true});

  // Send scan command
  chrome.tabs.sendMessage(tab.id, {action: 'scan_page'}, (response) => {
    // Update UI to show scan complete
    const btn = document.getElementById('scan-page');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<span>✅</span> Scan Complete!';
    btn.style.background = 'linear-gradient(135deg, #11998e, #38ef7d)';

    setTimeout(() => {
      btn.innerHTML = originalText;
      btn.style.background = '';
    }, 2000);

    // Reload stats
    loadStats();
    loadRecentCatches();
  });
}

async function openMoneyTrails() {
  // Create comprehensive money trail database page
  const moneyTrailHTML = `
<!DOCTYPE html>
<html>
<head>
  <title>Money Trail Database - TruthStrike</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      margin: 0;
      padding: 40px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
      background: white;
      border-radius: 16px;
      padding: 40px;
      box-shadow: 0 20px 40px rgba(0,0,0,0.1);
    }

    h1 {
      color: #764ba2;
      font-size: 32px;
      margin-bottom: 10px;
    }

    .subtitle {
      color: #666;
      margin-bottom: 30px;
    }

    .org-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
      gap: 20px;
      margin-top: 30px;
    }

    .org-card {
      border: 2px solid #e0e0e0;
      border-radius: 12px;
      padding: 20px;
      transition: all 0.3s ease;
    }

    .org-card:hover {
      border-color: #764ba2;
      box-shadow: 0 8px 16px rgba(118, 75, 162, 0.1);
    }

    .org-name {
      font-size: 20px;
      font-weight: bold;
      color: #333;
      margin-bottom: 10px;
    }

    .org-budget {
      font-size: 24px;
      color: #ff6348;
      font-weight: bold;
      margin: 10px 0;
    }

    .org-stat {
      margin: 8px 0;
      padding: 8px;
      background: #f8f9fa;
      border-radius: 6px;
      font-size: 14px;
    }

    .stat-label {
      font-weight: 600;
      color: #764ba2;
    }

    .donor-list {
      margin-top: 10px;
      padding-left: 20px;
    }

    .donor-list li {
      margin: 5px 0;
      color: #666;
      font-size: 13px;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>💰 Follow the Money</h1>
    <p class="subtitle">Who funds the disinformation machine?</p>

    <div class="org-grid">
      <div class="org-card">
        <div class="org-name">Heritage Foundation</div>
        <div class="org-budget">$86 Million/Year</div>
        <div class="org-stat"><span class="stat-label">Dark Money:</span> 40% untraceable</div>
        <div class="org-stat"><span class="stat-label">Top Output:</span> Project 2025</div>
        <ul class="donor-list">
          <li>Bradley Foundation: $15M+</li>
          <li>Koch Network: $8M+</li>
          <li>DeVos Family: $5M+</li>
        </ul>
      </div>

      <div class="org-card">
        <div class="org-name">Koch Industries</div>
        <div class="org-budget">$400+ Million/Year</div>
        <div class="org-stat"><span class="stat-label">Net Worth:</span> $64 Billion</div>
        <div class="org-stat"><span class="stat-label">CO2:</span> 24M tons/year</div>
        <div class="org-stat"><span class="stat-label">Body Count:</span> ~200,000 deaths</div>
      </div>

      <div class="org-card">
        <div class="org-name">ALEC</div>
        <div class="org-budget">$10 Million/Year</div>
        <div class="org-stat"><span class="stat-label">Model Bills:</span> 1000+ copy-paste laws</div>
        <div class="org-stat"><span class="stat-label">Success Rate:</span> 20% of state laws</div>
      </div>
    </div>
  </div>
</body>
</html>`;

  // Create data URL and open in new tab
  const blob = new Blob([moneyTrailHTML], {type: 'text/html'});
  const url = URL.createObjectURL(blob);
  chrome.tabs.create({url: url});
}

async function openDashboard() {
  // For now, open the Coalition website
  // In production, this would open a full dashboard
  chrome.tabs.create({url: 'https://thcoalition.net/truthstrike'});
}

async function saveSettings() {
  const autoScan = document.getElementById('auto-scan').checked;
  await chrome.storage.local.set({autoScan: autoScan});
}