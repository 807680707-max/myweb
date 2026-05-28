# Delta Force Trading Tool — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a zero-backend web dashboard for Delta Force item trading with 5 tabs: Market Dashboard, Buy/Sell Advice, P&L Tracking, Event Calendar, AI Analysis.

**Architecture:** Modular vanilla JS files loaded via `<script>` tags — no build step, no framework. ECharts for price charts, SVG for sparklines, localStorage for persistence. Single `index.html` with 5 tab panels, all data fetched from delta-force-api / DeltaForcePrice public API.

**Tech Stack:** HTML5, CSS3, Vanilla JS (ES6+), ECharts 5.x (CDN), SVG (inline), localStorage API

**Note on file structure:** Although the spec says "single file", we use separate CSS/JS files loaded via `<link>`/`<script>` tags for maintainability. No build step — just open `index.html` in a browser. Deployment to Cloudflare Pages serves all files as-is.

---

### Task 1: Project Scaffold & CSS Theme

**Files:**
- Create: `index.html`
- Create: `css/style.css`
- Create: `data/items.json`

- [ ] **Step 1: Create `data/items.json` — item tier/type mapping**

This is the fallback mapping when the API doesn't return tier/type info. It maps item names to tier (1-6) and category.

```json
{
  "items": {
    "9x19mm PSO": { "tier": 3, "category": "ammo" },
    "9x19mm PST": { "tier": 2, "category": "ammo" },
    "9x19mm RIP": { "tier": 1, "category": "ammo" },
    "5.56x45mm M855": { "tier": 3, "category": "ammo" },
    "5.56x45mm M855A1": { "tier": 4, "category": "ammo" },
    "5.56x45mm M995": { "tier": 6, "category": "ammo" },
    "7.62x39mm BP": { "tier": 5, "category": "ammo" },
    "7.62x39mm PS": { "tier": 3, "category": "ammo" },
    "7.62x51mm M80": { "tier": 3, "category": "ammo" },
    "7.62x51mm M61": { "tier": 5, "category": "ammo" },
    "7.62x51mm M62": { "tier": 3, "category": "ammo" },
    "7.62x54mmR SNB": { "tier": 6, "category": "ammo" },
    "7.62x54mmR LPS": { "tier": 3, "category": "ammo" },
    ".45 ACP AP": { "tier": 4, "category": "ammo" },
    "12x70mm RIP": { "tier": 1, "category": "ammo" },
    "4.6x30mm AP SX": { "tier": 5, "category": "ammo" },
    "5.7x28mm SS190": { "tier": 4, "category": "ammo" }
  },
  "tierColors": {
    "1": "#c0c0c0",
    "2": "#4ade80",
    "3": "#3b82f6",
    "4": "#a855f7",
    "5": "#f4a261",
    "6": "#ff4d5a"
  },
  "tierNames": {
    "1": "白",
    "2": "绿",
    "3": "蓝",
    "4": "紫",
    "5": "金",
    "6": "红"
  },
  "categories": ["ammo", "keycard", "attachment", "equipment", "other"]
}
```

- [ ] **Step 2: Create `css/style.css` — full dark theme**

```css
/* === CSS Variables === */
:root {
  --bg: #0a0b0e;
  --surface: #14151a;
  --surface-alt: #111216;
  --border: #2a2a2e;
  --border-light: #3a3a3e;
  --text: #bbb;
  --text-dim: #777;
  --text-bright: #f0f0f0;
  --text-white: #ffffff;
  --red: #e63946;
  --red-bright: #ff4d5a;
  --green: #4ade80;
  --gold: #f4a261;
  --purple: #a855f7;
  --blue: #3b82f6;
  --white: #c0c0c0;
  --font-ui: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --font-mono: 'JetBrains Mono', 'Consolas', monospace;
  --radius: 8px;
  --radius-sm: 4px;
}

/* === Reset === */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

html { font-size: 14px; scroll-behavior: smooth; }

body {
  font-family: var(--font-ui);
  background: var(--bg);
  color: var(--text);
  min-height: 100vh;
  line-height: 1.5;
}

/* === Tab Navigation === */
.tab-nav {
  display: flex;
  gap: 0;
  border-bottom: 2px solid var(--border);
  background: var(--surface);
  position: sticky;
  top: 0;
  z-index: 100;
  padding: 0 20px;
}
.tab-btn {
  padding: 14px 24px;
  background: none;
  border: none;
  color: var(--text-dim);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  font-family: var(--font-ui);
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
  transition: color 0.2s, border-color 0.2s;
}
.tab-btn:hover { color: var(--text-bright); }
.tab-btn.active {
  color: var(--text-bright);
  border-bottom-color: var(--red);
}

/* === Tab Content === */
.tab-content { display: none; padding: 20px; max-width: 1400px; margin: 0 auto; }
.tab-content.active { display: block; }

/* === Cards === */
.stats-row { display: flex; gap: 12px; margin-bottom: 16px; flex-wrap: wrap; }
.stat-card {
  flex: 1; min-width: 140px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 14px;
  text-align: center;
}
.stat-card .label { font-size: 11px; color: var(--text-dim); text-transform: uppercase; letter-spacing: 0.5px; }
.stat-card .value { font-size: 26px; font-weight: 700; color: var(--text-white); margin-top: 2px; }
.stat-card .sub { font-size: 11px; color: var(--text-dim); margin-top: 2px; }

/* === Tables === */
.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}
.data-table thead th {
  padding: 12px 14px;
  color: #d0d0d0;
  font-weight: 600;
  text-align: left;
  background: #1a1b20;
  border-bottom: 2px solid var(--border);
  white-space: nowrap;
  cursor: pointer;
  user-select: none;
}
.data-table thead th:hover { color: var(--text-white); }
.data-table thead th.sort-asc::after { content: ' ▲'; font-size: 10px; }
.data-table thead th.sort-desc::after { content: ' ▼'; font-size: 10px; }
.data-table tbody td {
  padding: 12px 14px;
  border-bottom: 1px solid #1e1e22;
  color: var(--text);
}
.data-table tbody tr:nth-child(even) { background: var(--surface-alt); }
.data-table tbody tr:hover { background: #1a1b22; }
.data-table .num { text-align: right; font-family: var(--font-mono); font-variant-numeric: tabular-nums; }
.data-table .center { text-align: center; }

/* === Buttons === */
.btn {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 7px 16px; border-radius: var(--radius-sm);
  font-size: 13px; font-weight: 600; font-family: var(--font-ui);
  cursor: pointer; border: none; transition: opacity 0.2s;
}
.btn:hover { opacity: 0.85; }
.btn-primary { background: var(--red); color: #fff; }
.btn-outline { background: transparent; border: 1px solid var(--border); color: var(--text-dim); }
.btn-outline:hover { border-color: var(--text-dim); color: var(--text-bright); }
.btn-sm { padding: 4px 10px; font-size: 12px; }

/* === Inputs === */
.input, .select {
  padding: 7px 10px;
  background: #1a1b1f;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  color: var(--text-bright);
  font-size: 13px;
  font-family: var(--font-ui);
}
.input:focus, .select:focus { border-color: var(--red); outline: none; }
.input::placeholder { color: var(--text-dim); }
.select { cursor: pointer; }

/* === Badges === */
.badge {
  display: inline-block;
  padding: 1px 6px;
  border-radius: 3px;
  font-size: 10px;
  font-weight: 600;
}
.badge-buy { background: #1a3a1a; color: var(--green); }
.badge-sell { background: #3a1a1a; color: var(--red-bright); }
.badge-hold { background: #2a2a1a; color: var(--gold); }

/* === Tier dot === */
.tier-dot {
  display: inline-block;
  width: 8px; height: 8px;
  border-radius: 50%;
  margin-right: 4px;
  vertical-align: middle;
}

/* === Toolbar === */
.toolbar {
  display: flex; justify-content: space-between; align-items: center;
  gap: 10px; margin-bottom: 16px; flex-wrap: wrap;
}
.toolbar-left { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
.toolbar-right { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
.freshness {
  font-size: 11px;
  padding: 3px 10px;
  border-radius: 10px;
  white-space: nowrap;
}
.freshness.fresh { background: #1a3a1a; color: var(--green); }
.freshness.stale { background: #3a2a1a; color: var(--gold); }

/* === Positive/Negative === */
.positive { color: var(--green); }
.negative { color: var(--red-bright); }
.neutral { color: var(--gold); }

/* === Section header === */
.section-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 12px 16px;
  background: #1a1b20;
  border-bottom: 1px solid var(--border);
  font-size: 14px; font-weight: 600; color: var(--text-bright);
}
.section-header .sub { font-size: 11px; font-weight: 400; color: var(--text-dim); margin-left: 8px; }

/* === Panel === */
.panel {
  border: 1px solid var(--border);
  border-radius: var(--radius);
  overflow: hidden;
  margin-bottom: 12px;
}
.panel-body { padding: 16px; }

/* === Modal === */
.modal-overlay {
  display: none;
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.7);
  z-index: 200;
  align-items: center; justify-content: center;
}
.modal-overlay.show { display: flex; }
.modal-box {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 24px;
  min-width: 380px;
  max-width: 90vw;
}
.modal-box h3 { color: var(--text-bright); margin-bottom: 16px; font-size: 16px; }
.modal-box label { display: block; font-size: 12px; color: var(--text-dim); margin-bottom: 4px; margin-top: 10px; }
.modal-box .input, .modal-box .select { width: 100%; }
.modal-box .btn-row { display: flex; gap: 8px; justify-content: flex-end; margin-top: 16px; }

/* === Calendar === */
.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
}
.calendar-day-header {
  text-align: center; font-size: 11px; color: var(--text-dim);
  padding: 8px 4px; font-weight: 600;
}
.calendar-day {
  aspect-ratio: 1;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 4px 6px;
  cursor: pointer;
  font-size: 12px;
  color: var(--text);
  position: relative;
  min-height: 64px;
  transition: border-color 0.15s;
}
.calendar-day:hover { border-color: var(--text-dim); }
.calendar-day.other-month { opacity: 0.3; }
.calendar-day.today { border-color: var(--red); }
.calendar-day .day-num { font-weight: 600; font-size: 13px; }
.calendar-day .event-dot {
  display: inline-block;
  width: 6px; height: 6px;
  border-radius: 50%;
  margin: 1px 2px;
}
.calendar-day .event-dot.past { background: var(--blue); }
.calendar-day .event-dot.upcoming { background: var(--gold); }

/* === AI Chat === */
.chat-container {
  display: flex; flex-direction: column;
  height: 500px; max-height: calc(100vh - 250px);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  overflow: hidden;
}
.chat-messages {
  flex: 1; overflow-y: auto; padding: 16px;
  background: var(--bg);
  display: flex; flex-direction: column; gap: 10px;
}
.chat-msg {
  max-width: 80%; padding: 10px 14px;
  border-radius: var(--radius);
  font-size: 13px; line-height: 1.6;
}
.chat-msg.user {
  align-self: flex-end;
  background: var(--red);
  color: #fff;
}
.chat-msg.assistant {
  align-self: flex-start;
  background: var(--surface);
  border: 1px solid var(--border);
  color: var(--text);
}
.chat-input-row {
  display: flex; gap: 8px; padding: 12px;
  background: var(--surface);
  border-top: 1px solid var(--border);
}
.chat-input-row .input { flex: 1; }

/* === Config bar === */
.config-bar {
  display: flex; gap: 12px; align-items: center;
  padding: 10px 14px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  margin-bottom: 14px;
  font-size: 12px;
  flex-wrap: wrap;
}
.config-bar .config-group {
  display: flex; align-items: center; gap: 4px;
}
.config-bar .config-group input {
  width: 50px; padding: 4px 6px;
  text-align: center;
  background: #1a1b1f;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  color: var(--text-bright);
  font-size: 12px;
  font-family: var(--font-mono);
}

/* === Sparkline container === */
.sparkline-wrap {
  display: inline-block; vertical-align: middle;
}

/* === Responsive === */
@media (max-width: 768px) {
  .tab-btn { padding: 10px 12px; font-size: 12px; }
  .tab-content { padding: 12px; }
  .stats-row { gap: 6px; }
  .stat-card { min-width: 100px; padding: 10px; }
  .stat-card .value { font-size: 20px; }
}
```

