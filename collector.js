/**
 * 三角洲行动 · 后台价格采集器
 * 每 2 分钟从 API 抓取数据，存到 data/price_history.json
 * 启动: node collector.js
 * 停止: Ctrl+C
 */

const fs = require('fs');
const path = require('path');

const API_BASE = 'https://df-api.shallow.ink';
const API_KEY = process.env.DF_API_KEY || '';
const INTERVAL_MIN = process.env.DF_INTERVAL || 2;
const DATA_FILE = path.join(__dirname, 'data', 'price_history.json');

// ---------- load / save ----------
function loadHistory() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    }
  } catch (e) { console.warn('[collector] load error:', e.message); }
  return {};
}

function saveHistory(data) {
  try {
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (e) { console.warn('[collector] save error:', e.message); }
}

// ---------- fetch ----------
async function fetchPrices() {
  const headers = {
    'Accept': 'application/json',
    'Authorization': `Bearer ${API_KEY}`
  };

  const url = `${API_BASE}/df/object/price/latest/v3?type=ammo&limit=200`;
  const resp = await fetch(url, { cache: 'no-cache', headers });

  if (!resp.ok) {
    throw new Error(`API HTTP ${resp.status}`);
  }

  const raw = await resp.json();
  const source = (raw.data || raw).items || (raw.data || raw).data || [];
  const items = [];

  for (const it of source) {
    items.push({
      name: it.objectName || it.itemName || '',
      price: Math.round(it.latestPrice || 0),
      t: new Date().toISOString()
    });
  }

  return items;
}

// ---------- main loop ----------
async function collect() {
  const history = loadHistory();
  const now = new Date();
  const ts = now.toISOString();
  const timeStr = now.toLocaleTimeString('zh-CN', { hour12: false });

  try {
    const items = await fetchPrices();

    for (const item of items) {
      if (!history[item.name]) history[item.name] = [];
      history[item.name].push({ t: item.t, p: item.price });
      // Keep last 720 points (~24h at 2min intervals)
      if (history[item.name].length > 720) {
        history[item.name] = history[item.name].slice(-720);
      }
    }

    saveHistory(history);

    // Stats
    let totalPoints = 0;
    for (const pts of Object.values(history)) totalPoints += pts.length;
    console.log(`[${timeStr}] ✅ ${items.length} items · ${totalPoints} total data points`);
  } catch (e) {
    console.error(`[${timeStr}] ❌ ${e.message}`);
  }
}

// ---------- start ----------
console.log('=== 三角洲行动 · 后台价格采集器 ===');
console.log(`API: ${API_BASE}`);
console.log(`间隔: ${INTERVAL_MIN} 分钟`);
console.log(`数据文件: ${DATA_FILE}`);
console.log(`API Key: ${API_KEY ? API_KEY.slice(0, 12) + '...' : '未设置!'}`);
console.log('按 Ctrl+C 停止\n');

if (!API_KEY) {
  console.error('❌ 请设置环境变量 DF_API_KEY=sk-xxx');
  console.error('   命令行: set DF_API_KEY=sk-xxx && node collector.js');
  process.exit(1);
}

// First run immediately
collect();

// Then on interval
setInterval(collect, INTERVAL_MIN * 60 * 1000);
