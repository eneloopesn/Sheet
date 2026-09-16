const els = {
  cards: document.getElementById('stat-cards'),
  topItems: document.getElementById('top-items'),
  hourChart: document.getElementById('hour-chart'),
  statusCards: document.getElementById('status-cards'),
  ordersBody: document.getElementById('orders-body'),
  refresh: document.getElementById('refresh-btn'),
  toast: document.getElementById('toast'),
};

const STATUS_LABEL = {
  pending: '待處理',
  preparing: '製作中',
  done: '已完成',
  cancelled: '已取消',
};

function money(n) {
  return `$${Number(n).toLocaleString('zh-TW')}`;
}

let toastTimer;
function showToast(msg) {
  els.toast.textContent = msg;
  els.toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => els.toast.classList.remove('show'), 2200);
}

function formatTime(iso) {
  return new Date(iso).toLocaleString('zh-TW', {
    timeZone: 'Asia/Taipei',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function renderStats(stats) {
  els.cards.innerHTML = `
    <div class="stat-card" style="animation-delay:0ms">
      <div class="label">今日訂單</div>
      <div class="value">${stats.todayOrders}</div>
      <div class="sub">累計 ${stats.totalOrders} 筆有效訂單</div>
    </div>
    <div class="stat-card" style="animation-delay:50ms">
      <div class="label">今日營收</div>
      <div class="value">${money(stats.todayRevenue)}</div>
      <div class="sub">總營收 ${money(stats.revenue)}</div>
    </div>
    <div class="stat-card" style="animation-delay:100ms">
      <div class="label">客單價</div>
      <div class="value">${money(stats.avgOrder)}</div>
      <div class="sub">有效訂單平均</div>
    </div>
    <div class="stat-card" style="animation-delay:150ms">
      <div class="label">待處理</div>
      <div class="value">${stats.byStatus.pending}</div>
      <div class="sub">製作中 ${stats.byStatus.preparing}</div>
    </div>
  `;

  els.statusCards.innerHTML = Object.entries(stats.byStatus)
    .map(
      ([key, count], i) => `
      <div class="stat-card" style="animation-delay:${i * 40}ms">
        <div class="label">${STATUS_LABEL[key]}</div>
        <div class="value">${count}</div>
      </div>`
    )
    .join('');

  const maxQty = Math.max(1, ...stats.topItems.map((i) => i.qty));
  if (!stats.topItems.length) {
    els.topItems.innerHTML = `<div class="cart-empty" style="color:var(--muted)">尚無銷售資料</div>`;
  } else {
    els.topItems.innerHTML = stats.topItems
      .map(
        (item) => `
        <div class="bar-row">
          <div>${item.name}</div>
          <div class="bar-track"><div class="bar-fill" style="width:${(item.qty / maxQty) * 100}%"></div></div>
          <div>${item.qty} 份</div>
        </div>`
      )
      .join('');
    requestAnimationFrame(() => {
      els.topItems.querySelectorAll('.bar-fill').forEach((el) => {
        const w = el.style.width;
        el.style.width = '0';
        requestAnimationFrame(() => {
          el.style.width = w;
        });
      });
    });
  }

  const activeHours = stats.byHour.filter((h) => h.hour >= 10 && h.hour <= 21);
  const maxCount = Math.max(1, ...activeHours.map((h) => h.count));
  els.hourChart.innerHTML = activeHours
    .map((h) => {
      const height = Math.max(4, (h.count / maxCount) * 120);
      return `
        <div class="hour-col" title="${h.hour}:00 · ${h.count} 單 · ${money(h.revenue)}">
          <div class="hour-bar" style="height:${height}px"></div>
          <div class="hour-label">${h.hour}</div>
        </div>`;
    })
    .join('');

  if (!stats.recentOrders.length) {
    els.ordersBody.innerHTML = `<tr><td colspan="6" style="color:var(--muted)">還沒有訂單</td></tr>`;
    return;
  }

  els.ordersBody.innerHTML = stats.recentOrders
    .map((order) => {
      const items = order.items.map((i) => `${i.name}×${i.qty}`).join('、');
      return `
        <tr>
          <td>${formatTime(order.createdAt)}<div style="color:var(--muted);font-size:0.8rem">${order.id}</div></td>
          <td>${order.customerName}</td>
          <td>${items}</td>
          <td>${money(order.total)}</td>
          <td><span class="status ${order.status}">${STATUS_LABEL[order.status]}</span></td>
          <td>
            <div class="status-actions">
              <button type="button" data-id="${order.id}" data-status="preparing">製作中</button>
              <button type="button" data-id="${order.id}" data-status="done">完成</button>
              <button type="button" data-id="${order.id}" data-status="cancelled">取消</button>
            </div>
          </td>
        </tr>`;
    })
    .join('');
}

function loadStats() {
  renderStats(OrderStore.getStats());
}

els.ordersBody.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-id][data-status]');
  if (!btn) return;
  try {
    const order = OrderStore.updateStatus(btn.dataset.id, btn.dataset.status);
    showToast(`已更新為${STATUS_LABEL[order.status]}`);
    loadStats();
  } catch (err) {
    showToast(err.message);
  }
});

els.refresh.addEventListener('click', () => {
  loadStats();
  showToast('已更新');
});

loadStats();
setInterval(loadStats, 8000);
