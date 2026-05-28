/* global Storage */

const Signals = {
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
        const holding = holdings.find(h => h.name === item.name);
        const postTaxPrice = current * (1 - taxRate);
        if (holding && postTaxPrice > holding.avgPrice) {
          signal = 'sell';
          confidence = Math.min(95, 50 + Math.round((absDev - threshold) * 2));
        } else if (holding) {
          signal = 'hold';
          confidence = Math.round((absDev / threshold) * 40);
        } else {
          signal = 'sell';
          confidence = Math.min(80, 50 + Math.round((absDev - threshold) * 1.5));
        }
      }

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

    const priority = { sell: 0, buy: 1, hold: 2 };
    results.sort((a, b) => {
      if (a.signal !== b.signal) return priority[a.signal] - priority[b.signal];
      return Math.abs(b.deviation) - Math.abs(a.deviation);
    });

    return results;
  },

  _calcAvg(history) {
    if (!history || !history.length) return 0;
    const sum = history.reduce((s, h) => s + h.p, 0);
    return sum / history.length;
  },

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
