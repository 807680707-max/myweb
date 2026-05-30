/* global Storage */

// --- 每周循环事件模板（每次 initEvents 自动生成未来4周） ---
const WEEKLY_CYCLE = [
  { title: '📢 周三公告：周末品枪预告', type: 'update', dayOffset: 3, impact: 'neutral', magnitude: '',
    desc: '官方公布本周末品鉴武器，立即查看公告→针对性囤对应口径子弹' },
  { title: '💰 周四低价建仓日', type: 'restock', dayOffset: 4, impact: 'down', magnitude: '5-10',
    desc: '需求冰点，弹药价格低谷。最佳建仓窗口：大量买入品枪对应口径3-5级弹' },
  { title: '🔫 周末品枪开启', type: 'weapon', dayOffset: 5, impact: 'up', magnitude: '30-60',
    desc: '指定武器配件+子弹周末暴涨。4级弹涨40-60%，5级弹涨30-50%，配件翻倍。出货好时机！' },
  { title: '📉 周一价格回落', type: 'restock', dayOffset: 1, impact: 'down', magnitude: '10-20',
    desc: '周末囤货党抛售，价格快速回落。刚需可少量补货，不宜大量买入' },
  { title: '🛒 周二低价观望', type: 'restock', dayOffset: 2, impact: 'down', magnitude: '5-10',
    desc: '价格继续低迷，等待周三公告后再决定建仓方向' },
  { title: '🌙 凌晨扫货窗口（每日0:00-3:00）', type: 'restock', dayOffset: 0, impact: 'down', magnitude: '3-8',
    desc: '官方凌晨补货，低价子弹最密集时段。设置低价订单，睡前挂单，醒来收货' },
];

