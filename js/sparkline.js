const Sparkline = {
  WIDTH: 260,
  HEIGHT: 80,
  MARGIN_LEFT: 42,
  MARGIN_RIGHT: 4,
  MARGIN_TOP: 14,
  MARGIN_BOTTOM: 18,
  CHART_W: 214,
  CHART_H: 48,

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

    const toY = (p) => MT + CH - ((p - min) / range) * CH;
    const toX = (i) => ML + (i / (points.length - 1)) * CW;

    const linePoints = points.map((pt, i) => `${toX(i).toFixed(1)},${toY(pt.p).toFixed(1)}`).join(' ');

    let minIdx = 0, maxIdx = 0;
    for (let i = 1; i < points.length; i++) {
      if (points[i].p < points[minIdx].p) minIdx = i;
      if (points[i].p > points[maxIdx].p) maxIdx = i;
    }

    const timeLabels = this._timeLabels(points);
    const yMid = min + range / 2;
    const yMidY = toY(yMid);
    const currentY = toY(current);

    const gradId = 'sg' + Math.random().toString(36).slice(2, 8);

    const firstP = points[0].p;
    const lastP = points[points.length - 1].p;
    const trendColor = lastP >= firstP ? (opts.upColor || '#ff4d5a') : (opts.downColor || '#4ade80');
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
