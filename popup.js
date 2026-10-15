const $ = id => document.getElementById(id);
let detected = [];

chrome.storage.local.get(['detectedDrivers','detectedUrl'], data => {
  detected = Array.isArray(data.detectedDrivers) ? data.detectedDrivers : [];
  if (detected.length) {
    $('notice').textContent = `Detected ${detected.length} possible drivers from ${data.detectedUrl || 'the LFM page'}. Check the data before use.`;
  }
});

function parseCsv(text) {
  return text.split(/\r?\n/).map(line => line.trim()).filter(Boolean).map(line => {
    const parts = line.split(',');
    const elo = Number((parts.pop() || '').trim());
    const driver = parts.join(',').trim();
    return { driver, elo };
  }).filter(x => x.driver && Number.isFinite(x.elo) && x.elo >= 500 && x.elo <= 5000);
}
function logistic(a,b) { return 1 / (1 + Math.pow(10, (b-a)/400)); }

function calculate() {
  const myElo = Number($('myElo').value);
  const k = Number($('kFactor').value);
  const entered = parseCsv($('csv').value);
  if (!Number.isFinite(myElo) || myElo < 500 || myElo > 5000 || k <= 0 || k > 100) {
    $('notice').textContent = 'Enter a valid ELO (500–5000) and K estimate (1–100).'; return;
  }
  // Exclude duplicate self rows, then insert the user as a distinct entrant.
  const field = entered.filter(x => x.driver.toLowerCase() !== 'you');
  field.push({ driver: 'You', elo: myElo, isUser: true });
  if (field.length < 2) { $('notice').textContent = 'Add at least one other driver and an ELO rating.'; return; }

  // Expected rank based on pairwise Elo probabilities.
  field.forEach((d,i) => {
    d.expectedRank = 1 + field.reduce((sum, other,j) => sum + (i === j ? 0 : logistic(other.elo, d.elo)), 0);
  });
  const user = field.find(x => x.isUser);
  const n = field.length;
  // A transparent zero-sum Elo-inspired proxy. The official LFM formula is not known.
  // Scale by K and normalize so the field's total estimated change is zero.
  const raw = Array.from({length:n}, (_,idx) => {
    const finish = idx + 1;
    return { finish, score: (user.expectedRank - finish) / Math.max(1, n-1) * k };
  });
  const avg = raw.reduce((s,x) => s + x.score,0) / raw.length;
  raw.forEach(x => x.change = Math.round(x.score - avg));
  const bestGain = raw.find(x => x.change > 0);
  $('target').textContent = bestGain ? `P${bestGain.finish} or better` : 'No positive target';
  $('summary').textContent = `Your modelled expected finish: P${user.expectedRank.toFixed(1)} · ${n} drivers · estimated K ${k}`;
  $('results').innerHTML = '';
  raw.forEach(x => {
    const row = document.createElement('div');
    row.className = 'result-row' + (bestGain && x.finish === bestGain.finish ? ' best' : '');
    const cls = x.change > 0 ? 'positive' : x.change < 0 ? 'negative' : 'neutral';
    row.innerHTML = `<span class="pos">P${x.finish}</span><span>${x.finish < user.expectedRank ? 'Better than expected' : x.finish > user.expectedRank ? 'Worse than expected' : 'Near expectation'}</span><span class="gain ${cls}">${x.change > 0 ? '+' : ''}${x.change}</span>`;
    $('results').appendChild(row);
  });
  $('notice').textContent = `Calculated from ${entered.length} imported rows plus you. Output is a model proxy, not official LFM Elo.`;
}

$('useDetected').addEventListener('click', () => {
  if (!detected.length) {
    $('notice').textContent = 'No detected rows available. Paste CSV manually or open an LFM entry-list page first.';
    return;
  }
  $('csv').value = detected.map(d => `${String(d.driver).replace(/,/g,' ')},${d.elo}`).join('\n');
  $('notice').textContent = `Loaded ${detected.length} detected rows. Verify driver names and ratings before calculating.`;
});
$('calculate').addEventListener('click', calculate);