// --- 固定日期事件模板 ---
const PRESET_EVENTS = [
  // ===== 赛季 =====
  { title: '🏁 S8 赛季·蝶变 结束', type: 'season', impact: 'neutral', magnitude: '',
    desc: '赛季结算，段位奖励发放。玩家抛售库存变现，高端装备价格下跌。提前清仓高价值物品' },
  { title: '🚀 S9 赛季开启', type: 'season', impact: 'up', magnitude: '10-25',
    desc: '新赛季大量玩家回归。通行证上线、新武器加入。弹药+配件需求暴涨。金弹可能突破5000/发' },
  { title: '🔄 S9 赛季中期更新', type: 'update', impact: 'up', magnitude: '5-10',
    desc: '平衡性调整：META武器变化。关注被加强的枪械→对应口径子弹涨价。被削弱武器子弹下跌' },
  { title: '⚡ 猛攻节活动', type: 'holiday', impact: 'down', magnitude: '20-40',
    desc: '官方大量发放定制券→四级弹可能跌至1500以下。物价腰斩！最佳抄底时机，大量囤货' },

  // ===== 节假日 =====
  { title: '🎋 端午节活动', type: 'holiday', impact: 'up', magnitude: '5-10',
    desc: '限时任务+节日礼包。玩家活跃度上升，中高端弹药需求增加。囤金弹待涨' },
  { title: '☀️ 暑假活动开启', type: 'holiday', impact: 'up', magnitude: '5-15',
    desc: '学生玩家大量回归，在线人数高峰。中低端弹药（3-4级）交易量暴增，可囤货待涨' },
  { title: '💕 七夕限时活动', type: 'holiday', impact: 'up', magnitude: '3-5',
    desc: '限时皮肤+联动道具上架。带动交易行整体活跃度，部分限定物品短期炒作' },
  { title: '🏮 中秋国庆双节大活动', type: 'holiday', impact: 'up', magnitude: '10-20',
    desc: '全年最大活动之一！官方海量福利+限时道具。全品类需求旺盛，交易量全年峰值' },
  { title: '🎃 万圣节活动', type: 'holiday', impact: 'up', magnitude: '3-8',
    desc: '限时模式+主题皮肤。高端弹药小幅上涨，节日限定物品短期溢价' },
  { title: '🛍️ 双十一促销', type: 'holiday', impact: 'down', magnitude: '5-15',
    desc: '官方可能推出优惠礼包→供给增加→物价短期下跌。关注官方充值/礼包活动' },
  { title: '🎄 圣诞元旦双节', type: 'holiday', impact: 'up', magnitude: '10-20',
    desc: '年末大活动！玩家活跃度全年最高。全品类需求旺盛，金弹5000+，满改枪100万+' },

  // ===== 武器平衡 =====
  { title: '⚖️ 季度武器平衡调整', type: 'weapon', impact: 'up', magnitude: '5-15',
    desc: '版本META洗牌。被加强的枪对应口径子弹涨价（如VSS加强→9x39mm涨），被削弱武器子弹跌' },
  { title: '⚖️ 赛季中武器平衡', type: 'weapon', impact: 'up', magnitude: '3-10',
    desc: '小幅平衡调整。关注官方公告中的武器改动列表，提前布局对应弹药' },

  // ===== 官方补货 =====
  { title: '📦 月末官方物资投放', type: 'restock', impact: 'down', magnitude: '5-10',
    desc: '官方定期向市场注入高级物资。高等级甲/配件供给增加→价格回调。短期观望' },
  { title: '📦 月中补给更新', type: 'restock', impact: 'down', magnitude: '3-5',
    desc: '小规模物资补给。部分热门物品价格小幅回落，可捡漏' },

  // ===== 爆率/机制 =====
  { title: '🎲 爆率调整窗口', type: 'update', impact: 'neutral', magnitude: '',
    desc: '官方可能暗改核心物资爆率。关注社区反馈：若爆率上调→物价跌；爆率下调→物价涨' },
  { title: '🎲 爆率调整窗口', type: 'update', impact: 'neutral', magnitude: '',
    desc: '关注交易行挂牌量异常变化。挂牌量突增=爆率上调；挂牌量骤减=爆率下调或有人在囤货' },

  // ===== 任务驱动 =====
  { title: '📋 主线任务更新', type: 'update', impact: 'up', magnitude: '5-20',
    desc: '新主线强制需求可能将冷门物资瞬间抬价（如M249枪管炒至14万）。关注任务物品列表' },
  { title: '📋 赛季任务刷新', type: 'update', impact: 'up', magnitude: '3-10',
    desc: '新赛季任务链可能导致特定物品需求激增。提前囤积任务相关物品获利' },

  // ===== 赛事 =====
  { title: '🏆 赛季锦标赛', type: 'weapon', impact: 'up', magnitude: '5-15',
    desc: '冠军选手武器选择影响市场。冠军用MK47→7.62x39子弹涨4000→5000。关注meta武器' },

  // ===== 每日节奏（作为提示事件） =====
  { title: '🔔 每日交易节奏提醒', type: 'other', impact: 'neutral', magnitude: '',
    desc: '凌晨0-3点：官方补货低价窗口 | 上午：价格较低 | 下午-晚间：玩家在线高峰价格走高 | 深夜：出货收尾' },
];

