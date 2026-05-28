/* global Storage */

const Api = {
  baseUrl: 'https://delta-force-api.example.com/api/prices',

  _cache: null,
  _lastFetchTime: null,

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

  minutesSinceFetch() {
    if (!this._lastFetchTime) return Infinity;
    return Math.round((Date.now() - this._lastFetchTime.getTime()) / 60000);
  },

  needsRefresh(intervalMin = 10) {
    return this.minutesSinceFetch() >= intervalMin;
  }
};
