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

  getTier(name) {
    const entry = this._data && this._data.items && this._data.items[name];
    return entry ? entry.tier : 1;
  },

  getColor(name) {
    const tier = this.getTier(name);
    return (this._data && this._data.tierColors && this._data.tierColors[tier]) || '#c0c0c0';
  },

  getTierName(name) {
    const tier = this.getTier(name);
    return (this._data && this._data.tierNames && this._data.tierNames[tier]) || '';
  },

  getCategory(name) {
    const entry = this._data && this._data.items && this._data.items[name];
    return entry ? entry.category : 'other';
  },

  getCategoryName(cat) {
    const map = { ammo: '弹药', keycard: '钥匙卡', attachment: '配件', equipment: '装备', other: '其他' };
    return map[cat] || cat;
  },

  renderName(name) {
    const color = this.getColor(name);
    const tier = this.getTier(name);
    const tierName = this.getTierName(name);
    const dot = `<span class="tier-dot" style="background:${color};"></span>`;
    const label = tier > 1 ? `<span class="badge" style="background:${color}22;color:${color};margin-left:4px;">${tier}级${tierName ? ' '+tierName : ''}</span>` : '';
    return `${dot}<span style="color:${color};font-weight:700;">${name}</span>${label}`;
  }
};