- [ ] **Step 3: Create `index.html` — shell structure with tab navigation**

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>三角洲行动 · 交易助手</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="css/style.css">
</head>
<body>

<!-- Tab Navigation -->
<nav class="tab-nav" id="tabNav">
  <button class="tab-btn active" data-tab="dashboard">行情看板</button>
  <button class="tab-btn" data-tab="advice">买卖建议</button>
  <button class="tab-btn" data-tab="pnl">盈亏追踪</button>
  <button class="tab-btn" data-tab="calendar">事件日历</button>
  <button class="tab-btn" data-tab="ai">AI 分析</button>
</nav>

<!-- Tab 1: Dashboard -->
<div class="tab-content active" id="tab-dashboard">
  <div class="toolbar">
    <div class="toolbar-left">
      <span class="freshness fresh" id="freshnessBadge">数据加载中...</span>
      <input type="text" class="input" id="searchInput" placeholder="搜索物品..." style="width:180px;">
      <select class="select" id="categoryFilter">
        <option value="all">全部分类</option>
        <option value="ammo">弹药</option>
        <option value="keycard">钥匙卡</option>
        <option value="attachment">配件</option>
        <option value="equipment">装备</option>
        <option value="other">其他</option>
      </select>
    </div>
    <div class="toolbar-right">
      <button class="btn btn-primary" id="refreshBtn">刷新</button>
    </div>
  </div>
  <div class="stats-row" id="dashboardStats"></div>
  <div class="panel">
    <table class="data-table" id="priceTable">
      <thead>
        <tr>
          <th data-sort="name">物品名称</th>
          <th data-sort="category">分类</th>
          <th data-sort="price" class="num">当前价</th>
          <th data-sort="low" class="num">24h最低</th>
          <th data-sort="high" class="num">24h最高</th>
          <th data-sort="change" class="num">涨跌幅</th>
          <th class="center">操作</th>
        </tr>
      </thead>
      <tbody id="priceTableBody"></tbody>
    </table>
  </div>
  <div class="panel" id="detailPanel" style="display:none;">
    <div class="section-header">
      <span id="detailTitle">物品详情</span>
      <div>
        <button class="btn btn-sm btn-outline time-range-btn active" data-range="24h">24h</button>
        <button class="btn btn-sm btn-outline time-range-btn" data-range="7d">7d</button>
        <button class="btn btn-sm btn-outline time-range-btn" data-range="30d">30d</button>
      </div>
    </div>
    <div class="panel-body">
      <div id="detailChart" style="height:320px;"></div>
    </div>
  </div>
</div>

<!-- Tab 2: Advice -->
<div class="tab-content" id="tab-advice">
  <div class="stats-row" id="adviceStats"></div>
  <div class="config-bar" id="adviceConfig">
    <span style="color:var(--text-bright);font-weight:600;">提醒阈值</span>
    <span>当价格偏离均线超过</span>
    <input type="number" id="thresholdPct" value="15" min="1" max="50" style="width:50px;padding:4px 6px;text-align:center;background:#1a1b1f;border:1px solid var(--border);border-radius:4px;color:var(--text-bright);font-size:12px;">
    <span>% 时弹出通知</span>
    <label style="display:flex;align-items:center;gap:4px;cursor:pointer;">
      <input type="checkbox" id="alertBuy" checked> 买入提醒
    </label>
    <label style="display:flex;align-items:center;gap:4px;cursor:pointer;">
      <input type="checkbox" id="alertSell" checked> 卖出提醒
    </label>
  </div>
  <div class="panel">
    <div class="section-header">交易信号 <span class="sub">基于24h均线 + 税费校验</span></div>
    <table class="data-table" id="signalTable">
      <thead>
        <tr>
          <th>物品</th>
          <th class="num">当前价</th>
          <th class="num">24h均线</th>
          <th>24h 走势</th>
          <th class="num">偏离</th>
          <th>信号</th>
          <th class="center">置信度</th>
        </tr>
      </thead>
      <tbody id="signalTableBody"></tbody>
    </table>
  </div>
</div>

<!-- Tab 3: P&L -->
<div class="tab-content" id="tab-pnl">
  <div class="config-bar" id="taxConfig">
    <span style="color:var(--text-bright);font-weight:600;">税费设置</span>
    <span>保证金</span>
    <input type="number" id="depositRate" value="3" min="0" max="20" step="0.5" style="width:50px;padding:4px 6px;text-align:center;background:#1a1b1f;border:1px solid var(--border);border-radius:4px;color:var(--gold);font-size:12px;">
    <span>% + 手续费</span>
    <input type="number" id="feeRate" value="10" min="0" max="30" step="0.5" style="width:50px;padding:4px 6px;text-align:center;background:#1a1b1f;border:1px solid var(--border);border-radius:4px;color:var(--gold);font-size:12px;">
    <span>% = 综合</span>
    <span id="totalTaxRate" style="color:var(--red-bright);font-weight:600;">13%</span>
    <span style="margin-left:auto;color:var(--green);font-size:11px;">盈亏 = 税后到手 - 成本</span>
  </div>
  <div class="stats-row" id="pnlStats"></div>
  <div style="display:flex; gap:8px; margin-bottom:14px; align-items:center;">
    <button class="btn btn-primary" id="addBuyBtn">+ 记录买入</button>
    <button class="btn btn-outline" id="addSellBtn">+ 记录卖出</button>
    <span style="margin-left:auto;font-size:12px;cursor:pointer;color:var(--text-dim);" id="exportBtn">导出 JSON ▾</span>
    <span style="font-size:12px;cursor:pointer;color:var(--text-dim);" id="importBtn">导入 JSON</span>
    <input type="file" id="importFile" accept=".json" style="display:none;">
  </div>
  <div class="panel">
    <div class="section-header">当前持仓</div>
    <table class="data-table" id="holdingsTable">
      <thead>
        <tr>
          <th>物品</th>
          <th class="num">持有量</th>
          <th class="num">买入均价</th>
          <th class="num">成本</th>
          <th class="num">卖出标价</th>
          <th class="num">税后到手</th>
          <th class="num">税后盈亏</th>
          <th class="center">操作</th>
        </tr>
      </thead>
      <tbody id="holdingsTableBody"></tbody>
    </table>
  </div>
  <div class="panel">
    <div class="section-header">交易记录</div>
    <table class="data-table" id="tradeHistoryTable">
      <thead>
        <tr>
          <th>时间</th>
          <th>类型</th>
          <th>物品</th>
          <th class="num">数量</th>
          <th class="num">单价</th>
          <th class="num">总价</th>
          <th class="num">盈亏</th>
        </tr>
      </thead>
      <tbody id="tradeHistoryBody"></tbody>
    </table>
  </div>
</div>

<!-- Tab 4: Event Calendar -->
<div class="tab-content" id="tab-calendar">
  <div class="toolbar">
    <div class="toolbar-left">
      <button class="btn btn-sm btn-outline" id="calPrevMonth">◀</button>
      <span id="calMonthLabel" style="font-size:16px;font-weight:700;color:var(--text-bright);min-width:160px;text-align:center;"></span>
      <button class="btn btn-sm btn-outline" id="calNextMonth">▶</button>
      <button class="btn btn-sm btn-outline" id="calToday">今天</button>
    </div>
    <div class="toolbar-right">
      <button class="btn btn-primary btn-sm" id="addEventBtn">+ 添加事件</button>
    </div>
  </div>
  <div class="calendar-grid" id="calendarGrid"></div>
  <div class="panel" id="dayEventsPanel" style="display:none; margin-top:12px;">
    <div class="section-header" id="dayEventsTitle">事件详情</div>
    <div class="panel-body" id="dayEventsList"></div>
  </div>
</div>

<!-- Tab 5: AI Analysis -->
<div class="tab-content" id="tab-ai">
  <div class="config-bar">
    <span style="color:var(--text-bright);font-weight:600;">API 设置</span>
    <span>Provider:</span>
    <select class="select" id="aiProvider">
      <option value="deepseek">DeepSeek</option>
      <option value="openai">OpenAI</option>
      <option value="anthropic">Anthropic</option>
    </select>
    <span>API Key:</span>
    <input type="password" class="input" id="aiApiKey" placeholder="sk-..." style="width:200px;">
    <button class="btn btn-sm btn-outline" id="saveApiKey">保存</button>
    <span style="margin-left:auto;">
      <button class="btn btn-sm btn-outline" id="exportReportBtn">导出分析报告</button>
    </span>
  </div>
  <div class="chat-container">
    <div class="chat-messages" id="chatMessages">
      <div class="chat-msg assistant">
        你好！我是交易分析助手。<br><br>
        你可以问我：<br>
        • "金弹现在该不该入？"<br>
        • "哪种子弹最适合抄底？"<br>
        • "帮我看看持仓哪些该卖了"<br>
        • "最近有什么值得关注的波动？"<br><br>
        也可以先点「导出分析报告」把数据粘贴给我。
      </div>
    </div>
    <div class="chat-input-row">
      <input type="text" class="input" id="chatInput" placeholder="输入问题..." style="flex:1;">
      <button class="btn btn-primary" id="chatSend">发送</button>
    </div>
  </div>
</div>

<!-- Modals (hidden by default) -->
<div class="modal-overlay" id="tradeModal">
  <div class="modal-box">
    <h3 id="tradeModalTitle">记录交易</h3>
    <label>物品名称</label>
    <input type="text" class="input" id="tradeItemName" placeholder="输入物品名称...">
    <label>数量</label>
    <input type="number" class="input" id="tradeQty" value="1" min="1">
    <label>单价（哈夫币）</label>
    <input type="number" class="input" id="tradePrice" placeholder="0">
    <label>交易类型</label>
    <select class="select" id="tradeType">
      <option value="buy">买入</option>
      <option value="sell">卖出</option>
    </select>
    <div class="btn-row">
      <button class="btn btn-outline" id="tradeCancel">取消</button>
      <button class="btn btn-primary" id="tradeConfirm">确认</button>
    </div>
  </div>
</div>

<div class="modal-overlay" id="eventModal">
  <div class="modal-box">
    <h3 id="eventModalTitle">添加事件</h3>
    <label>日期</label>
    <input type="date" class="input" id="eventDate">
    <label>标题</label>
    <input type="text" class="input" id="eventTitle" placeholder="事件标题...">
    <label>事件类型</label>
    <select class="select" id="eventType">
      <option value="update">版本更新</option>
      <option value="season">赛季更替</option>
      <option value="holiday">节假日活动</option>
      <option value="weapon">武器调整</option>
      <option value="restock">官方补货</option>
      <option value="other">其他</option>
    </select>
    <label>影响描述</label>
    <input type="text" class="input" id="eventDesc" placeholder="对价格的影响...">
    <label>预期涨跌</label>
    <select class="select" id="eventImpact">
      <option value="up">预期上涨</option>
      <option value="down">预期下跌</option>
      <option value="neutral">不确定</option>
    </select>
    <label>影响幅度 %（可选）</label>
    <input type="text" class="input" id="eventMagnitude" placeholder="如: 10-20">
    <div class="btn-row">
      <button class="btn btn-outline" id="eventCancel">取消</button>
      <button class="btn btn-primary" id="eventConfirm">确认</button>
    </div>
  </div>
