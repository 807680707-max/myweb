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

  /** Real API: V3 latest prices for ammo */
  async _fetchReal(apiKey) {
    const types = ['ammo'];  // Primary focus; add more types as needed
    const allItems = [];

    for (const type of types) {
      try {
        const url = `${this.baseUrl}/df/object/price/latest/v3?type=${type}&limit=500`;
        const resp = await fetch(url, {
          cache: 'no-cache',
          headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          }
        });
        if (!resp.ok) continue;
        const raw = await resp.json();
        const items = this._normalizeV3(raw, type);
        allItems.push(...items);
      } catch (e) {
        console.warn(`Failed to fetch ${type}:`, e.message);
      }
    }

    if (!allItems.length) throw new Error('All type queries returned empty');

    return {
      items: allItems,
      updatedAt: new Date().toISOString()
    };
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

  /** Normalize V3 API response */
  _normalizeV3(raw, defaultType) {
    const items = [];
    // V3 response: { success: true, data: { items: [...], total: N } }
    const data = raw.data || raw;
    const source = data.items || data.data || data || [];
    if (!Array.isArray(source)) return items;

    for (const it of source) {
      const name = it.itemName || it.name || it.objectName || '';
      const price = it.currentPrice || it.price || it.sellPrice || 0;
      const low24h = it.minPrice24h || it.lowPrice || it.low || price;
      const high24h = it.maxPrice24h || it.highPrice || it.high || price;
      const change = it.changePercent || it.change || it.change24h || 0;

      // Parse tier from ammoLevel or tier field
      let tier = 1;
      if (it.ammoLevel) {
        tier = parseInt(it.ammoLevel) || 1;
      } else if (it.tier) {
        tier = parseInt(it.tier) || 1;
      } else if (it.quality) {
        tier = parseInt(it.quality) || 1;
      }

      const category = it.type || it.category || defaultType || 'other';
      const basePrice = it.basePrice || it.originalPrice || 0;

      items.push({
        name,
        price: Math.round(price),
        low24h: Math.round(low24h),
        high24h: Math.round(high24h),
        change: parseFloat(change) || 0,
        history: it.priceHistory || it.history || [],
        category,
        tier,
        basePrice
      });
    }

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
