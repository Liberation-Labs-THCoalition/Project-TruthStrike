// TruthStrike Money Trail Page Controller

document.addEventListener('DOMContentLoaded', async () => {
  // Load money trail data from storage
  const data = await chrome.storage.local.get(['currentMoneyTrails', 'currentType']);

  const container = document.getElementById('organizations');

  if (!data.currentMoneyTrails || data.currentMoneyTrails.length === 0) {
    container.innerHTML = '<p style="text-align: center; color: #999;">No money trail data available.</p>';
    return;
  }

  // Display each funder organization
  data.currentMoneyTrails.forEach(trail => {
    if (!trail.budget) {
      // No detailed data available
      const div = document.createElement('div');
      div.className = 'organization';
      div.innerHTML = `
        <div class="org-name">${trail.name}</div>
        <div class="detail">
          <div class="label">Status</div>
          <div class="value">Researching funding details...</div>
        </div>
      `;
      container.appendChild(div);
      return;
    }

    const div = document.createElement('div');
    div.className = 'organization';

    let html = `<div class="org-name">${trail.name}</div>`;

    // Budget
    if (trail.budget) {
      html += `
        <div class="detail">
          <div class="label">Annual Budget</div>
          <div class="value">${trail.budget}</div>
        </div>
      `;
    }

    // Top donors
    if (trail.topDonors && trail.topDonors.length > 0) {
      html += `
        <div class="detail">
          <div class="label">Top Donors</div>
          <div class="donors">
            ${trail.topDonors.map(donor => `<div class="donor-item">• ${donor}</div>`).join('')}
          </div>
        </div>
      `;
    }

    // Dark money
    if (trail.darkMoney) {
      html += `
        <div class="detail">
          <div class="label">Dark Money</div>
          <div class="value">${trail.darkMoney}</div>
        </div>
      `;
    }

    // Outputs
    if (trail.outputs && trail.outputs.length > 0) {
      html += `
        <div class="detail">
          <div class="label">Key Outputs</div>
          <div class="value">${trail.outputs.join(', ')}</div>
        </div>
      `;
    }

    // Classification (for hate groups)
    if (trail.designation) {
      html += `
        <div class="detail">
          <div class="label">Classification</div>
          <div class="value" style="color: #ff6666; font-weight: bold;">${trail.designation}</div>
        </div>
      `;
    }

    // Environmental damage
    if (trail.environmental) {
      html += `
        <div class="detail">
          <div class="label">Environmental Damage</div>
          <div class="value">${trail.environmental}</div>
        </div>
      `;
    }

    // Body count
    if (trail.bodyCount) {
      html += `
        <div class="detail">
          <div class="label">Human Cost</div>
          <div class="value" style="color: #ff6666; font-weight: bold;">${trail.bodyCount}</div>
        </div>
      `;
    }

    div.innerHTML = html;
    container.appendChild(div);
  });
});