</div>

<!-- ECharts CDN -->
<script src="https://cdn.jsdelivr.net/npm/echarts@5.5.0/dist/echarts.min.js"></script>

<!-- App scripts -->
<script src="js/storage.js"></script>
<script src="js/api.js"></script>
<script src="js/charts.js"></script>
<script src="js/sparkline.js"></script>
<script src="js/signals.js"></script>
<script src="js/calendar.js"></script>
<script src="js/ai.js"></script>
<script src="js/app.js"></script>

</body>
</html>
```

- [ ] **Step 4: Verify** — Open `index.html` in a browser. Confirm dark theme, tab bar visible, 5 tabs clickable. No console errors.

- [ ] **Step 5: Commit**

```bash
git add index.html css/style.css data/items.json
git commit -m "feat: project scaffold with dark theme CSS and HTML shell

- Add 5-tab navigation structure
- Full dark theme CSS variables and component styles
- Item tier/type mapping (items.json)
- Modal shells for trade entry and event entry
- Load ECharts CDN and JS module scripts

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 2: Storage Layer

**Files:**
- Create: `js/storage.js`

- [ ] **Step 1: Write `js/storage.js`**

```javascript
/* global localStorage */

const STORAGE_KEYS = {
  trades: 'df_trades',
  holdings: 'df_holdings',
  events: 'df_events',
  config: 'df_config',
  priceHistory: 'df_price_history'
};

const Storage = {
  // --- Generic helpers ---
  _get(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  },
  _set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.warn('localStorage full, cannot save', key);
    }
  },

  // --- Trades ---
  getTrades() { return this._get(STORAGE_KEYS.trades, []); },
  addTrade(trade) {
    const trades = this.getTrades();
    trade.id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    trade.createdAt = new Date().toISOString();
    trades.unshift(trade);
    this._set(STORAGE_KEYS.trades, trades);
    return trade;
  },
  deleteTrade(id) {
    const trades = this.getTrades().filter(t => t.id !== id);
    this._set(STORAGE_KEYS.trades, trades);
  },
  cleanOldTrades(days = 30) {
    const cutoff = Date.now() - days * 86400000;
    const trades = this.getTrades().filter(t => {
      if (t.type === 'sell') {
        return new Date(t.createdAt).getTime() > cutoff;
      }
      return true;
    });
    this._set(STORAGE_KEYS.trades, trades);
  },

  // --- Holdings ---
  getHoldings() { return this._get(STORAGE_KEYS.holdings, []); },
  addHolding(item) {
    const holdings = this.getHoldings();
    const existing = holdings.find(h => h.name === item.name);
    if (existing) {
      const totalQty = existing.qty + item.qty;
      existing.avgPrice = ((existing.avgPrice * existing.qty) + (item.price * item.qty)) / totalQty;
      existing.totalCost = existing.avgPrice * totalQty;
      existing.qty = totalQty;
    } else {
      holdings.push({
        name: item.name,
        qty: item.qty,
        avgPrice: item.price,
        totalCost: item.price * item.qty
      });
    }
    this._set(STORAGE_KEYS.holdings, holdings);
    return holdings;
  },
  removeHolding(name, qty) {
    let holdings = this.getHoldings();
    const h = holdings.find(x => x.name === name);
    if (!h) return holdings;
    h.qty -= qty;
    if (h.qty <= 0) {
      holdings = holdings.filter(x => x.name !== name);
    } else {
      h.totalCost = h.avgPrice * h.qty;
    }
    this._set(STORAGE_KEYS.holdings, holdings);
    return holdings;
  },

  // --- Events ---
  getEvents() { return this._get(STORAGE_KEYS.events, []); },
  addEvent(evt) {
    const events = this.getEvents();
    evt.id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    events.push(evt);
    events.sort((a, b) => new Date(a.date) - new Date(b.date));
    this._set(STORAGE_KEYS.events, events);
    return evt;
  },
  updateEvent(id, updates) {
    const events = this.getEvents();
    const idx = events.findIndex(e => e.id === id);
    if (idx !== -1) Object.assign(events[idx], updates);
    this._set(STORAGE_KEYS.events, events);
  },
  deleteEvent(id) {
    const events = this.getEvents().filter(e => e.id !== id);
    this._set(STORAGE_KEYS.events, events);
  },

  // --- Config ---
  getConfig() {
    return this._get(STORAGE_KEYS.config, {
      depositRate: 3,
      feeRate: 10,
      thresholdPct: 15,
      alertBuy: true,
      alertSell: true,
      refreshInterval: 10,
      aiProvider: 'deepseek',
      aiApiKey: ''
    });
  },
  setConfig(updates) {
    const cfg = { ...this.getConfig(), ...updates };
    this._set(STORAGE_KEYS.config, cfg);
    return cfg;
  },

  // --- Price History ---
  getPriceHistory() { return this._get(STORAGE_KEYS.priceHistory, {}); },
  appendPriceSnapshot(snapshot) {
    const history = this.getPriceHistory();
    const ts = snapshot.timestamp || new Date().toISOString();
    for (const item of (snapshot.items || [])) {
      if (!history[item.name]) history[item.name] = [];
      history[item.name].push({ t: ts, p: item.price });
      if (history[item.name].length > 864) {
        history[item.name] = history[item.name].slice(-864);
      }
    }
    this._set(STORAGE_KEYS.priceHistory, history);
  },
  cleanPriceHistory(maxDays = 90) {
    const cutoff = Date.now() - maxDays * 86400000;
    const history = this.getPriceHistory();
    for (const key of Object.keys(history)) {
      history[key] = history[key].filter(p => new Date(p.t).getTime() > cutoff);
    }
    this._set(STORAGE_KEYS.priceHistory, history);
  },

  // --- Export / Import ---
  exportAll() {
    return {
      trades: this.getTrades(),
      holdings: this.getHoldings(),
      events: this.getEvents(),
      config: this.getConfig(),
      priceHistory: this.getPriceHistory(),
      exportedAt: new Date().toISOString()
    };
  },
  importAll(data) {
    if (data.trades) this._set(STORAGE_KEYS.trades, data.trades);
    if (data.holdings) this._set(STORAGE_KEYS.holdings, data.holdings);
    if (data.events) this._set(STORAGE_KEYS.events, data.events);
    if (data.config) this._set(STORAGE_KEYS.config, data.config);
    if (data.priceHistory) this._set(STORAGE_KEYS.priceHistory, data.priceHistory);
  }
};
```

- [ ] **Step 2: Verify** — Load `index.html`, open Developer Tools console, run `Storage.getConfig()`. Should return default config object. Run `Storage.addTrade({type:'buy', name:'Test', qty:10, price:100})`. Should succeed. Run `Storage.getTrades()`. Should show 1 trade.

- [ ] **Step 3: Commit**

```bash
git add js/storage.js
git commit -m "feat: add localStorage storage layer

- CRUD for trades, holdings, events, config, price history
- Auto-cleanup for old trades (>30d) and price history (>90d)
- JSON export/import for backup
- Weighted average price for multi-buy holdings

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 3: API Data Fetching

**Files:**
- Create: `js/api.js`

The API fetches prices from delta-force-api / DeltaForcePrice. Since the exact API endpoint may vary, the fetch function normalizes data into a standard format. The user can configure the API URL.

- [ ] **Step 1: Write `js/api.js`**

```javascript
/* global Storage */

const Api = {
  // Default API endpoint — user can override in config
  baseUrl: 'https://delta-force-api.example.com/api/prices',

  // Cache of last fetched data
  _cache: null,
  _lastFetchTime: null,

  /**
   * Fetch latest prices from API.
   * Normalizes into: { items: [{name, price, low24h, high24h, history:[{t,p}]}], updatedAt }
   */
  async fetchPrices() {
    const cfg = Storage.getConfig();
    const url = cfg.apiUrl || this.baseUrl;

    const resp = await fetch(url, {
      cache: 'no-cache',
      headers: { 'Accept': 'application/json' }
    });
    if (!resp.ok) throw new Error(`API error: ${resp.status} ${resp.statusText}`);

    const raw = await resp.json();
    const normalized = this._normalize(raw);
    this._cache = normalized;
    this._lastFetchTime = new Date();
    return normalized;
  },

  /** Normalize various API response formats into our standard shape */
  _normalize(raw) {
    const items = [];

    // Handle common API formats:
    // Format A: { items: [{name, currentPrice, minPrice24h, maxPrice24h, priceHistory:[], ...}] }
    // Format B: { data: { prices: [...] } }
    // Format C: [{name, price, ...}] (array directly)
    let source = raw.items || (raw.data && raw.data.prices) || raw;
    if (!Array.isArray(source)) source = [];

    for (const it of source) {
      const name = it.name || it.itemName || it.id || '';
      const price = it.currentPrice || it.price || it.sellPrice || 0;
      const low24h = it.minPrice24h || it.low24h || it.low || price;
      const high24h = it.maxPrice24h || it.high24h || it.high || price;
      const change = it.change24h || it.change || (price > 0 && low24h > 0
        ? (((price - (high24h + low24h) / 2) / ((high24h + low24h) / 2)) * 100).toFixed(1)
        : 0);

      // History: prefer API-provided, otherwise use local cache fallback
      let history = it.priceHistory || it.history || [];
      if (!history.length) {
        const local = Storage.getPriceHistory();
        history = local[name] || [];
      }

      items.push({
        name,
        price: Math.round(price),
        low24h: Math.round(low24h),
        high24h: Math.round(high24h),
        change: parseFloat(change),
        history,
        category: it.category || it.type || 'other',
        tier: it.tier || it.quality || 0,
        basePrice: it.basePrice || it.originalPrice || 0
      });
    }

    return {
      items,
      updatedAt: raw.updatedAt || raw.timestamp || new Date().toISOString()
    };
  },

  /** Get cached data without fetching */
  getCache() { return this._cache; },

  /** Minutes since last successful fetch */
  minutesSinceFetch() {
    if (!this._lastFetchTime) return Infinity;
    return Math.round((Date.now() - this._lastFetchTime.getTime()) / 60000);
  },

  /** Check if refresh is needed (older than interval minutes) */
  needsRefresh(intervalMin = 10) {
    return this.minutesSinceFetch() >= intervalMin;
  }
};
```

- [ ] **Step 2: Verify** — Since we don't have the real API running, verify the normalization logic works. In console:
```javascript
const test = Api._normalize({ items: [{ name: '9x19mm PSO', currentPrice: 1280, minPrice24h: 1150, maxPrice24h: 1510 }] });
console.log(test.items[0]); // Should show normalized object
```

- [ ] **Step 3: Commit**

```bash
git add js/api.js
git commit -m "feat: add API data fetching layer with format normalization

- Fetches from configurable delta-force-api endpoint
- Normalizes multiple API response formats
- Caches last fetch result and timestamp
- Falls back to local price history when API doesn't provide it

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 4: Item Metadata Helper

**Files:**
- Modify: `data/items.json` (already created)
- Create: `js/items.js`

This module loads `items.json` and provides item tier/color/type lookups.

- [ ] **Step 1: Write `js/items.js`**

