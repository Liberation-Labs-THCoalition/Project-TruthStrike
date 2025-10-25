// TruthStrike Debunk Page Controller

document.addEventListener('DOMContentLoaded', async () => {
  // Load debunk data from storage
  const data = await chrome.storage.local.get(['currentDebunk', 'currentType']);

  if (!data.currentDebunk) {
    document.getElementById('loading').innerHTML = '<p>No debunk data available. Please try again.</p>';
    return;
  }

  const debunk = data.currentDebunk;
  const type = data.currentType;

  // Hide loading, show content
  document.getElementById('loading').style.display = 'none';
  document.getElementById('content').style.display = 'block';

  // Set title and category
  document.getElementById('title').textContent = debunk.title;
  document.getElementById('category').textContent = type.replace('_', ' ').toUpperCase();

  // Populate facts (claim vs truth)
  const factsContainer = document.getElementById('facts');
  debunk.facts.forEach(fact => {
    const div = document.createElement('div');
    div.className = 'claim-truth';
    div.innerHTML = `
      <div class="claim">❌ CLAIM: ${fact.claim}</div>
      <div class="truth">✅ TRUTH: ${fact.truth}</div>
      <div class="source">Source: ${fact.source}</div>
    `;
    factsContainer.appendChild(div);
  });

  // Money trail (if available)
  if (debunk.moneyTrail) {
    document.getElementById('money-trail').textContent = debunk.moneyTrail;
  } else {
    document.getElementById('money-section').style.display = 'none';
  }

  // Real problem (if available)
  if (debunk.realProblem) {
    document.getElementById('real-problem').textContent = debunk.realProblem;
  } else if (debunk.whoWon) {
    document.getElementById('real-problem').textContent = debunk.whoWon;
  } else {
    document.getElementById('problem-section').style.display = 'none';
  }

  // Real cost (if available)
  if (debunk.realCost && debunk.realProblem) {
    document.getElementById('real-problem').textContent += ' ' + debunk.realCost;
  }

  // Resources
  if (debunk.resources && debunk.resources.length > 0) {
    const resourcesList = document.getElementById('resources');
    debunk.resources.forEach(url => {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = url;
      a.target = '_blank';
      a.textContent = url.replace('https://', '').replace('http://', '').split('/')[0];
      li.appendChild(a);
      resourcesList.appendChild(li);
    });
  } else {
    document.getElementById('resources-section').style.display = 'none';
  }
});
