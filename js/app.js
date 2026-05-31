/* global Api, Charts, Sparkline, Signals, Calendar, AI, Items, Storage */

const App = {
  _refreshTimer: null,
  _sortCol: 'change',
  _sortDir: 'desc',
  _selectedItem: null,

  async init() {
    try {
      Storage._migrate();
      await Items.load();
      this._bindTabs();
      this._bindEvents();
      this._loadConfig();
      await this.refreshData();
      this._startAutoRefresh();
      Calendar.initEvents();
      Calendar.render();
    } catch (e) {
      console.error('App init failed:', e);
      const badge = document.getElementById('freshnessBadge');
      if (badge) { badge.textContent = '错误: ' + e.message; badge.className = 'freshness stale'; }
      try {
        const data = await Api.fetchDemoData();
        this._renderDashboard(data);
        this._renderAdvice(data);
        this._renderPNL(data);
      } catch (e2) { /* silent */ }
    }
  },

  async refreshData() {
    try {
      const badge = document.getElementById('freshnessBadge');
      badge.textContent = '更新中...';
      badge.className = 'freshness stale';

      const data = await Api.fetchPrices();
      Storage.appendPriceSnapshot(data);
      Storage.cleanOldTrades();
      Storage.cleanPriceHistory();

      this._renderDashboard(data);
      this._renderAdvice(data);
      this._renderPNL(data);

      // Count data points collected in 24h
      const history = Storage.getPriceHistory();
      let totalPoints = 0, itemsWithData = 0;
      const DAY_MS = 86400000;
      const now = Date.now();
      for (const [name, pts] of Object.entries(history)) {
        const recent = pts.filter(p => (now - new Date(p.t).getTime()) < DAY_MS);
        if (recent.length > 0) { itemsWithData++; totalPoints += recent.length; }
      }

      const mins = Api.minutesSinceFetch();
      const itemCount = data.items ? data.items.length : 0;
      if (Api.isDemo()) {
        badge.textContent = `演示模式 · ${itemCount}件物品`;
        badge.className = 'freshness stale';
      } else {
        const avgPts = itemsWithData > 0 ? Math.round(totalPoints / itemsWithData) : 0;
        badge.textContent = `实时数据 · ${mins}分前 · ${itemCount}件 · 均${avgPts}个数据点`;
        badge.className = mins <= 3 ? 'freshness fresh' : 'freshness stale';
      }

      // Reset countdown
      this._nextRefreshIn = (Storage.getConfig().refreshInterval || 2) * 60;
      this._updateCountdown();
    } catch (e) {
      console.error('Data refresh failed:', e);
      const badge = document.getElementById('freshnessBadge');
      badge.textContent = '数据加载失败';
      badge.className = 'freshness stale';
    }
  },

  _renderDashboard(data) {
    const items = this._filterAndSort(data.items);

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

  _renderAdvice(data) {
    const signals = Signals.generate(data.items);
    const buys = signals.filter(s => s.signal === 'buy').length;
    const sells = signals.filter(s => s.signal === 'sell').length;

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

    const trades = Storage.getTrades();
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

    const beNote = document.getElementById('totalTaxRate');
    if (beNote) {
      const totalTax = ((cfg.depositRate || 3) + (cfg.feeRate || 10));
      beNote.textContent = totalTax + '%';
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

  _bindTabs() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;
        document.querySelectorAll('.tab-btn').forEach(b => { b.classList.remove('active'); b.setAttribute('aria-selected', 'false'); });
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        btn.classList.add('active');
        btn.setAttribute('aria-selected', 'true');
        document.getElementById('tab-' + tab).classList.add('active');

        if (tab === 'calendar') Calendar.render();
        if (tab === 'pnl' && Api.getCache()) this._renderPNL(Api.getCache());
        if (tab === 'advice' && Api.getCache()) this._renderAdvice(Api.getCache());

        // Resize charts when switching to dashboard tab
        if (tab === 'dashboard') Charts.resizeAll();
      });
    });
  },

  _bindEvents() {
    document.getElementById('refreshBtn').addEventListener('click', () => this.refreshData());

    const apiKeyEl = document.getElementById('apiKeyInput');
    if (apiKeyEl) {
      apiKeyEl.addEventListener('input', () => this._saveApiKey());
    }

    document.getElementById('searchInput').addEventListener('input', () => {
      if (Api.getCache()) this._renderDashboard(Api.getCache());
    });
    document.getElementById('categoryFilter').addEventListener('change', () => {
      if (Api.getCache()) this._renderDashboard(Api.getCache());
    });

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

    document.querySelectorAll('.time-range-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.time-range-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        if (this._selectedItem) this.showDetail(this._selectedItem);
      });
    });

    document.getElementById('addBuyBtn').addEventListener('click', () => this._openTradeModal('buy'));
    document.getElementById('addSellBtn').addEventListener('click', () => this._openTradeModal('sell'));
    document.getElementById('tradeCancel').addEventListener('click', () => {
      document.getElementById('tradeModal').classList.remove('show');
    });
    document.getElementById('tradeConfirm').addEventListener('click', () => this._confirmTrade());

    document.getElementById('exportBtn').addEventListener('click', () => this._exportData());
    document.getElementById('importBtn').addEventListener('click', () => {
      document.getElementById('importFile').click();
    });
    document.getElementById('importFile').addEventListener('change', (e) => this._importData(e));

    document.getElementById('depositRate').addEventListener('input', () => this._saveTaxConfig());
    document.getElementById('feeRate').addEventListener('input', () => this._saveTaxConfig());

    document.getElementById('thresholdPct').addEventListener('input', () => {
      Storage.setConfig({ thresholdPct: parseFloat(document.getElementById('thresholdPct').value) || 15 });
      if (Api.getCache()) this._renderAdvice(Api.getCache());
    });

    document.getElementById('addEventBtn').addEventListener('click', () => {
      document.getElementById('eventModal').classList.add('show');
    });
    document.getElementById('eventCancel').addEventListener('click', () => {
      document.getElementById('eventModal').classList.remove('show');
    });
    document.getElementById('eventConfirm').addEventListener('click', () => this._confirmEvent());

    document.getElementById('resetEventsBtn').addEventListener('click', () => {
      if (confirm('确定重置所有事件？将清空现有事件并重新生成预设。')) {
        Calendar.initEvents(true);
        Calendar.render();
        document.getElementById('dayEventsPanel').style.display = 'none';
      }
    });
    document.getElementById('calPrevMonth').addEventListener('click', () => Calendar.prevMonth());
    document.getElementById('calNextMonth').addEventListener('click', () => Calendar.nextMonth());
    document.getElementById('calToday').addEventListener('click', () => Calendar.goToday());

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
    const apiKeyEl = document.getElementById('apiKeyInput');
    if (apiKeyEl) apiKeyEl.value = cfg.apiKey || '';
  },

  _saveApiKey() {
    const el = document.getElementById('apiKeyInput');
    if (!el) return;
    Storage.setConfig({ apiKey: el.value.trim() });
    // Debounce refresh to avoid rapid calls while typing
    clearTimeout(this._apiKeyTimer);
    this._apiKeyTimer = setTimeout(() => this.refreshData(), 600);
  },

  _startAutoRefresh() {
    if (this._refreshTimer) clearInterval(this._refreshTimer);
    const cfg = Storage.getConfig();
    const interval = (cfg.refreshInterval || 2) * 60000;
    this._nextRefreshIn = (cfg.refreshInterval || 2) * 60;
    this._updateCountdown();
    this._refreshTimer = setInterval(() => this.refreshData(), interval);
    // Countdown tick every second
    this._countdownTimer = setInterval(() => {
      if (this._nextRefreshIn > 0) {
        this._nextRefreshIn--;
        this._updateCountdown();
      }
    }, 1000);
  },

  _updateCountdown() {
    const el = document.getElementById('countdownBadge');
    if (!el) return;
    const m = Math.floor(this._nextRefreshIn / 60);
    const s = this._nextRefreshIn % 60;
    el.textContent = `下次刷新 ${m}:${String(s).padStart(2,'0')}`;
  },

  _fmtDate(iso) {
    try {
      const d = new Date(iso);
      return `${d.getMonth()+1}/${d.getDate()} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
    } catch (e) { return iso; }
  },

  _esc(str) { return str.replace(/'/g, "\\'").replace(/"/g, '&quot;'); }
};

document.addEventListener('DOMContentLoaded', () => App.init());