```javascript
/* global fetch */

const Items = {
  _data: null,
  _ready: false,

  async load() {
    try {
      const resp = await fetch('data/items.json');
      this._data = await resp.json();
      this._ready = true;
    } catch (e) {
      console.warn('Failed to load items.json, using empty mapping');
      this._data = { items: {}, tierColors: {}, tierNames: {}, categories: [] };
    }
  },

  /** Get tier (1-6) for an item name. Returns 1 if unknown. */
  getTier(name) {
    const entry = this._data && this._data.items && this._data.items[name];
    return entry ? entry.tier : 1;
  },

  /** Get hex color for an item name based on its tier */
  getColor(name) {
    const tier = this.getTier(name);
    return (this._data && this._data.tierColors && this._data.tierColors[tier]) || '#c0c0c0';
  },

  /** Get tier display name (白/绿/蓝/紫/金/红) */
  getTierName(name) {
    const tier = this.getTier(name);
    return (this._data && this._data.tierNames && this._data.tierNames[tier]) || '';
  },

  /** Get category for an item name */
  getCategory(name) {
    const entry = this._data && this._data.items && this._data.items[name];
    return entry ? entry.category : 'other';
  },

  /** Get category display name in Chinese */
  getCategoryName(cat) {
    const map = { ammo: '弹药', keycard: '钥匙卡', attachment: '配件', equipment: '装备', other: '其他' };
    return map[cat] || cat;
  },

  /** Render colored item name HTML */
  renderName(name) {
    const color = this.getColor(name);
    const tier = this.getTier(name);
    const tierName = this.getTierName(name);
    const dot = `<span class="tier-dot" style="background:${color};"></span>`;
    const label = tier > 1 ? `<span class="badge" style="background:${color}22;color:${color};margin-left:4px;">${tier}级${tierName ? ' '+tierName : ''}</span>` : '';
    return `${dot}<span style="color:${color};font-weight:700;">${name}</span>${label}`;
  }
};
```

- [ ] **Step 2: Verify** — In console after Items.load():
```javascript
await Items.load();
console.log(Items.getTier('9x19mm PSO')); // 3
console.log(Items.getColor('7.62x39mm BP')); // #f4a261
console.log(Items.renderName('M855A1')); // HTML string with purple coloring
```

- [ ] **Step 3: Commit**

```bash
git add js/items.js
git commit -m "feat: add item metadata lookup (tier, color, category)

- Loads items.json mapping data
- Provides tier-to-color, tier-to-name lookups
- HTML rendering helper for colored item names with tier badges

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 5: SVG Sparkline Renderer

**Files:**
- Create: `js/sparkline.js`

Draws mini SVG price charts (260x80) with time axis, price axis, min/max markers, and gradient fill.

- [ ] **Step 1: Write `js/sparkline.js`**

```javascript
/* global Items — for color only; sparkline is self-contained */

const Sparkline = {
  WIDTH: 260,
  HEIGHT: 80,
  MARGIN_LEFT: 42,
  MARGIN_RIGHT: 4,
  MARGIN_TOP: 14,
  MARGIN_BOTTOM: 18,
  CHART_W: 214,  // WIDTH - MARGIN_LEFT - MARGIN_RIGHT
  CHART_H: 48,   // HEIGHT - MARGIN_TOP - MARGIN_BOTTOM

  /**
   * Render a sparkline SVG string.
   * @param {Array} points - Array of {t: ISO-string, p: number}
   * @param {Object} opts - {color, currentPrice}
   * @returns {string} SVG HTML
   */
  render(points, opts = {}) {
    const color = opts.color || '#4ade80';
    const current = opts.currentPrice || 0;
    const W = this.WIDTH; const H = this.HEIGHT;
    const ML = this.MARGIN_LEFT; const MR = this.MARGIN_RIGHT;
    const MT = this.MARGIN_TOP; const MB = this.MARGIN_BOTTOM;
    const CW = this.CHART_W; const CH = this.CHART_H;

    if (!points || points.length < 2) {
      return `<svg width="${W}" height="${H}"><text x="${W/2}" y="${H/2}" text-anchor="middle" fill="#666" font-size="12">暂无数据</text></svg>`;
    }

    const prices = points.map(p => p.p);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const range = max - min || 1;

    // Price-to-Y mapping (Y increases downward)
    const toY = (p) => MT + CH - ((p - min) / range) * CH;
    // Index-to-X mapping
    const toX = (i) => ML + (i / (points.length - 1)) * CW;

    // Build polyline points
    const linePoints = points.map((pt, i) => `${toX(i).toFixed(1)},${toY(pt.p).toFixed(1)}`).join(' ');

    // Find min/max indices
    let minIdx = 0, maxIdx = 0;
    for (let i = 1; i < points.length; i++) {
      if (points[i].p < points[minIdx].p) minIdx = i;
      if (points[i].p > points[maxIdx].p) maxIdx = i;
    }

    // Time labels for X axis
    const timeLabels = this._timeLabels(points);

    // Y axis price labels
    const yMid = min + range / 2;
    const yMidY = toY(yMid);

    // Current price horizontal reference line
    const currentY = toY(current);

    // Gradient ID unique per instance
    const gradId = 'sg' + Math.random().toString(36).slice(2, 8);

    // Choose trend color based on first vs last
    const firstP = points[0].p;
    const lastP = points[points.length - 1].p;
    const trendColor = lastP >= firstP ? opts.upColor || '#ff4d5a' : opts.downColor || '#4ade80';
    const useColor = opts.forceColor || trendColor;

    return `
<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="${gradId}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${useColor}" stop-opacity="0.22"/>
      <stop offset="100%" stop-color="${useColor}" stop-opacity="0.02"/>
    </linearGradient>
  </defs>
  <line x1="${ML}" y1="${MT}" x2="${ML+CW}" y2="${MT}" stroke="#1f2025" stroke-width="1"/>
  <line x1="${ML}" y1="${MT+CH}" x2="${ML+CW}" y2="${MT+CH}" stroke="#1f2025" stroke-width="1"/>
  <line x1="${ML}" y1="${yMidY.toFixed(0)}" x2="${ML+CW}" y2="${yMidY.toFixed(0)}" stroke="#1f2025" stroke-width="0.5" stroke-dasharray="2,3"/>
  <polygon points="${ML},${toY(prices[0]).toFixed(1)} ${linePoints} ${ML+CW},${MT+CH} ${ML},${MT+CH}" fill="url(#${gradId})"/>
  <polyline points="${linePoints}" fill="none" stroke="${useColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  <line x1="${ML}" y1="${currentY.toFixed(0)}" x2="${ML+CW}" y2="${currentY.toFixed(0)}" stroke="${useColor}" stroke-width="0.8" stroke-dasharray="2,2" opacity="0.6"/>
  ${this._marker(ML+minIdx*(CW/(points.length-1)), toY(min), '#4ade80', `${min} ${this._fmtTime(points[minIdx].t)}`, 'above')}
  ${this._marker(ML+maxIdx*(CW/(points.length-1)), toY(max), '#ff4d5a', `${max} ${this._fmtTime(points[maxIdx].t)}`, 'below')}
  ${timeLabels.map((tl, i) => `<text x="${ML + (i/(timeLabels.length-1))*CW}" y="${H-4}" font-size="9" fill="#777" text-anchor="${i===0?'start':i===timeLabels.length-1?'end':'middle'}">${tl}</text>`).join('')}
  <text x="${ML-4}" y="${MT+4}" font-size="9" fill="#777" text-anchor="end">${max}</text>
  <text x="${ML-4}" y="${yMidY+4}" font-size="9" fill="#777" text-anchor="end">${Math.round(yMid)}</text>
  <text x="${ML-4}" y="${MT+CH+4}" font-size="9" fill="#777" text-anchor="end">${min}</text>
</svg>`;
  },

  _marker(cx, cy, color, label, pos) {
    const ly = pos === 'above' ? cy - 12 : cy + 16;
    const ta = 'middle';
    return `
<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="4" fill="none" stroke="${color}" stroke-width="1.2"/>
<text x="${cx.toFixed(1)}" y="${ly}" font-size="9" fill="${color}" text-anchor="${ta}">${label}</text>`;
  },

  _fmtTime(iso) {
    try {
      const d = new Date(iso);
      return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
    } catch (e) { return ''; }
  },

  _timeLabels(points) {
    if (points.length < 2) return [];
    const first = new Date(points[0].t);
    const last = new Date(points[points.length-1].t);
    const labels = [];
    const step = (last - first) / 4;
    for (let i = 0; i < 5; i++) {
      const t = new Date(first.getTime() + step * i);
      labels.push(`${String(t.getHours()).padStart(2,'0')}:${String(t.getMinutes()).padStart(2,'0')}`);
    }
    return labels;
  }
};
```

- [ ] **Step 2: Verify** — In console:
```javascript
const testData = [
  {t: '2026-05-28T08:00:00Z', p: 1510},
  {t: '2026-05-28T11:00:00Z', p: 1380},
  {t: '2026-05-28T14:00:00Z', p: 1220},
  {t: '2026-05-28T17:00:00Z', p: 1150},
  {t: '2026-05-28T20:00:00Z', p: 1280}
];
document.body.innerHTML = Sparkline.render(testData, {currentPrice: 1280});
// Should show a green sparkline with min/max markers and time axis
```

- [ ] **Step 3: Commit**

```bash
git add js/sparkline.js
git commit -m "feat: add SVG sparkline chart renderer

- 260x80 mini price charts with time/price axes
- Min/max point markers with price+time labels
- Gradient fill below price line
- Color based on trend (green=down, red=up)
- Current price reference line

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 6: ECharts Detail Chart

**Files:**
- Create: `js/charts.js`

ECharts-based full price chart shown in the Dashboard detail panel and potentially other tabs.

- [ ] **Step 1: Write `js/charts.js`**

```javascript
/* global echarts */

const Charts = {
  _instances: {},

  /**
   * Render or update a price history chart.
   * @param {string} domId - Container element ID
   * @param {Array} history - Array of {t: ISO, p: number}
   * @param {Array} events - Event markers [{date, title, type}]
   * @param {string} itemName - For title
   */
  renderPriceChart(domId, history, events, itemName) {
    const dom = document.getElementById(domId);
    if (!dom) return;

    // Dispose existing instance
    if (this._instances[domId]) {
      this._instances[domId].dispose();
    }

    const chart = echarts.init(dom);
    this._instances[domId] = chart;

    const times = history.map(h => h.t);
    const prices = history.map(h => h.p);

    // Event mark lines
    const markLines = (events || []).map(evt => ({
      xAxis: evt.date,
      lineStyle: { color: '#f4a261', type: 'dashed', width: 1 },
      label: { formatter: evt.title, color: '#f4a261', fontSize: 10 }
    }));

    const option = {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        backgroundColor: '#14151a',
        borderColor: '#2a2a2e',
        textStyle: { color: '#f0f0f0', fontSize: 12 }
      },
      grid: { left: 60, right: 20, top: 20, bottom: 30 },
      xAxis: {
        type: 'category',
        data: times,
        axisLine: { lineStyle: { color: '#2a2a2e' } },
        axisTick: { show: false },
        axisLabel: { color: '#777', fontSize: 10, formatter: v => {
          try { const d = new Date(v); return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`; }
          catch(e) { return v; }
        }},
        splitLine: { show: false }
      },
      yAxis: {
        type: 'value',
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: '#777', fontSize: 10 },
        splitLine: { lineStyle: { color: '#1f2025' } }
      },
      series: [{
        name: itemName || '价格',
        type: 'line',
        data: prices,
        smooth: true,
        symbol: 'none',
        lineStyle: { color: '#e63946', width: 2 },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(230,57,70,0.15)' },
            { offset: 1, color: 'rgba(230,57,70,0.01)' }
          ])
        },
        markPoint: {
          data: [
            { type: 'min', name: '最低', symbolSize: 50, itemStyle: { color: '#4ade80' }, label: { color: '#4ade80', fontSize: 10 } },
            { type: 'max', name: '最高', symbolSize: 50, itemStyle: { color: '#ff4d5a' }, label: { color: '#ff4d5a', fontSize: 10 } }
          ]
        },
        markLine: markLines.length ? {
          silent: true,
          symbol: 'none',
          data: markLines,
          label: { show: true }
        } : undefined
      }]
    };

    chart.setOption(option);
    return chart;
  },

  /** Resize all charts (call on window resize) */
  resizeAll() {
    Object.values(this._instances).forEach(c => c.resize());
  },

  /** Dispose all charts */
  disposeAll() {
    Object.values(this._instances).forEach(c => c.dispose());
    this._instances = {};
  }
};
```

- [ ] **Step 2: Verify** — In console with test data:
```javascript
Charts.renderPriceChart('detailChart', [
  {t:'2026-05-28T08:00',p:1510},{t:'2026-05-28T12:00',p:1220},{t:'2026-05-28T16:00',p:1150},{t:'2026-05-28T20:00',p:1280}
], [], '9x19mm PSO');
// Should render an ECharts line chart in the #detailChart div
```

- [ ] **Step 3: Commit**

```bash
git add js/charts.js
git commit -m "feat: add ECharts price history chart renderer

