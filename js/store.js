const OrderStore = (() => {
  const KEY = 'roast-cook-orders';

  function readOrders() {
    try {
      const raw = localStorage.getItem(KEY);
      const list = raw ? JSON.parse(raw) : [];
      return Array.isArray(list) ? list : [];
    } catch {
      return [];
    }
  }

  function writeOrders(orders) {
    localStorage.setItem(KEY, JSON.stringify(orders));
  }

  function createOrder({ customerName, items }) {
    const menuMap = Object.fromEntries(
      (window.ROAST_MENU || []).map((m) => [m.id, m])
    );
    const normalized = [];

    for (const item of items) {
      const menuItem = menuMap[item.id];
      if (!menuItem) throw new Error(`找不到品項：${item.id}`);
      if (menuItem.inquire || menuItem.price == null) {
        throw new Error(`「${menuItem.name}」需向店家詢價／預約，無法線上結帳`);
      }
      const qty = Number(item.qty);
      if (!Number.isInteger(qty) || qty < 1 || qty > 99) {
        throw new Error('數量不正確');
      }
      normalized.push({
        id: menuItem.id,
        name: menuItem.name,
        price: menuItem.price,
        qty,
        subtotal: menuItem.price * qty,
      });
    }

    if (!normalized.length) throw new Error('購物車是空的');

    const order = {
      id: `O${Date.now()}`,
      customerName: String(customerName).trim().slice(0, 40),
      items: normalized,
      total: normalized.reduce((s, i) => s + i.subtotal, 0),
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    const orders = readOrders();
    orders.push(order);
    writeOrders(orders);
    return order;
  }

  function updateStatus(id, status) {
    const allowed = ['pending', 'preparing', 'done', 'cancelled'];
    if (!allowed.includes(status)) throw new Error('狀態不正確');
    const orders = readOrders();
    const order = orders.find((o) => o.id === id);
    if (!order) throw new Error('找不到訂單');
    order.status = status;
    writeOrders(orders);
    return order;
  }

  function getStats() {
    const orders = readOrders();
    const active = orders.filter((o) => o.status !== 'cancelled');

    const todayStr = new Date().toLocaleDateString('en-CA', {
      timeZone: 'Asia/Taipei',
    });

    const todayOrders = active.filter((o) => {
      const d = new Date(o.createdAt).toLocaleDateString('en-CA', {
        timeZone: 'Asia/Taipei',
      });
      return d === todayStr;
    });

    const revenue = active.reduce((s, o) => s + o.total, 0);
    const todayRevenue = todayOrders.reduce((s, o) => s + o.total, 0);

    const itemCount = {};
    for (const order of active) {
      for (const item of order.items) {
        if (!itemCount[item.id]) {
          itemCount[item.id] = {
            id: item.id,
            name: item.name,
            qty: 0,
            revenue: 0,
          };
        }
        itemCount[item.id].qty += item.qty;
        itemCount[item.id].revenue += item.subtotal;
      }
    }

    const topItems = Object.values(itemCount)
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);

    const byStatus = {
      pending: orders.filter((o) => o.status === 'pending').length,
      preparing: orders.filter((o) => o.status === 'preparing').length,
      done: orders.filter((o) => o.status === 'done').length,
      cancelled: orders.filter((o) => o.status === 'cancelled').length,
    };

    const byHour = Array.from({ length: 24 }, (_, h) => ({
      hour: h,
      count: 0,
      revenue: 0,
    }));
    for (const order of todayOrders) {
      const hour = Number(
        new Date(order.createdAt).toLocaleString('en-US', {
          timeZone: 'Asia/Taipei',
          hour: 'numeric',
          hour12: false,
        })
      );
      byHour[hour].count += 1;
      byHour[hour].revenue += order.total;
    }

    return {
      totalOrders: active.length,
      todayOrders: todayOrders.length,
      revenue,
      todayRevenue,
      avgOrder: active.length ? Math.round(revenue / active.length) : 0,
      byStatus,
      topItems,
      byHour,
      recentOrders: orders
        .slice()
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 20),
    };
  }

  return { readOrders, createOrder, updateStatus, getStats };
})();
