/* global echarts */

const Charts = {
  _instances: {},

  renderPriceChart(domId, history, events, itemName) {
    const dom = document.getElementById(domId);
    if (!dom) return;

    if (this._instances[domId]) {
      this._instances[domId].dispose();
    }

    const chart = echarts.init(dom);
    this._instances[domId] = chart;

    const times = history.map(h => h.t);
    const prices = history.map(h => h.p);

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

  resizeAll() {
    Object.values(this._instances).forEach(c => c.resize());
  },

  disposeAll() {
    Object.values(this._instances).forEach(c => c.dispose());
    this._instances = {};
  }
};