- Line chart with gradient fill, min/max point markers
- Event mark lines for calendar event overlay
- Tooltip with price data
- Dark theme styling matching the app

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 7: Trading Signal Engine

**Files:**
- Create: `js/signals.js`

Computes buy/sell/hold signals from price data.

- [ ] **Step 1: Write `js/signals.js`**

```javascript
/* global Storage */

const Signals = {
  /**
   * Generate trading signals for all items.
   * @param {Array} items - Normalized items array from API
   * @returns {Array} Signal objects sorted by confidence desc
   */
  generate(items) {
    const cfg = Storage.getConfig();
    const threshold = cfg.thresholdPct || 15;
    const taxRate = ((cfg.depositRate || 3) + (cfg.feeRate || 10)) / 100;
    const holdings = Storage.getHoldings();
    const results = [];

    for (const item of items) {
      const history = item.history || [];
      const avg24h = this._calcAvg(history);
      const current = item.price;
      if (!avg24h || !current) continue;

      const deviation = ((current - avg24h) / avg24h) * 100;
      const absDev = Math.abs(deviation);

      let signal, confidence;
      if (absDev < threshold) {
        signal = 'hold';
        confidence = Math.round((absDev / threshold) * 50);
      } else if (deviation < 0) {
        signal = 'buy';
        confidence = Math.min(95, 50 + Math.round((absDev - threshold) * 2));
      } else {
        // Selling: check if profitable after tax
        const holding = holdings.find(h => h.name === item.name);
        const postTaxPrice = current * (1 - taxRate);
        if (holding && postTaxPrice > holding.avgPrice) {
          signal = 'sell';
          confidence = Math.min(95, 50 + Math.round((absDev - threshold) * 2));
        } else if (holding) {
          // Price is up but not enough to profit after tax
          signal = 'hold';
          confidence = Math.round((absDev / threshold) * 40);
        } else {
          signal = 'sell';
          confidence = Math.min(80, 50 + Math.round((absDev - threshold) * 1.5));
        }
      }

      // Boost confidence for sustained trends
      const trendBonus = this._trendConsistency(history);
      confidence = Math.min(95, confidence + trendBonus);

      results.push({
        name: item.name,
        price: current,
        avg24h: Math.round(avg24h),
        deviation: parseFloat(deviation.toFixed(1)),
        signal,
        confidence: Math.round(confidence),
        history,
        tier: item.tier || 0
      });
    }

    // Sort: sell signals first (by abs deviation), then buy, then hold
    const priority = { sell: 0, buy: 1, hold: 2 };
    results.sort((a, b) => {
      if (a.signal !== b.signal) return priority[a.signal] - priority[b.signal];
      return Math.abs(b.deviation) - Math.abs(a.deviation);
    });

    return results;
  },

  /** Calculate simple moving average from history array */
  _calcAvg(history) {
    if (!history || !history.length) return 0;
    const sum = history.reduce((s, h) => s + h.p, 0);
    return sum / history.length;
  },

  /** Check if recent trend is consistently in one direction (0-15 bonus) */
  _trendConsistency(history) {
    if (!history || history.length < 4) return 0;
    const recent = history.slice(-4);
    let ups = 0, downs = 0;
    for (let i = 1; i < recent.length; i++) {
      if (recent[i].p > recent[i-1].p) ups++;
      else if (recent[i].p < recent[i-1].p) downs++;
    }
    const maxSame = Math.max(ups, downs);
    return maxSame >= 3 ? 15 : maxSame >= 2 ? 8 : 0;
  },

  /** Detect anomalies: >threshold% change in a single period */
  detectAnomalies(items) {
    const cfg = Storage.getConfig();
    const anomalyThreshold = cfg.anomalyThreshold || 15;
    const anomalies = [];

    for (const item of items) {
      const history = item.history || [];
      if (history.length < 2) continue;

      for (let i = 1; i < history.length; i++) {
        const pctChange = ((history[i].p - history[i-1].p) / history[i-1].p) * 100;
        if (Math.abs(pctChange) >= anomalyThreshold) {
          anomalies.push({
            name: item.name,
            time: history[i].t,
            change: parseFloat(pctChange.toFixed(1)),
            from: history[i-1].p,
            to: history[i].p
          });
        }
      }
    }

    return anomalies;
  }
};
```

- [ ] **Step 2: Verify** — In console:
```javascript
const testItems = [
  { name: 'TestA', price: 1280, history: [{t:'a',p:1510},{t:'b',p:1450},{t:'c',p:1400},{t:'d',p:1350},{t:'e',p:1280}] },
  { name: 'TestB', price: 2100, history: [{t:'a',p:1620},{t:'b',p:1750},{t:'c',p:1850},{t:'d',p:1980},{t:'e',p:2100}] }
];
const sigs = Signals.generate(testItems);
console.log(sigs[0]); // TestB: sell signal
console.log(sigs[1]); // TestA: buy signal
```

- [ ] **Step 3: Commit**

```bash
git add js/signals.js
git commit -m "feat: add trading signal engine

- Computes buy/sell/hold signals from price vs 24h moving average
- Tax-aware sell signal validation
- Confidence scoring with trend consistency bonus
- Anomaly detection for sudden price movements

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 8: Event Calendar Module

**Files:**
- Create: `js/calendar.js`

Calendar view renderer and event management.

- [ ] **Step 1: Write `js/calendar.js`**

```javascript
/* global Storage */

