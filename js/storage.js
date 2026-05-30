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
      apiKey: '',
      clientID: '',
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
