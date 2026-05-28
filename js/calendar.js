/* global Storage */

const Calendar = {
  _year: new Date().getFullYear(),
  _month: new Date().getMonth(),
  _selectedDate: null,

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