const Calendar = {
  _year: new Date().getFullYear(),
  _month: new Date().getMonth(), // 0-indexed
  _selectedDate: null,

  /** Render the full month calendar grid into #calendarGrid */
  render() {
    const grid = document.getElementById('calendarGrid');
    if (!grid) return;

    const events = Storage.getEvents();
    const today = new Date();
    const firstDay = new Date(this._year, this._month, 1);
    const lastDay = new Date(this._year, this._month + 1, 0);
    const startDow = firstDay.getDay(); // 0=Sun

    // Month label
    document.getElementById('calMonthLabel').textContent =
      `${this._year}年 ${this._month + 1}月`;

    // Day headers
    const dayHeaders = ['日', '一', '二', '三', '四', '五', '六'];
    let html = dayHeaders.map(d => `<div class="calendar-day-header">${d}</div>`).join('');

    // Previous month fill
    const prevLast = new Date(this._year, this._month, 0).getDate();
    for (let i = startDow - 1; i >= 0; i--) {
      const d = prevLast - i;
      html += this._dayCell(d, true, events, today);
    }

    // Current month
    for (let d = 1; d <= lastDay.getDate(); d++) {
      html += this._dayCell(d, false, events, today);
    }

    // Next month fill
    const totalCells = startDow + lastDay.getDate();
    const remaining = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
    for (let d = 1; d <= remaining; d++) {
      html += this._dayCell(d, true, events, today);
    }

    grid.innerHTML = html;
  },

  _dayCell(day, isOtherMonth, events, today) {
    const dateStr = `${this._year}-${String(this._month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dayEvents = events.filter(e => e.date && e.date.startsWith(dateStr));
    const isToday = !isOtherMonth && today.getFullYear() === this._year &&
                    today.getMonth() === this._month && today.getDate() === day;
    const isSelected = this._selectedDate === dateStr;

    let cls = 'calendar-day';
    if (isOtherMonth) cls += ' other-month';
    if (isToday) cls += ' today';
    if (isSelected) cls += ' selected';

    const dots = dayEvents.map(e => {
      const isPast = new Date(e.date) < new Date();
      const dotCls = isPast ? 'past' : 'upcoming';
      return `<span class="event-dot ${dotCls}" title="${e.title}"></span>`;
    }).join('');

    return `
<div class="${cls}" data-date="${dateStr}" onclick="Calendar.selectDate('${dateStr}')">
  <div class="day-num">${day}</div>
  <div style="margin-top:2px;">${dots}</div>
</div>`;
  },

  selectDate(dateStr) {
    this._selectedDate = dateStr;
    this.render();
    this._showDayEvents(dateStr);
  },

  _showDayEvents(dateStr) {
    const panel = document.getElementById('dayEventsPanel');
    const title = document.getElementById('dayEventsTitle');
    const list = document.getElementById('dayEventsList');
    if (!panel || !list) return;

    const events = Storage.getEvents().filter(e => e.date && e.date.startsWith(dateStr));
    if (!events.length) {
      panel.style.display = 'none';
      return;
    }

    panel.style.display = 'block';
    title.textContent = `${dateStr} 事件`;

    const typeNames = {
      update: '版本更新', season: '赛季更替', holiday: '节假日活动',
      weapon: '武器调整', restock: '官方补货', other: '其他'
    };
    const impactIcons = { up: '📈', down: '📉', neutral: '➡️' };

    list.innerHTML = events.map(e => `
<div style="background:var(--surface);border:1px solid var(--border);border-radius:6px;padding:12px;margin-bottom:8px;">
  <div style="display:flex;justify-content:space-between;align-items:start;">
    <span style="font-weight:600;color:var(--text-bright);">${e.title}</span>
    <span style="font-size:10px;padding:2px 6px;background:#1f1f26;border-radius:3px;color:var(--text-dim);">${typeNames[e.type] || e.type}</span>
  </div>
  ${e.desc ? `<div style="margin-top:4px;font-size:12px;color:var(--text-dim);">${e.desc}</div>` : ''}
  ${e.impact && e.impact !== 'neutral' ? `<div style="margin-top:4px;font-size:12px;color:${e.impact==='up'?'var(--green)':'var(--red-bright)'};">${impactIcons[e.impact]} 预期${e.impact==='up'?'上涨':'下跌'}${e.magnitude?' '+e.magnitude+'%':''}</div>` : ''}
  <button onclick="Calendar.deleteEvent('${e.id}')" style="margin-top:6px;font-size:11px;background:none;border:none;color:var(--red);cursor:pointer;">删除</button>
</div>`).join('');
  },

  deleteEvent(id) {
    if (!confirm('确定删除此事件？')) return;
    Storage.deleteEvent(id);
    this.render();
    if (this._selectedDate) this._showDayEvents(this._selectedDate);
  },

  prevMonth() {
    if (this._month === 0) { this._month = 11; this._year--; }
    else this._month--;
    this.render();
    document.getElementById('dayEventsPanel').style.display = 'none';
  },

  nextMonth() {
    if (this._month === 11) { this._month = 0; this._year++; }
    else this._month++;
    this.render();
    document.getElementById('dayEventsPanel').style.display = 'none';
  },

  goToday() {
    const today = new Date();
    this._year = today.getFullYear();
    this._month = today.getMonth();
    const dateStr = `${this._year}-${String(this._month + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    this.selectDate(dateStr);
  }
};
```

- [ ] **Step 2: Verify** — In console:
```javascript
Storage.addEvent({date:'2026-05-28',title:'S6赛季更新',type:'season',impact:'up',magnitude:'10-15',desc:'新赛季上线'});
Calendar.render();
// Calendar grid should show with the event dot on May 28
Calendar.selectDate('2026-05-28');
// Day events panel should show below
```

- [ ] **Step 3: Commit**

```bash
git add js/calendar.js
git commit -m "feat: add event calendar module

- Month view calendar grid with event dots
- Past events (blue dot) vs upcoming events (gold dot)
- Click date to view/delete events
- Month navigation (prev/next/today)
- Event impact prediction display

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 9: AI Analysis Module

**Files:**
- Create: `js/ai.js`

AI chat panel and report export functionality.

- [ ] **Step 1: Write `js/ai.js`**

```javascript
/* global Storage, Api */

const AI = {
  _messages: [],

  /** Build context object for the AI */
  buildContext() {
    const cache = Api.getCache();
    const holdings = Storage.getHoldings();
    const config = Storage.getConfig();
    const events = Storage.getEvents();
    const upcomingEvents = events.filter(e => new Date(e.date) >= new Date());

    // Calculate portfolio summary
    const taxRate = ((config.depositRate || 3) + (config.feeRate || 10)) / 100;
    let totalCost = 0, totalValue = 0;
    const holdingsSummary = holdings.map(h => {
      const item = cache ? cache.items.find(i => i.name === h.name) : null;
      const currentPrice = item ? item.price : 0;
      const value = currentPrice * h.qty;
      const cost = h.avgPrice * h.qty;
      const pnlAfterTax = (currentPrice * (1 - taxRate) - h.avgPrice) * h.qty;
      totalCost += cost;
      totalValue += value;
      return { name: h.name, qty: h.qty, avgPrice: h.avgPrice, currentPrice, cost, value, pnlAfterTax };
    });

    const topMovers = cache ? [...cache.items]
      .sort((a, b) => Math.abs(b.change) - Math.abs(a.change))
      .slice(0, 5)
      .map(i => ({ name: i.name, price: i.price, change: i.change })) : [];

    return {
      holdings: holdingsSummary,
      totalCost,
      totalValue,
      totalPnl: totalValue - totalCost,
      taxRate: Math.round(taxRate * 100),
      topMovers,
      upcomingEvents,
      priceDataAvailable: !!cache,
      updatedAt: cache ? cache.updatedAt : null
    };
  },

  /** Generate a text analysis report */
  generateReport() {
    const ctx = this.buildContext();
    const lines = [
      '=== 三角洲行动 · 交易分析报告 ===',
      `生成时间：${new Date().toLocaleString('zh-CN')}`,
      `数据更新：${ctx.updatedAt ? new Date(ctx.updatedAt).toLocaleString('zh-CN') : '无'}`,
      '',
      '【行情概况】',
    ];

    if (ctx.topMovers.length) {
      for (const m of ctx.topMovers) {
        const arrow = m.change >= 0 ? '↑' : '↓';
        lines.push(`  ${m.name}: ${m.price.toLocaleString()} (${arrow}${Math.abs(m.change).toFixed(1)}%)`);
      }
    } else {
      lines.push('  暂无价格数据');
    }

    lines.push('');
    lines.push('【持仓概览】');
    if (ctx.holdings.length) {
      for (const h of ctx.holdings) {
        const pnlStr = h.pnlAfterTax >= 0 ? `+${h.pnlAfterTax.toLocaleString()}` : h.pnlAfterTax.toLocaleString();
        lines.push(`  ${h.name}: 持有${h.qty}, 均价${h.avgPrice.toLocaleString()}, 现价${h.currentPrice.toLocaleString()}, 税后盈亏 ${pnlStr}`);
      }
      lines.push(`  总成本: ${ctx.totalCost.toLocaleString()}`);
      lines.push(`  总市值: ${ctx.totalValue.toLocaleString()}`);
      lines.push(`  浮盈: ${ctx.totalPnl >= 0 ? '+' : ''}${ctx.totalPnl.toLocaleString()}`);
    } else {
      lines.push('  暂无持仓');
    }

    lines.push('');
    lines.push('【近期事件】');
    if (ctx.upcomingEvents.length) {
      for (const e of ctx.upcomingEvents.slice(0, 5)) {
        const impactStr = e.impact === 'up' ? '预期上涨' : e.impact === 'down' ? '预期下跌' : '影响不确定';
        lines.push(`  ${e.date} - ${e.title} (${impactStr}${e.magnitude ? ' ' + e.magnitude + '%' : ''})`);
      }
    } else {
      lines.push('  暂无近期事件');
    }

    lines.push('');
    lines.push(`【税费】综合税率 ${ctx.taxRate}%，卖出盈亏 = 税后到手 - 成本`);

    return lines.join('\n');
  },

  /** Export report as text file download */
  downloadReport() {
    const text = this.generateReport();
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `delta-force-report-${new Date().toISOString().slice(0,10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  },

  /** Copy report to clipboard */
  copyReport() {
    const text = this.generateReport();
    navigator.clipboard.writeText(text).then(() => {
      alert('报告已复制到剪贴板');
    }).catch(() => {
      alert('复制失败，请手动复制');
    });
  },

  /** Add chat message to UI */
  addMessage(role, text) {
    const container = document.getElementById('chatMessages');
    if (!container) return;

    const div = document.createElement('div');
    div.className = 'chat-msg ' + role;
    div.innerHTML = text.replace(/\n/g, '<br>');
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
  },

  /** Send a message to the AI API */
  async sendMessage(userText) {
    const config = Storage.getConfig();
    const apiKey = config.aiApiKey;
    if (!apiKey) {
      this.addMessage('assistant', '请先设置 API Key。在顶部 API 设置中输入你的 Key。');
      return;
    }

    this.addMessage('user', userText);

    const ctx = this.buildContext();
    const systemPrompt = `你是《三角洲行动》交易分析助手。你有以下实时数据：\n${JSON.stringify(ctx, null, 2)}\n\n请用中文回答用户关于交易策略的问题。简洁专业。`;

    const provider = config.aiProvider || 'deepseek';
    const endpoints = {
      deepseek: 'https://api.deepseek.com/chat/completions',
      openai: 'https://api.openai.com/v1/chat/completions',
      anthropic: 'https://api.anthropic.com/v1/messages'
    };

    try {
      let resp;
      if (provider === 'anthropic') {
        resp = await fetch(endpoints.anthropic, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
          body: JSON.stringify({
            model: 'claude-sonnet-4-6',
            max_tokens: 1024,
            system: systemPrompt,
            messages: [{ role: 'user', content: userText }]
          })
        });
        const data = await resp.json();
        this.addMessage('assistant', data.content[0].text);
      } else {
        resp = await fetch(endpoints[provider], {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
          body: JSON.stringify({
            model: provider === 'deepseek' ? 'deepseek-chat' : 'gpt-4o',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userText }
            ],
            max_tokens: 1024
          })
        });
        const data = await resp.json();
        this.addMessage('assistant', data.choices[0].message.content);
      }
    } catch (e) {
      this.addMessage('assistant', `API 调用失败：${e.message}`);
    }
  }
};
```

- [ ] **Step 2: Verify** — In console:
```javascript
const report = AI.generateReport();
console.log(report); // Should show report with current state
AI.addMessage('assistant', '测试消息');
// Should add a message bubble to #chatMessages
```

- [ ] **Step 3: Commit**

```bash
git add js/ai.js
git commit -m "feat: add AI analysis module

- Context builder for market data + holdings + events
- One-click analysis report generation and download
- AI chat panel with DeepSeek/OpenAI/Anthropic support
- API key stored in localStorage
- Report copy-to-clipboard

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 10: Main App Orchestration

**Files:**
- Create: `js/app.js`

Wire everything together: tab switching, data loading, auto-refresh, table rendering, modal handling, event bindings.

- [ ] **Step 1: Write `js/app.js`**