// ===== 日期计算 =====
function buildEventDates() {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const fmt = (year, month, day) =>
    `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  // Generate events for specific weekday in next N weeks
  const weeklyDates = [];
  for (let weekOffset = 0; weekOffset < 4; weekOffset++) {
    for (const tmpl of WEEKLY_CYCLE) {
      // Monday = day 1 start of week
      const d = new Date(now);
      d.setDate(d.getDate() + weekOffset * 7);
      // Find target weekday in this week
      const currDow = d.getDay(); // 0=Sun
      const targetDow = tmpl.dayOffset;
      const dayDiff = (targetDow - currDow + 7) % 7;
      d.setDate(d.getDate() + dayDiff);
      // Ensure it's in the future
      if (d >= now) {
        weeklyDates.push({
          date: d.toISOString().slice(0, 10),
          title: tmpl.title,
          type: tmpl.type,
          impact: tmpl.impact,
          magnitude: tmpl.magnitude,
          desc: tmpl.desc
        });
      }
    }
  }

  // Fixed dates
  const fixedDates = [
    { date: '2026-05-15' }, { date: '2026-05-22' },
    { date: '2026-07-10' }, { date: '2026-08-07' }, { date: '2026-08-14' },
    { date: '2026-05-31' }, { date: '2026-07-01' }, { date: '2026-08-29' },
    { date: '2026-09-24' }, { date: '2026-09-27' }, { date: '2026-10-31' },
    { date: '2026-11-11' }, { date: '2026-12-24' },
    { date: '2026-06-20' },
    { date: '2026-07-10' }, { date: '2026-10-10' },
    { date: fmt(y, m, new Date(y, m + 1, 0).getDate()) },
    { date: fmt(y, m + 1, new Date(y, m + 2, 0).getDate()) },
    { date: fmt(y, m + 2, new Date(y, m + 3, 0).getDate()) },
    { date: fmt(y, m + 3, new Date(y, m + 4, 0).getDate()) },
    { date: fmt(y, m, 15) }, { date: fmt(y, m + 1, 15) },
    { date: fmt(y, m + 2, 15) }, { date: fmt(y, m + 3, 15) },
    { date: '2026-05-25' }, { date: '2026-07-15' },
    { date: '2026-07-25' },
    { date: fmt(y, m, 1) }, { date: fmt(y, m + 1, 1) },
    { date: fmt(y, m + 2, 1) }, { date: fmt(y, m + 3, 1) },
  ];

  return { weeklyDates, fixedDates };
}

const Calendar = {
  _year: new Date().getFullYear(),
  _month: new Date().getMonth(),
  _selectedDate: null,

  /** Auto-populate calendar with preset events */
  initEvents(force = false) {
    const existing = Storage.getEvents();
    const hasUpcoming = existing.some(e => new Date(e.date) >= new Date());
    if (force || !hasUpcoming) {
      // Remove old auto-generated events (keep user-added ones? No, just reset all)
      if (force) {
        const all = Storage.getEvents();
        all.forEach(e => Storage.deleteEvent(e.id));
      }

      const { weeklyDates, fixedDates } = buildEventDates();

      // Add weekly cycle events
      for (const evt of weeklyDates) {
        Storage.addEvent(evt);
      }

      // Add fixed events
      for (let i = 0; i < PRESET_EVENTS.length; i++) {
        const dateInfo = fixedDates[i] || fixedDates[fixedDates.length - 1];
        Storage.addEvent({
          date: dateInfo.date,
          title: PRESET_EVENTS[i].title,
          type: PRESET_EVENTS[i].type,
          impact: PRESET_EVENTS[i].impact,
          magnitude: PRESET_EVENTS[i].magnitude,
          desc: PRESET_EVENTS[i].desc
        });
      }
    }
  },

  render() {
    const grid = document.getElementById('calendarGrid');
    if (!grid) return;

    const events = Storage.getEvents();
    const today = new Date();
    const firstDay = new Date(this._year, this._month, 1);
    const lastDay = new Date(this._year, this._month + 1, 0);
    const startDow = firstDay.getDay();

    document.getElementById('calMonthLabel').textContent =
      `${this._year}年 ${this._month + 1}月`;

    const dayHeaders = ['日', '一', '二', '三', '四', '五', '六'];
    let html = dayHeaders.map(d => `<div class="calendar-day-header">${d}</div>`).join('');

    const prevLast = new Date(this._year, this._month, 0).getDate();
    for (let i = startDow - 1; i >= 0; i--) {
      const d = prevLast - i;
      html += this._dayCell(d, true, events, today);
    }

    for (let d = 1; d <= lastDay.getDate(); d++) {
      html += this._dayCell(d, false, events, today);
    }

    const totalCells = startDow + lastDay.getDate();
    const remaining = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
    for (let d = 1; d <= remaining; d++) {
      html += this._dayCell(d, true, events, today);
    }

    grid.innerHTML = html;
  },

  _dayCell(day, isOtherMonth, events, today) {
    const dateStr = `${this._year}-${String(this._month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dayEvents = events.filter(e => e.date && e.date.startsWith(dateStr));
    const isToday = !isOtherMonth && today.getFullYear() === this._year &&
                    today.getMonth() === this._month && today.getDate() === day;
    const isSelected = this._selectedDate === dateStr;

    let cls = 'calendar-day';
    if (isOtherMonth) cls += ' other-month';
    if (isToday) cls += ' today';
    if (isSelected) cls += ' selected';

    const dots = dayEvents.map(e => {
      const isPast = new Date(e.date) < new Date();
      const dotCls = isPast ? 'past' : 'upcoming';
      return `<span class="event-dot ${dotCls}" title="${e.title}"></span>`;
    }).join('');

    return `
<div class="${cls}" data-date="${dateStr}" onclick="Calendar.selectDate('${dateStr}')">
  <div class="day-num">${day}</div>
  <div style="margin-top:2px;">${dots}</div>
</div>`;
  },

  selectDate(dateStr) {
    this._selectedDate = dateStr;
    this.render();
    this._showDayEvents(dateStr);
  },

  _showDayEvents(dateStr) {
    const panel = document.getElementById('dayEventsPanel');
    const title = document.getElementById('dayEventsTitle');
    const list = document.getElementById('dayEventsList');
    if (!panel || !list) return;

    const events = Storage.getEvents().filter(e => e.date && e.date.startsWith(dateStr));
    if (!events.length) {
      panel.style.display = 'none';
      return;
    }

    panel.style.display = 'block';
    title.textContent = `${dateStr} 事件`;

    const typeNames = {
      update: '版本更新', season: '赛季更替', holiday: '节假日活动',
      weapon: '武器调整', restock: '官方补货', other: '其他'
    };
    const impactIcons = { up: '📈', down: '📉', neutral: '➡️' };

    list.innerHTML = events.map(e => `
<div style="background:var(--surface);border:1px solid var(--border);border-radius:6px;padding:12px;margin-bottom:8px;">
  <div style="display:flex;justify-content:space-between;align-items:start;">
    <span style="font-weight:600;color:var(--text-bright);">${e.title}</span>
    <span style="font-size:10px;padding:2px 6px;background:#1f1f26;border-radius:3px;color:var(--text-dim);">${typeNames[e.type] || e.type}</span>
  </div>
  ${e.desc ? `<div style="margin-top:4px;font-size:12px;color:var(--text-dim);">${e.desc}</div>` : ''}
  ${e.impact && e.impact !== 'neutral' ? `<div style="margin-top:4px;font-size:12px;color:${e.impact==='up'?'var(--green)':'var(--red-bright)'};">${impactIcons[e.impact]} 预期${e.impact==='up'?'上涨':'下跌'}${e.magnitude?' '+e.magnitude+'%':''}</div>` : ''}
  <button onclick="Calendar.deleteEvent('${e.id}')" style="margin-top:6px;font-size:11px;background:none;border:none;color:var(--red);cursor:pointer;">删除</button>
</div>`).join('');
  },

  deleteEvent(id) {
    if (!confirm('确定删除此事件？')) return;
    Storage.deleteEvent(id);
    this.render();
    if (this._selectedDate) this._showDayEvents(this._selectedDate);
  },

  prevMonth() {
    if (this._month === 0) { this._month = 11; this._year--; }
    else this._month--;
    this.render();
    document.getElementById('dayEventsPanel').style.display = 'none';
  },

  nextMonth() {
    if (this._month === 11) { this._month = 0; this._year++; }
    else this._month++;
    this.render();
    document.getElementById('dayEventsPanel').style.display = 'none';
  },

  goToday() {
    const today = new Date();
    this._year = today.getFullYear();
    this._month = today.getMonth();
    const dateStr = `${this._year}-${String(this._month + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    this.selectDate(dateStr);
  }
};
