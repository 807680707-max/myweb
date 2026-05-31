/* global Storage */

const DEMO_ITEMS = {
  '9x19mm PSO':      { tier: 3, category: 'ammo' },
  '9x19mm PST':      { tier: 2, category: 'ammo' },
  '9x19mm RIP':      { tier: 1, category: 'ammo' },
  '5.56x45mm M855':  { tier: 3, category: 'ammo' },
  '5.56x45mm M855A1':{ tier: 4, category: 'ammo' },
  '5.56x45mm M995':  { tier: 6, category: 'ammo' },
  '7.62x39mm BP':    { tier: 5, category: 'ammo' },
  '7.62x39mm PS':    { tier: 3, category: 'ammo' },
  '7.62x51mm M80':   { tier: 3, category: 'ammo' },
  '7.62x51mm M61':   { tier: 5, category: 'ammo' },
  '7.62x51mm M62':   { tier: 3, category: 'ammo' },
  '7.62x54mmR SNB':  { tier: 6, category: 'ammo' },
  '7.62x54mmR LPS':  { tier: 3, category: 'ammo' },
  '.45 ACP AP':      { tier: 4, category: 'ammo' },
  '12x70mm RIP':     { tier: 1, category: 'ammo' },
  '4.6x30mm AP SX':  { tier: 5, category: 'ammo' },
  '5.7x28mm SS190':  { tier: 4, category: 'ammo' }
};