```javascript
/* global Api, Charts, Sparkline, Signals, Calendar, AI, Items, Storage */

const App = {
  _refreshTimer: null,
  _sortCol: 'change',
  _sortDir: 'desc',
  _selectedItem: null,

  /** Initialize the application */
  async init() {
    await Items.load();
    this._bindTabs();
    this._bindEvents();
    this._loadConfig();
    await this.refreshData();
    this._startAutoRefresh();
    Calendar.render();
  },

  /** Refresh all data from API */
  async refreshData() {
    try {
      document.getElementById('freshnessBadge').textContent = '更新中...';
      document.getElementById('freshnessBadge').className = 'freshness stale';

      const data = await Api.fetchPrices();
      Storage.appendPriceSnapshot(data);
      Storage.cleanOldTrades();
      Storage.cleanPriceHistory();

      this._renderDashboard(data);
      this._renderAdvice(data);
      this._renderPNL(data);

      const mins = Api.minutesSinceFetch();
      const badge = document.getElementById('freshnessBadge');
      badge.textContent = `数据更新于 ${mins} 分钟前`;
      badge.className = mins <= 11 ? 'freshness fresh' : 'freshness stale';
    } catch (e) {
      console.error('Data refresh failed:', e);
      const badge = document.getElementById('freshnessBadge');
      badge.textContent = '数据加载失败，使用缓存数据';
      badge.className = 'freshness stale';

      // Try to use cached data
      const cache = Api.getCache();
      if (cache) {
        this._renderDashboard(cache);
        this._renderAdvice(cache);
        this._renderPNL(cache);
      }
    }
  },

  // ─── Dashboard Rendering ───

  _renderDashboard(data) {
    const items = this._filterAndSort(data.items);

    // Stats
    const up = items.filter(i => i.change > 0);
    const down = items.filter(i => i.change < 0);
    const topUp = up.length ? up.reduce((a,b) => a.change > b.change ? a : b) : null;
    const topDown = down.length ? down.reduce((a,b) => a.change < b.change ? a : b) : null;
    const anomalies = Signals.detectAnomalies(data.items);

    document.getElementById('dashboardStats').innerHTML = `
      <div class="stat-card">
        <div class="label">总物品数</div>
        <div class="value">${items.length}</div>
      </div>
      <div class="stat-card">
        <div class="label">今日涨幅 Top</div>
        <div class="value" style="color:var(--green);">${topUp ? '+' + topUp.change.toFixed(1) + '%' : '--'}</div>
        <div class="sub">${topUp ? topUp.name : ''}</div>
      </div>
      <div class="stat-card">
        <div class="label">今日跌幅 Top</div>
        <div class="value" style="color:var(--red-bright);">${topDown ? topDown.change.toFixed(1) + '%' : '--'}</div>
        <div class="sub">${topDown ? topDown.name : ''}</div>
      </div>
      <div class="stat-card">
        <div class="label">异常波动</div>
        <div class="value" style="color:var(--gold);">${anomalies.length}</div>
      </div>`;

    // Table
    const tbody = document.getElementById('priceTableBody');
    tbody.innerHTML = items.map(i => `
      <tr onclick="App.showDetail('${this._esc(i.name)}')" style="cursor:pointer;">
        <td>${Items.renderName(i.name)}</td>
        <td>${Items.getCategoryName(i.category)}</td>
        <td class="num">${i.price.toLocaleString()}</td>
        <td class="num">${i.low24h.toLocaleString()}</td>
        <td class="num">${i.high24h.toLocaleString()}</td>
        <td class="num ${i.change>=0?'positive':'negative'}">${i.change>=0?'+':''}${i.change.toFixed(1)}%</td>
        <td class="center"><span class="badge" style="border:1px solid var(--red);color:var(--red);cursor:pointer;">详情</span></td>
      </tr>`).join('');
  },

  _filterAndSort(items) {
    const search = (document.getElementById('searchInput')?.value || '').toLowerCase();
    const catFilter = document.getElementById('categoryFilter')?.value || 'all';

    let filtered = items;
    if (search) filtered = filtered.filter(i => i.name.toLowerCase().includes(search));
    if (catFilter !== 'all') filtered = filtered.filter(i => i.category === catFilter || Items.getCategory(i.name) === catFilter);

    const col = this._sortCol;
    const dir = this._sortDir === 'asc' ? 1 : -1;
    filtered.sort((a, b) => {
      let va, vb;
      switch (col) {
        case 'name': va = a.name; vb = b.name; return dir * va.localeCompare(vb);
        case 'category': va = Items.getCategoryName(a.category); vb = Items.getCategoryName(b.category); return dir * va.localeCompare(vb);
        case 'low': va = a.low24h; vb = b.low24h; break;
        case 'high': va = a.high24h; vb = b.high24h; break;
        case 'change': va = a.change; vb = b.change; break;
        default: va = a.price; vb = b.price;
      }
      return dir * (va - vb);
    });

    return filtered;
  },

  showDetail(name) {
    this._selectedItem = name;
    const cache = Api.getCache();
    const item = cache ? cache.items.find(i => i.name === name) : null;
    if (!item) return;

    const panel = document.getElementById('detailPanel');
    panel.style.display = 'block';
    document.getElementById('detailTitle').innerHTML = `${Items.renderName(name)} — 价格走势`;

    const events = Storage.getEvents().filter(e => {
      return !e.relatedItems || e.relatedItems.includes(name) || e.relatedCategory === Items.getCategory(name);
    }).map(e => ({ date: e.date, title: e.title, type: e.type }));

    const history = item.history && item.history.length ? item.history : this._fakeHistory(item);
    Charts.renderPriceChart('detailChart', history, events, name);
  },

  _fakeHistory(item) {
    const now = new Date();
    const points = [];
    for (let i = 23; i >= 0; i--) {
      const t = new Date(now - i * 3600000);
      const jitter = (Math.random() - 0.5) * 0.1 * item.price;
      points.push({ t: t.toISOString(), p: Math.round(item.price + jitter + (item.change / 24) * (23 - i) * item.price / 100) });
    }
    return points;
  },

  // ─── Advice Rendering ───

  _renderAdvice(data) {
    const signals = Signals.generate(data.items);
    const buys = signals.filter(s => s.signal === 'buy').length;
    const sells = signals.filter(s => s.signal === 'sell').length;

    // Portfolio profit
    const holdings = Storage.getHoldings();
    const cfg = Storage.getConfig();
    const taxRate = ((cfg.depositRate || 3) + (cfg.feeRate || 10)) / 100;
    let totalPnl = 0;
    for (const h of holdings) {
      const item = data.items.find(i => i.name === h.name);
      if (item) totalPnl += (item.price * (1 - taxRate) - h.avgPrice) * h.qty;
    }

    document.getElementById('adviceStats').innerHTML = `
      <div class="stat-card">
        <div class="label">建议买入</div>
        <div class="value" style="color:var(--green);">${buys}</div>
      </div>
      <div class="stat-card">
        <div class="label">建议卖出</div>
        <div class="value" style="color:var(--red-bright);">${sells}</div>
      </div>
      <div class="stat-card">
        <div class="label">持仓盈利</div>
        <div class="value" style="color:${totalPnl>=0?'var(--green)':'var(--red-bright)'};">${totalPnl>=0?'+':''}${totalPnl.toLocaleString()}</div>
        <div class="sub">哈夫币</div>
      </div>`;

    const tbody = document.getElementById('signalTableBody');
    tbody.innerHTML = signals.slice(0, 20).map(s => {
      const sparkSvg = Sparkline.render(s.history, { currentPrice: s.price, forceColor: s.signal === 'buy' ? '#4ade80' : s.signal === 'sell' ? '#ff4d5a' : '#f4a261' });
      const signalBadge = s.signal === 'buy'
        ? '<span class="badge badge-buy">买入</span>'
        : s.signal === 'sell'
          ? '<span class="badge badge-sell">卖出</span>'
          : '<span class="badge badge-hold">观望</span>';
      const devClass = s.deviation > 0 ? 'negative' : s.deviation < 0 ? 'positive' : 'neutral';
      const confColor = s.signal === 'buy' ? 'var(--green)' : s.signal === 'sell' ? 'var(--red-bright)' : 'var(--gold)';

      return `
      <tr>
        <td>${Items.renderName(s.name)}</td>
        <td class="num" style="font-weight:600;">${s.price.toLocaleString()}</td>
        <td class="num">${s.avg24h.toLocaleString()}</td>
        <td><span class="sparkline-wrap">${sparkSvg}</span></td>
        <td class="num ${devClass}">${s.deviation>=0?'+':''}${s.deviation}%</td>
        <td>${signalBadge}</td>
        <td class="center" style="color:${confColor};font-weight:600;">${s.confidence}%</td>
      </tr>`;
    }).join('');
  },

  // ─── P&L Rendering ───

  _renderPNL(data) {
    const holdings = Storage.getHoldings();
    const cfg = Storage.getConfig();
    const taxRate = ((cfg.depositRate || 3) + (cfg.feeRate || 10)) / 100;

    let totalCost = 0, totalValue = 0;
    const rows = holdings.map(h => {
      const item = data.items.find(i => i.name === h.name);
      const currentPrice = item ? item.price : 0;
      const value = currentPrice * h.qty;
      const cost = h.avgPrice * h.qty;
      const postTaxPrice = Math.round(currentPrice * (1 - taxRate));
      const postTaxValue = postTaxPrice * h.qty;
      const pnlAfterTax = postTaxValue - cost;
      const pnlPct = cost > 0 ? (pnlAfterTax / cost * 100) : 0;
      totalCost += cost;
      totalValue += value;
      return { ...h, currentPrice, postTaxPrice, value, cost, postTaxValue, pnlAfterTax, pnlPct, name: h.name };
    });

    const totalPnlAfterTax = rows.reduce((s, r) => s + r.pnlAfterTax, 0);
    const totalPnlPct = totalCost > 0 ? (totalPnlAfterTax / totalCost * 100) : 0;

    document.getElementById('pnlStats').innerHTML = `
      <div class="stat-card">
        <div class="label">持仓物品</div>
        <div class="value">${holdings.length}</div>
      </div>
      <div class="stat-card">
        <div class="label">总成本</div>
        <div class="value">${totalCost.toLocaleString()}</div>
      </div>
      <div class="stat-card">
        <div class="label">当前市值</div>
        <div class="value" style="color:var(--green);">${totalValue.toLocaleString()}</div>
      </div>
      <div class="stat-card">
        <div class="label">税后浮盈</div>
        <div class="value" style="color:${totalPnlAfterTax>=0?'var(--green)':'var(--red-bright)'};">${totalPnlAfterTax>=0?'+':''}${totalPnlAfterTax.toLocaleString()}</div>
        <div class="sub" style="color:${totalPnlPct>=0?'var(--green)':'var(--red-bright)'};">${totalPnlPct>=0?'+':''}${totalPnlPct.toFixed(1)}%</div>
      </div>`;

    document.getElementById('holdingsTableBody').innerHTML = rows.map(r => `
      <tr>
        <td>${Items.renderName(r.name)}</td>
        <td class="num">${r.qty.toLocaleString()}</td>
        <td class="num">${r.avgPrice.toLocaleString()}</td>
        <td class="num">${r.cost.toLocaleString()}</td>
        <td class="num" style="font-weight:600;">${r.currentPrice.toLocaleString()}</td>
        <td class="num" style="color:var(--gold);">${r.postTaxPrice.toLocaleString()}</td>
        <td class="num ${r.pnlAfterTax>=0?'positive':'negative'}" style="font-weight:600;">${r.pnlAfterTax>=0?'+':''}${r.pnlAfterTax.toLocaleString()}<div style="font-size:10px;">${r.pnlPct>=0?'+':''}${r.pnlPct.toFixed(1)}%</div></td>
        <td class="center"><span onclick="App.quickSell('${this._esc(r.name)}')" style="color:${r.pnlAfterTax>=0?'var(--green)':'var(--red)'};cursor:pointer;font-size:12px;">卖出</span></td>
      </tr>`).join('');

    // Trade history
    const trades = Storage.getTrades();
    const taxRateTotal = ((cfg.depositRate || 3) + (cfg.feeRate || 10)) / 100;
    document.getElementById('tradeHistoryBody').innerHTML = trades.slice(0, 50).map(t => {
      const typeLabel = t.type === 'buy' ? '<span style="color:var(--green);">买入</span>' : '<span style="color:var(--red-bright);">卖出</span>';
      const pnl = t.type === 'sell' && t.pnl !== undefined
        ? `<span class="${t.pnl>=0?'positive':'negative'}" style="font-weight:600;">${t.pnl>=0?'+':''}${t.pnl.toLocaleString()}</span>`
        : '<span style="color:#888;">—</span>';
      const totalAmount = (t.price * t.qty);
      return `
      <tr>
        <td>${this._fmtDate(t.createdAt)}</td>
        <td>${typeLabel}</td>
        <td>${Items.renderName(t.name)}</td>
        <td class="num">${t.qty.toLocaleString()}</td>
        <td class="num">${t.price.toLocaleString()}</td>
        <td class="num">${totalAmount.toLocaleString()}</td>
        <td class="num">${pnl}</td>
      </tr>`;
    }).join('');

    // Break-even note
    const beNote = document.getElementById('totalTaxRate');
    if (beNote) {
      const totalTax = ((cfg.depositRate || 3) + (cfg.feeRate || 10));
      beNote.textContent = totalTax + '%';
      const beDiv = document.getElementById('taxBreakEven');
      if (beDiv) {
        const bePct = Math.round(totalTax / (1 - totalTax / 100));
        beDiv.textContent = `提醒：税费 ${totalTax}% 意味着卖出标价需高于买入价约 ${bePct}% 才能回本`;
      }
    }
  },

  quickSell(name) {
    const item = Api.getCache()?.items.find(i => i.name === name);
    const price = item ? item.price : 0;
    document.getElementById('tradeItemName').value = name;
    document.getElementById('tradePrice').value = price;
    document.getElementById('tradeType').value = 'sell';
    document.getElementById('tradeQty').value = 1;
    document.getElementById('tradeModalTitle').textContent = '记录卖出';
    document.getElementById('tradeModal').classList.add('show');
  },

  // ─── Tab Switching ───

  _bindTabs() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById('tab-' + tab).classList.add('active');

        if (tab === 'calendar') Calendar.render();
        if (tab === 'pnl' && Api.getCache()) this._renderPNL(Api.getCache());
        if (tab === 'advice' && Api.getCache()) this._renderAdvice(Api.getCache());
      });
    });
  },

  // ─── Event Bindings ───

  _bindEvents() {
    // Refresh button
    document.getElementById('refreshBtn').addEventListener('click', () => this.refreshData());

    // Search & filter
    document.getElementById('searchInput').addEventListener('input', () => {
      if (Api.getCache()) this._renderDashboard(Api.getCache());
    });
    document.getElementById('categoryFilter').addEventListener('change', () => {
      if (Api.getCache()) this._renderDashboard(Api.getCache());
    });

    // Table sorting
    document.querySelectorAll('#priceTable thead th[data-sort]').forEach(th => {
      th.addEventListener('click', () => {
        const col = th.dataset.sort;
        if (this._sortCol === col) {
          this._sortDir = this._sortDir === 'asc' ? 'desc' : 'asc';
        } else {
          this._sortCol = col;
          this._sortDir = 'desc';
        }
        if (Api.getCache()) this._renderDashboard(Api.getCache());
      });
    });

    // Detail time range buttons
    document.querySelectorAll('.time-range-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.time-range-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        if (this._selectedItem) this.showDetail(this._selectedItem);
      });
    });

    // Trade modal
    document.getElementById('addBuyBtn').addEventListener('click', () => this._openTradeModal('buy'));
    document.getElementById('addSellBtn').addEventListener('click', () => this._openTradeModal('sell'));
    document.getElementById('tradeCancel').addEventListener('click', () => {
      document.getElementById('tradeModal').classList.remove('show');
    });
    document.getElementById('tradeConfirm').addEventListener('click', () => this._confirmTrade());

    // Export / Import
    document.getElementById('exportBtn').addEventListener('click', () => this._exportData());
    document.getElementById('importBtn').addEventListener('click', () => {
      document.getElementById('importFile').click();
    });
    document.getElementById('importFile').addEventListener('change', (e) => this._importData(e));

    // Tax config
    document.getElementById('depositRate').addEventListener('input', () => this._saveTaxConfig());
    document.getElementById('feeRate').addEventListener('input', () => this._saveTaxConfig());

    // Advice config
    document.getElementById('thresholdPct').addEventListener('input', () => {
      Storage.setConfig({ thresholdPct: parseFloat(document.getElementById('thresholdPct').value) || 15 });
      if (Api.getCache()) this._renderAdvice(Api.getCache());
    });

    // Event modal
    document.getElementById('addEventBtn').addEventListener('click', () => {
      document.getElementById('eventModal').classList.add('show');
    });
    document.getElementById('eventCancel').addEventListener('click', () => {
      document.getElementById('eventModal').classList.remove('show');
    });
    document.getElementById('eventConfirm').addEventListener('click', () => this._confirmEvent());

    // Calendar nav
    document.getElementById('calPrevMonth').addEventListener('click', () => Calendar.prevMonth());
    document.getElementById('calNextMonth').addEventListener('click', () => Calendar.nextMonth());
    document.getElementById('calToday').addEventListener('click', () => Calendar.goToday());

    // AI
    document.getElementById('saveApiKey').addEventListener('click', () => {
      const provider = document.getElementById('aiProvider').value;
      const key = document.getElementById('aiApiKey').value;
      Storage.setConfig({ aiProvider: provider, aiApiKey: key });
      alert('API Key 已保存');
    });
    document.getElementById('chatSend').addEventListener('click', () => {
      const input = document.getElementById('chatInput');
      const text = input.value.trim();
      if (text) { AI.sendMessage(text); input.value = ''; }
    });
    document.getElementById('chatInput').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        document.getElementById('chatSend').click();
      }
    });
    document.getElementById('exportReportBtn').addEventListener('click', () => {
      AI.downloadReport();
    });

    // Window resize
    window.addEventListener('resize', () => Charts.resizeAll());
  },

  _openTradeModal(type) {
    document.getElementById('tradeType').value = type;
    document.getElementById('tradeModalTitle').textContent = type === 'buy' ? '记录买入' : '记录卖出';
    document.getElementById('tradeItemName').value = '';
    document.getElementById('tradeQty').value = 1;
    document.getElementById('tradePrice').value = '';
    document.getElementById('tradeModal').classList.add('show');
  },

  _confirmTrade() {
    const name = document.getElementById('tradeItemName').value.trim();
    const qty = parseInt(document.getElementById('tradeQty').value) || 1;
    const price = parseInt(document.getElementById('tradePrice').value) || 0;
    const type = document.getElementById('tradeType').value;

    if (!name || !price) { alert('请填写完整信息'); return; }

    const cfg = Storage.getConfig();
    const taxRate = ((cfg.depositRate || 3) + (cfg.feeRate || 10)) / 100;

    if (type === 'buy') {
      Storage.addHolding({ name, qty, price });
      Storage.addTrade({ type: 'buy', name, qty, price });
    } else {
      const holdings = Storage.getHoldings();
      const h = holdings.find(x => x.name === name);
      if (!h || h.qty < qty) { alert('持仓不足'); return; }

      const postTaxPrice = Math.round(price * (1 - taxRate));
      const pnl = (postTaxPrice - h.avgPrice) * qty;
      Storage.removeHolding(name, qty);
      Storage.addTrade({ type: 'sell', name, qty, price, pnl, postTaxPrice });
    }

    document.getElementById('tradeModal').classList.remove('show');
    if (Api.getCache()) this._renderPNL(Api.getCache());
  },

  _confirmEvent() {
    const date = document.getElementById('eventDate').value;
    const title = document.getElementById('eventTitle').value.trim();
    const type = document.getElementById('eventType').value;
    const desc = document.getElementById('eventDesc').value.trim();
    const impact = document.getElementById('eventImpact').value;
    const magnitude = document.getElementById('eventMagnitude').value.trim();

    if (!date || !title) { alert('请填写日期和标题'); return; }

    Storage.addEvent({ date, title, type, desc, impact, magnitude });
    document.getElementById('eventModal').classList.remove('show');
    Calendar.render();
  },

  _exportData() {
    const data = Storage.exportAll();
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `df-trading-backup-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  },

  _importData(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        Storage.importAll(data);
        alert('数据导入成功！页面将刷新。');
        location.reload();
      } catch (err) {
        alert('导入失败：' + err.message);
      }
    };
    reader.readAsText(file);
  },

  _saveTaxConfig() {
    const depositRate = parseFloat(document.getElementById('depositRate').value) || 3;
    const feeRate = parseFloat(document.getElementById('feeRate').value) || 10;
    Storage.setConfig({ depositRate, feeRate });
    if (Api.getCache()) this._renderPNL(Api.getCache());
  },

  _loadConfig() {
    const cfg = Storage.getConfig();
    document.getElementById('depositRate').value = cfg.depositRate || 3;
    document.getElementById('feeRate').value = cfg.feeRate || 10;
    document.getElementById('thresholdPct').value = cfg.thresholdPct || 15;
    document.getElementById('alertBuy').checked = cfg.alertBuy !== false;
    document.getElementById('alertSell').checked = cfg.alertSell !== false;
    document.getElementById('aiProvider').value = cfg.aiProvider || 'deepseek';
    document.getElementById('aiApiKey').value = cfg.aiApiKey || '';
  },

  _startAutoRefresh() {
    if (this._refreshTimer) clearInterval(this._refreshTimer);
    const cfg = Storage.getConfig();
    const interval = (cfg.refreshInterval || 10) * 60000;
    this._refreshTimer = setInterval(() => this.refreshData(), interval);
  },

  _fmtDate(iso) {
    try {
      const d = new Date(iso);
      return `${d.getMonth()+1}/${d.getDate()} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
    } catch (e) { return iso; }
  },

  _esc(str) { return str.replace(/'/g, "\\'").replace(/"/g, '&quot;'); }
};

// Boot
document.addEventListener('DOMContentLoaded', () => App.init());
```

- [ ] **Step 2: Verify** — Open `index.html` in browser. Should see:
  - Tab navigation working (click each tab)
  - "数据加载失败" badge (since no real API)
  - Dashboard table empty but structured
  - Calendar showing current month
  - AI panel with greeting message

- [ ] **Step 3: Commit**

```bash
git add js/app.js
git commit -m "feat: add main app orchestration

- Tab switching and data refresh cycle
- Dashboard rendering with search, filter, sort
- Advice tab with signal table and sparklines
- P&L tab with tax-aware calculations
- Trade entry modal (buy/sell)
- Event calendar integration
- AI panel wiring
- JSON export/import
- Config persistence between sessions

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 11: Integration Testing & Polish

**Files:**
- No new files — verify all existing files work together

- [ ] **Step 1: Manual integration test checklist**

Open `index.html` and verify:

1. **All 5 tabs switch correctly**, active tab highlighted with red underline
2. **Tab 1 (Dashboard)**:
   - Toolbar elements all visible (badge, search, filter dropdown, refresh button)
   - Stats cards render (showing 0/-- when no data)
   - Table has correct headers, rows render when data exists
   - Clicking sort headers toggles sort direction
   - Search filters items
   - Category dropdown filters items
3. **Tab 2 (Advice)**:
   - Stats cards show buy/sell counts, portfolio profit
   - Signal table renders with sparklines
   - Threshold input changes re-render signals
4. **Tab 3 (P&L)**:
   - Tax config bar shows deposit/fee inputs
   - Stats cards show holding count, cost, value, P&L
   - Holdings table renders with tax-aware columns
   - Trade history renders
   - "记录买入/卖出" opens modal, submitting saves to localStorage
   - Export/Import buttons work
5. **Tab 4 (Calendar)**:
   - Current month renders correctly
   - Prev/Next/Today buttons navigate
   - Clicking a date shows day events panel
   - "添加事件" opens modal, submitting adds event dot to calendar
6. **Tab 5 (AI)**:
   - API Key save works
   - Chat input sends message (fails gracefully without API key)
   - "导出分析报告" downloads a .txt file
7. **Data persistence**: Refresh page, verify holdings/trades/events/config survive
8. **Auto-refresh**: Check that badge updates every 10 minutes
9. **Responsive**: Resize browser to mobile width, verify layout doesn't break

- [ ] **Step 2: Fix any issues found during testing**

- [ ] **Step 3: Commit any fixes**

```bash
git add -A
git commit -m "fix: integration testing fixes and polish

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 12: Deployment Prep

**Files:**
- No code changes — configuration only

- [ ] **Step 1: Verify all files are committed**

```bash
git status
git log --oneline
```

- [ ] **Step 2: Deploy to Cloudflare Pages**

```bash
# Install Wrangler if not installed
npm install -g wrangler

# Login (one-time)
wrangler login

# Deploy
wrangler pages deploy . --project-name delta-force-trading
```

Or use the Cloudflare Pages dashboard: connect GitHub repo → deploy from `main` branch.

Alternative: Deploy to Vercel with `vercel .` after installing Vercel CLI.

- [ ] **Step 3: Verify deployment** — Open the deployed URL, confirm all functionality works.

- [ ] **Step 4: Commit deployment config if any**

```bash
git add -A
git commit -m "chore: add deployment configuration

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Plan Completion Checklist

After all tasks are completed:

- [ ] All 5 tabs render and function correctly
- [ ] Items display with quality colors (white/green/blue/purple/gold/red)
- [ ] Price sparklines show with time axis and min/max markers
- [ ] Trading signals factor in configurable tax rate
- [ ] P&L calculations use post-tax prices
- [ ] Event calendar renders and accepts new events
- [ ] AI panel accepts API key and sends messages
- [ ] Analysis report exports correctly
- [ ] Data persists across page reloads
- [ ] Auto-refresh runs every 10 minutes
- [ ] JSON export/import round-trips successfully
- [ ] No console errors on page load
- [ ] Deployed and accessible via public URL
