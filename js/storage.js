/**
 * 訂單儲存
 * - 已設定 Firebase：雲端即時同步（不同裝置自動共用）
 * - 未設定：退回本機 localStorage（僅同瀏覽器）
 */
const OrderStore = (() => {
  const KEY = "roast-cook-orders-v1";
  const CHANNEL = "roast-cook-orders";
  const PATH = "orders";

  let cache = [];
  let dbRef = null;
  let mode = "local"; // 'cloud' | 'local'
  let initPromise = null;

  function emit() {
    window.dispatchEvent(
      new CustomEvent("orders-updated", { detail: { mode, count: cache.length } })
    );
  }

  function sortOrders(list) {
    return [...list].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );
  }

  function readLocal() {
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  let broadcast = null;

  function writeLocal(orders) {
    localStorage.setItem(KEY, JSON.stringify(orders));
    try {
      localStorage.setItem(KEY + ":tick", String(Date.now()));
    } catch {
      /* ignore */
    }
    cache = sortOrders(orders);
    emit();
    try {
      broadcast?.postMessage({ type: "refresh" });
    } catch {
      /* ignore */
    }
  }

  function initLocal() {
    mode = "local";
    cache = sortOrders(readLocal());
    window.addEventListener("storage", (e) => {
      if (e.key === KEY || e.key === KEY + ":tick") {
        cache = sortOrders(readLocal());
        emit();
      }
    });
    try {
      broadcast = new BroadcastChannel(CHANNEL);
      broadcast.onmessage = () => {
        cache = sortOrders(readLocal());
        emit();
      };
    } catch {
      /* ignore */
    }
    emit();
  }

  function initCloud() {
    if (typeof firebase === "undefined") {
      throw new Error("Firebase SDK 尚未載入");
    }
    if (!firebase.apps.length) {
      firebase.initializeApp(FIREBASE_CONFIG);
    }
    dbRef = firebase.database().ref(PATH);
    mode = "cloud";
    return new Promise((resolve, reject) => {
      let first = true;
      dbRef.on(
        "value",
        (snap) => {
          const val = snap.val();
          if (!val) {
            cache = [];
          } else if (Array.isArray(val)) {
            cache = sortOrders(val.filter(Boolean));
          } else {
            cache = sortOrders(Object.values(val));
          }
          emit();
          if (first) {
            first = false;
            resolve();
          }
        },
        (err) => {
          if (first) reject(err);
          console.error(err);
        }
      );
    });
  }

  function ready() {
    if (initPromise) return initPromise;
    initPromise = (async () => {
      if (typeof isCloudConfigured === "function" && isCloudConfigured()) {
        try {
          await initCloud();
          return { mode };
        } catch (err) {
          console.error("雲端連線失敗，改用本機儲存", err);
          initLocal();
          return { mode, error: err };
        }
      }
      initLocal();
      return { mode };
    })();
    return initPromise;
  }

  function getMode() {
    return mode;
  }

  function list() {
    return cache;
  }

  function buildOrder({ customerName, phone, note, items }) {
    const normalized = items.map((item) => ({
      id: item.id,
      name: item.name,
      price: Number(item.price) || 0,
      qty: Math.max(1, Number(item.qty) || 1),
    }));
    const total = normalized.reduce((sum, i) => sum + i.price * i.qty, 0);
    return {
      id: crypto.randomUUID
        ? crypto.randomUUID()
        : `id-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      orderNo: `RC${Date.now().toString().slice(-8)}`,
      customerName: String(customerName).trim(),
      phone: phone ? String(phone).trim() : "",
      note: note ? String(note).trim() : "",
      items: normalized,
      total,
      status: "pending",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  async function create(payload) {
    await ready();
    const order = buildOrder(payload);
    if (mode === "cloud") {
      await dbRef.child(order.id).set(order);
      return order;
    }
    const orders = readLocal();
    orders.push(order);
    writeLocal(orders);
    return order;
  }

  async function updateStatus(id, status) {
    await ready();
    const allowed = ["pending", "preparing", "ready", "done", "cancelled"];
    if (!allowed.includes(status)) throw new Error("無效的訂單狀態");

    if (mode === "cloud") {
      const snap = await dbRef.child(id).once("value");
      if (!snap.exists()) throw new Error("找不到訂單");
      await dbRef.child(id).update({
        status,
        updatedAt: new Date().toISOString(),
      });
      return { ...snap.val(), status };
    }

    const orders = readLocal();
    const idx = orders.findIndex((o) => o.id === id);
    if (idx === -1) throw new Error("找不到訂單");
    orders[idx].status = status;
    orders[idx].updatedAt = new Date().toISOString();
    writeLocal(orders);
    return orders[idx];
  }

  async function remove(id) {
    await ready();
    if (mode === "cloud") {
      const snap = await dbRef.child(id).once("value");
      if (!snap.exists()) throw new Error("找不到訂單");
      await dbRef.child(id).remove();
      return;
    }
    const orders = readLocal();
    const next = orders.filter((o) => o.id !== id);
    if (next.length === orders.length) throw new Error("找不到訂單");
    writeLocal(next);
  }

  async function clearAll() {
    await ready();
    if (mode === "cloud") {
      await dbRef.remove();
      return;
    }
    writeLocal([]);
  }

  function exportJson() {
    return JSON.stringify(list(), null, 2);
  }

  async function importJson(text, { merge = true } = {}) {
    await ready();
    const incoming = JSON.parse(text);
    if (!Array.isArray(incoming)) throw new Error("格式錯誤");

    if (mode === "cloud") {
      const updates = {};
      if (!merge) {
        await dbRef.remove();
      }
      for (const o of incoming) {
        if (o && o.id) updates[o.id] = o;
      }
      if (Object.keys(updates).length) {
        await dbRef.update(updates);
      }
      return Object.keys(updates).length || list().length;
    }

    if (!merge) {
      writeLocal(incoming);
      return incoming.length;
    }
    const map = new Map(readLocal().map((o) => [o.id, o]));
    for (const o of incoming) {
      if (o && o.id) map.set(o.id, o);
    }
    const merged = [...map.values()];
    writeLocal(merged);
    return merged.length;
  }

  return {
    ready,
    getMode,
    list,
    create,
    updateStatus,
    remove,
    clearAll,
    exportJson,
    importJson,
  };
})();
