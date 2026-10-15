(() => {
  const isLfm = /(^|\.)lowfuelmotorsport\.com$/i.test(location.hostname);
  if (!isLfm || window.__lfmEloPredictorLoaded) return;
  window.__lfmEloPredictorLoaded = true;

  // Conservative extraction: only visible table rows with a plausible driver name
  // and a plausible Elo-like integer. Does not query private/undocumented endpoints.
  function extractRows() {
    const rows = [];
    const seen = new Set();
    for (const tr of document.querySelectorAll('tr')) {
      const cells = [...tr.querySelectorAll('th,td')]
        .map(el => (el.innerText || '').trim().replace(/\s+/g, ' '))
        .filter(Boolean);
      if (cells.length < 2) continue;
      const ratingCell = cells.find(c => /^\d{3,4}$/.test(c) && Number(c) >= 500 && Number(c) <= 5000);
      if (!ratingCell) continue;
      const name = cells.find(c =>
        c.length >= 2 && c.length <= 40 &&
        !/^\d+$/.test(c) &&
        !/^(elo|rating|driver|name|position|pos|sr|safety rating|elo rating)$/i.test(c) &&
        !/^\d{1,2}:\d{2}/.test(c)
      );
      if (!name) continue;
      const key = name.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      rows.push({ driver: name, elo: Number(ratingCell) });
    }
    return rows.slice(0, 100);
  }

  function addStatus() {
    if (document.getElementById('lfm-elo-detected')) return;
    const rows = extractRows();
    const badge = document.createElement('div');
    badge.id = 'lfm-elo-detected';
    badge.textContent = rows.length
      ? `ELO Predictor: detected ${rows.length} possible driver ratings — open the extension to review`
      : 'ELO Predictor: no reliable entry list detected — open the extension for manual import';
    Object.assign(badge.style, {
      position: 'fixed', right: '14px', bottom: '14px', zIndex: '2147483647',
      maxWidth: '360px', padding: '10px 14px', borderRadius: '8px',
      background: '#0b1624', color: '#eaf2ff', border: '1px solid #2c8d65',
      boxShadow: '0 4px 24px #0008', font: '13px/1.4 system-ui, sans-serif'
    });
    badge.title = 'Prototype: detected values must be reviewed; estimates are not official LFM Elo.';
    document.documentElement.appendChild(badge);
    chrome.storage.local.set({ detectedDrivers: rows, detectedAt: Date.now(), detectedUrl: location.href });
  }

  addStatus();
  // LFM pages may populate tables dynamically.
  const observer = new MutationObserver(() => {
    if (!document.getElementById('lfm-elo-detected')) addStatus();
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });
})();