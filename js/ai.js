/* global Storage, Api */

const AI = {
  _messages: [],

  buildContext() {
    const cache = Api.getCache();
    const holdings = Storage.getHoldings();
    const config = Storage.getConfig();
    const events = Storage.getEvents();
    const upcomingEvents = events.filter(e => new Date(e.date) >= new Date());

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

  copyReport() {
    const text = this.generateReport();
    navigator.clipboard.writeText(text).then(() => {
      alert('报告已复制到剪贴板');
    }).catch(() => {
      alert('复制失败，请手动复制');
    });
  },

  addMessage(role, text) {
    const container = document.getElementById('chatMessages');
    if (!container) return;

    const div = document.createElement('div');
    div.className = 'chat-msg ' + role;
    div.innerHTML = text.replace(/\n/g, '<br>');
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
  },

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