const Api = {
  baseUrl: 'https://df-api.shallow.ink',

  _cache: null,
  _lastFetchTime: null,
  _isDemo: false,

  async fetchPrices() {
    const cfg = Storage.getConfig();
    const apiKey = cfg.apiKey || '';

    // Try real API first if key is configured
    if (apiKey) {
      try {
        const data = await this._fetchReal(apiKey);
        this._isDemo = false;
        this._cache = data;
        this._lastFetchTime = new Date();
        return data;
      } catch (e) {
        console.warn('Real API failed, trying cache then demo:', e.message);
      }
    }

    // Try cache (keep existing _isDemo state)
    if (this._cache) {
      return this._cache;
    }

    // Fallback to demo
    return this.fetchDemoData();
  },

  // Items confirmed NOT in the game — will be filtered out
  _blacklist: new Set([
    '碳纤维散射箭矢', '碳纤维刺骨箭矢', '碳纤维穿甲箭矢', '玻纤柳叶箭矢',
  ]),

  /** Real API: V3 latest prices — fetch all items, filter blacklist */
  async _fetchReal(apiKey) {
    const cfg = Storage.getConfig();
    const clientID = cfg.clientID || '';
    const headers = {
      'Accept': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    };
    if (clientID) headers['X-Client-ID'] = clientID;

    const url = `${this.baseUrl}/df/object/price/latest/v3?type=ammo&limit=200`;
    const resp = await fetch(url, { cache: 'no-cache', headers });

    if (!resp.ok) {
      throw new Error(`API HTTP ${resp.status}`);
    }

    // Merge collector data (if running) into localStorage history
    await this._syncCollectorHistory();

    const raw = await resp.json();
    let items = this._normalizeV3(raw, 'ammo');

    // Filter blacklisted items
    const before = items.length;
    items = items.filter(it => !this._blacklist.has(it.name));
    if (before !== items.length) {
      console.log(`[API] filtered ${before - items.length} blacklisted items, ${items.length} remaining`);
    }

    // Log all item names grouped by secondClass so user can verify
    const byCaliber = {};
    for (const it of items) {
      const cal = it.category || 'other';
      if (!byCaliber[cal]) byCaliber[cal] = [];
      byCaliber[cal].push(it.name);
    }
    console.log('[API] All items by category:', byCaliber);

    // Log a few sample items with raw API data for price verification
    const sample = items.slice(0, 5);
    console.log('[API] Sample prices:', sample.map(it => ({
      name: it.name,
      price: it.price,
      low24h: it.low24h,
      high24h: it.high24h,
      change: it.change
    })));

    return {
      items,
      updatedAt: new Date().toISOString()
    };
  },

  // Track if we've synced collector data this session
  _collectorSynced: false,

  /** Merge data from background collector (collector.js → data/price_history.json) */
  async _syncCollectorHistory() {
    if (this._collectorSynced) return;
    try {
      const resp = await fetch('data/price_history.json', { cache: 'no-cache' });
      if (!resp.ok) return;
      const collectorData = await resp.json();
      const localHistory = Storage.getPriceHistory();
      let merged = 0;
      const now = Date.now();
      const DAY_MS = 86400000;

      for (const [name, pts] of Object.entries(collectorData)) {
        if (!Array.isArray(pts) || !pts.length) continue;
        if (!localHistory[name]) localHistory[name] = [];
        const existingTs = new Set(localHistory[name].map(p => p.t));
        for (const pt of pts) {
          if (!existingTs.has(pt.t) && (now - new Date(pt.t).getTime()) < DAY_MS) {
            localHistory[name].push({ t: pt.t, p: pt.p });
            merged++;
          }
        }
      }

      if (merged > 0) {
        Storage._set('df_price_history', localHistory);
        console.log(`[API] merged ${merged} collector data points into localStorage`);
      }
    } catch (e) {
      // collector file not found or not running — ignore
    }
    this._collectorSynced = true;
  },

  /** Fetch 1-day history to compute real 24h min/max/change */
  async _enrich24h(items, apiKey) {
    try {
      const url = `${this.baseUrl}/df/object/price/history/v3?type=ammo&days=1`;
      const resp = await fetch(url, {
        headers: { 'Accept': 'application/json', 'Authorization': `Bearer ${apiKey}` }
      });
      if (!resp.ok) { console.warn('[enrich] history API returned', resp.status); return; }

      const raw = await resp.json();
      const src = raw.data?.items || raw.data?.history || raw.data || [];
      if (!Array.isArray(src)) { console.warn('[enrich] unexpected format'); return; }

      // Build name → price history map
      const histMap = {};
      for (const h of src) {
        const name = h.objectName || h.itemName || '';
        const points = h.prices || h.history || [];
        if (name && points.length) {
          histMap[name] = points.map(p => p.price || p.latestPrice || p.avgPrice || 0).filter(v => v > 0);
        }
      }

      // Apply to items
      for (const item of items) {
        const prices = histMap[item.name];
        if (prices && prices.length >= 2) {
          item.low24h = Math.round(Math.min(...prices));
          item.high24h = Math.round(Math.max(...prices));
          const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
          item.change = parseFloat(((item.price - avg) / avg * 100).toFixed(1));
        }
      }
      console.log(`[enrich] updated ${items.filter(i => i.change !== 0).length}/${items.length} items with 24h stats`);
    } catch (e) {
      console.warn('[enrich] failed:', e.message);
    }
  },

  /** Generate demo data when no real API available */
  async fetchDemoData() {
    const items = [];
    const now = new Date();

    for (const [name, info] of Object.entries(DEMO_ITEMS)) {
      const basePrice = this._demoBasePrice(name, info.tier);
      const jitter = () => (Math.random() - 0.5) * 0.3;
      const price = Math.round(basePrice * (1 + jitter()));
      const low24h = Math.round(price * (1 - Math.random() * 0.25));
      const high24h = Math.round(price * (1 + Math.random() * 0.25));
      const change = parseFloat(((price - (high24h + low24h) / 2) / ((high24h + low24h) / 2) * 100).toFixed(1));

      const history = [];
      for (let i = 23; i >= 0; i--) {
        const t = new Date(now - i * 3600000);
        const hp = Math.round(basePrice * (1 + (Math.random() - 0.5) * 0.4));
        history.push({ t: t.toISOString(), p: hp });
      }

      items.push({
        name,
        price,
        low24h,
        high24h,
        change,
        history,
        category: info.category || 'other',
        tier: info.tier || 1,
        basePrice
      });
    }

    const result = { items, updatedAt: now.toISOString() };
    this._cache = result;
    this._lastFetchTime = new Date();
    this._isDemo = true;
    return result;
  },

  _demoBasePrice(name, tier) {
    return [0, 200, 500, 1500, 4000, 10000, 25000][tier] || 1000;
  },

  /** Normalize V3 API response, merging with localStorage price history */
  _normalizeV3(raw, defaultType) {
    const items = [];
    const data = raw.data || raw;
    const source = data.items || data.data || [];
    if (!Array.isArray(source)) return items;

    const localHistory = Storage.getPriceHistory();
    const now = Date.now();
    const DAY_MS = 86400000;

    for (const it of source) {
      const name = it.objectName || it.itemName || it.name || '';
      const price = it.latestPrice || it.currentPrice || it.price || it.sellPrice || 0;

      // Tier from ammoLevel (if present) or grade
      let tier = 1;
      if (it.ammoLevel) {
        tier = parseInt(it.ammoLevel) || 1;
      } else if (it.grade) {
        tier = parseInt(it.grade) || 1;
      }

      // Merge with localStorage history
      const saved = localHistory[name] || [];
      // Filter to last 24h
      const recent24h = saved.filter(p => (now - new Date(p.t).getTime()) < DAY_MS);
      recent24h.push({ t: new Date().toISOString(), p: Math.round(price) });
      localHistory[name] = recent24h;

      let low24h, high24h, change;
      if (recent24h.length >= 3) {
        const vals = recent24h.map(p => p.p);
        low24h = Math.round(Math.min(...vals));
        high24h = Math.round(Math.max(...vals));
        const first = recent24h[0].p;
        change = first > 0 ? parseFloat(((price - first) / first * 100).toFixed(1)) : 0;
      } else {
        low24h = Math.round(price * 0.90);
        high24h = Math.round(price * 1.10);
        change = 0;
      }

      items.push({
        name,
        price: Math.round(price),
        low24h,
        high24h,
        change,
        history: recent24h,
        category: it.dataType || it.type || it.category || defaultType || 'other',
        tier,
        basePrice: 0
      });
    }

    // Save accumulated history back
    Storage._set('df_price_history', localHistory);

    return items;
  },

  _normalize(raw) {
    const items = [];
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

  getCache() { return this._cache; },

  isDemo() { return this._isDemo; },

  minutesSinceFetch() {
    if (!this._lastFetchTime) return Infinity;
    return Math.round((Date.now() - this._lastFetchTime.getTime()) / 60000);
  },

  needsRefresh(intervalMin = 10) {
    return this.minutesSinceFetch() >= intervalMin;
  }
};
