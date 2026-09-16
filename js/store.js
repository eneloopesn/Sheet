const OrderStore = (() => {
  const LOCAL_SID_KEY = 'roast-cook-storage-id';
  const API = 'https://jsonblob.com/api/jsonBlob';

  let etag = null;

  function resolveStorageId() {
    const params = new URLSearchParams(window.location.search);
    const fromQuery = (params.get('sid') || '').trim();
    if (fromQuery) {
      localStorage.setItem(LOCAL_SID_KEY, fromQuery);
      return fromQuery;
    }
    const fromConfig = (window.APP_CONFIG && window.APP_CONFIG.storageId
      ? String(window.APP_CONFIG.storageId)
      : ''
    ).trim();
    if (fromConfig) return fromConfig;
    return (localStorage.getItem(LOCAL_SID_KEY) || '').trim();
  }

  function getStorageId() {
    return resolveStorageId();
  }

  function setStorageId(id) {
    const value = String(id || '').trim();
    localStorage.setItem(LOCAL_SID_KEY, value);
    return value;
  }

  function endpoint(id) {
    return `${API}/${id}`;
  }

  async function createStorage() {
    const res = await fetch(API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        Accept: 'application/json',
      },
      body: JSON.stringify([]),
    });
    if (!res.ok) throw new Error('無法建立雲端訂單庫，請稍後再試');

    const location = res.headers.get('Location') || '';
    const id = location.split('/').pop();
    if (!id) throw new Error('建立成功但無法取得 ID');

    etag = res.headers.get('ETag');
    setStorageId(id);
    return id;
  }

  async function fetchOrders() {
    const id = getStorageId();
    if (!id) throw new Error('尚未設定雲端訂單庫');

    const res = await fetch(endpoint(id), {
      headers: { Accept: 'application/json' },
    });
    if (res.status === 404) throw new Error('找不到雲端訂單庫，請重新建立');
    if (!res.ok) throw new Error('讀取訂單失敗');

    etag = res.headers.get('ETag') || etag;
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  }

  async function saveOrders(orders, attempt = 0) {
    const id = getStorageId();
    if (!id) throw new Error('尚未設定雲端訂單庫');

    const headers = {
      'Content-Type': 'application/json; charset=utf-8',
      Accept: 'application/json',
    };
    if (etag) headers['If-Match'] = etag;

    const res = await fetch(endpoint(id), {
      method: 'PUT',
      headers,
      body: JSON.stringify(orders),
    });

    if (res.status === 412 && attempt < 3) {
      const latest = await fetchOrders();
      const merged = mergeOrders(latest, orders);
      return saveOrders(merged, attempt + 1);
    }
    if (!res.ok) throw new Error('儲存訂單失敗');

    etag = res.headers.get('ETag') || etag;
    return orders;
  }

  function mergeOrders(base, incoming) {
    const map = new Map();
    for (const order of base) map.set(order.id, order);
    for (const order of incoming) {
      const prev = map.get(order.id);
      if (!prev) {
        map.set(order.id, order);
        continue;
      }
      // 後寫入的狀態變更優先（同 id）
      map.set(order.id, { ...prev, ...order });
    }
    return [...map.values()].sort(
      (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
    );
  }

  function normalizeItems(items) {
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
    return normalized;
  }

  async function createOrder({ customerName, items }) {
    if (!getStorageId()) throw new Error('尚未設定雲端訂單庫，請先到後台啟用');

    const normalized = normalizeItems(items);
    const order = {
      id: `O${Date.now()}${Math.floor(Math.random() * 1000)}`,
      customerName: String(customerName).trim().slice(0, 40),
      items: normalized,
      total: normalized.reduce((s, i) => s + i.subtotal, 0),
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    const orders = await fetchOrders();
    orders.push(order);
    await saveOrders(orders);
    return order;
  }

  async function updateStatus(id, status) {
    const allowed = ['pending', 'preparing', 'done', 'cancelled'];
    if (!allowed.includes(status)) throw new Error('狀態不正確');

    const orders = await fetchOrders();
    const order = orders.find((o) => o.id === id);
    if (!order) throw new Error('找不到訂單');
    order.status = status;
    await saveOrders(orders);
    return order;
  }

  function buildStats(orders) {
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

  async function getStats() {
    const orders = await fetchOrders();
    return buildStats(orders);
  }

  function shareLinks(id) {
    const sid = id || getStorageId();
    if (!sid) return null;
    const base = window.location.href.split('?')[0].replace(/admin\.html$/i, 'index.html');
    const adminBase = base.replace(/index\.html$/i, 'admin.html');
    return {
      id: sid,
      orderUrl: `${base}?sid=${encodeURIComponent(sid)}`,
      adminUrl: `${adminBase}?sid=${encodeURIComponent(sid)}`,
    };
  }

  return {
    getStorageId,
    setStorageId,
    createStorage,
    fetchOrders,
    createOrder,
    updateStatus,
    getStats,
    shareLinks,
  };
})();
