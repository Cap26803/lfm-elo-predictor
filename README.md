# LFM ACC ELO Predictor — prototype

Browser-agnostic WebExtension starter for Chromium browsers (Chrome, Edge, Brave, Opera) and adaptable to Firefox.

## Important accuracy note
LFM's public FAQ says its Elo system computes an expected ranking from each driver's rating relative to the field, redistributes points between participants, and uses a series/race-length-dependent K-factor. The complete numerical formula and all parameters are not documented in the FAQ. Therefore this prototype **does not pretend to reproduce official LFM Elo**. It implements a transparent Elo-inspired expected-rank model for exploration and clearly labels the output as an estimate. It also supports manual CSV/entry editing when page extraction fails.

## Install (Chrome / Edge / Brave)
1. Extract the ZIP to a folder.
2. Open the browser's extensions page (`chrome://extensions`, `edge://extensions`, or equivalent).
3. Enable Developer mode.
4. Choose **Load unpacked** and select this folder.
5. Open an LFM session/entry-list page, then open the extension popup.

## Current prototype behavior
- Tries to detect driver names and plausible Elo numbers from visible page text / tables.
- Lets you set your own Elo if it cannot be inferred.
- Lets you paste a CSV with `driver,elo` rows.
- Estimates expected rank using pairwise logistic probabilities.
- Produces a finish-position curve and highlights the first estimated position with positive Elo change.
- Stores settings locally in extension storage.

## Known limitations / next steps
- LFM page structure can change; the DOM extractor is intentionally conservative and should be validated against actual pages.
- It does not call undocumented LFM endpoints, bypass authentication, or scrape hidden data.
- Current Elo change is a **relative expected-score proxy**, not the official LFM formula. To calibrate accurately, collect entry-list snapshots and post-race official Elo changes, identify race length/series K-factors, and fit/validate model parameters against held-out races.
- If the site exposes an official documented API or grants permission for an integration, use that rather than reverse-engineering private endpoints.
- Firefox may require a small manifest/packaging adjustment depending on version; the core code uses standard WebExtension APIs.

## Model outline
For each driver i, expected rank is approximately:
`1 + sum_j P(driver j beats driver i)`, with pairwise probability
`P(i beats j) = 1 / (1 + 10 ** ((Rj - Ri) / 400))`.
For each candidate finish position, the score proxy compares actual position with expected position. A zero-sum normalization is applied across the simulated field. This is useful for target visualization but is **not confirmed to match LFM's production formula**.
