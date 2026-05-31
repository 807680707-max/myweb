/**
 * CI 版采集器 — 每次执行抓一次数据，追加到 data/price_history.json
 * GitHub Actions 每 5 分钟调用一次
 */
const fs = require('fs');
const path = require('path');

const API_BASE = 'https://df-api.shallow.ink';
const API_KEY = process.env.DF_API_KEY || '';
const DATA_FILE = path.join(__dirname, 'data', 'price_history.json');

async function main() {
  if (!API_KEY) {
    console.error('❌ DF_API_KEY not set');
    process.exit(1);
  }

  // Load existing history
  let history = {};
  try {
    if (fs.existsSync(DATA_FILE)) {
      history = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    }
  } catch (e) {
    console.warn('Loading existing history failed, starting fresh:', e.message);
  }

  // Fetch API
  const url = `${API_BASE}/df/object/price/latest/v3?type=ammo&limit=200`;
  const resp = await fetch(url, {
    cache: 'no-cache',
    headers: {
      'Accept': 'application/json',
      'Authorization': `Bearer ${API_KEY}`
    }
  });

  if (!resp.ok) {
    console.error(`API HTTP ${resp.status}`);
    process.exit(1);
  }

  const raw = await resp.json();
  const source = (raw.data || raw).items || (raw.data || raw).data || [];
  const now = new Date();
  const ts = now.toISOString();
  const DAY_MS = 86400000;

  let added = 0;
  for (const it of source) {
    const name = it.objectName || it.itemName || '';
    const price = Math.round(it.latestPrice || 0);
    if (!name || !price) continue;

    if (!history[name]) history[name] = [];
    // Avoid duplicate timestamps
    const exists = history[name].some(p => p.t === ts);
    if (exists) continue;

    history[name].push({ t: ts, p: price });
    added++;

    // Prune old entries (> 7 days)
    history[name] = history[name].filter(p => {
      return (now.getTime() - new Date(p.t).getTime()) < 7 * DAY_MS;
    });
  }

  // Save
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(history, null, 2), 'utf8');

  // Stats
  let totalPoints = 0;
  for (const pts of Object.values(history)) totalPoints += pts.length;

  console.log(`[${ts}] ✅ ${source.length} items · ${added} new points · ${totalPoints} total`);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
