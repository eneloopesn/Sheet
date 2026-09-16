const STATUS = [
  { id: "all", label: "全部" },
  { id: "pending", label: "待處理" },
  { id: "preparing", label: "製作中" },
  { id: "ready", label: "可取餐" },
  { id: "done", label: "已完成" },
  { id: "cancelled", label: "已取消" },
];

const STATUS_LABEL = Object.fromEntries(
  STATUS.filter((s) => s.id !== "all").map((s) => [s.id, s.label])
);

const NEXT_ACTIONS = {
  pending: [
    { status: "preparing", label: "開始製作" },
    { status: "cancelled", label: "取消" },
  ],
  preparing: [
    { status: "ready", label: "完成可取" },
    { status: "cancelled", label: "取消" },
  ],
  ready: [{ status: "done", label: "已取餐" }],
  done: [],
  cancelled: [],
};

let filter = "all";
let orders = [];

const els = {
  stats: document.getElementById("stats"),
  filters: document.getElementById("filters"),
  root: document.getElementById("orders-root"),
  lastUpdated: document.getElementById("last-updated"),
  refreshBtn: document.getElementById("refresh-btn"),
  exportBtn: document.getElementById("export-btn"),
  importFile: document.getElementById("import-file"),
  clearBtn: document.getElementById("clear-btn"),
  toast: document.getElementById("toast"),
};

function toast(message) {
  els.toast.textContent = message;
  els.toast.classList.add("show");
  clearTimeout(toast._t);
  toast._t = setTimeout(() => els.toast.classList.remove("show"), 2200);
}

function formatTime(iso) {
  return new Date(iso).toLocaleString("zh-TW", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function renderFilters() {
  els.filters.innerHTML = STATUS.map(
    (s) => `
    <button class="chip ${filter === s.id ? "active" : ""}" type="button" data-filter="${s.id}">
      ${s.label}
    </button>
  `
  ).join("");
}

els.filters.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-filter]");
  if (!btn) return;
  filter = btn.dataset.filter;
  renderFilters();
  renderOrders();
});

function renderStats() {
  const active = orders.filter((o) => !["done", "cancelled"].includes(o.status));
  const revenue = orders
    .filter((o) => o.status !== "cancelled")
    .reduce((sum, o) => sum + o.total, 0);

  els.stats.innerHTML = `
    <div class="stat">
      <div class="label">進行中</div>
      <div class="value">${active.length}</div>
    </div>
    <div class="stat">
      <div class="label">訂單數</div>
      <div class="value">${orders.length}</div>
    </div>
    <div class="stat">
      <div class="label">營業額（未含取消）</div>
      <div class="value">$${revenue}</div>
    </div>
  `;
}

function renderOrders() {
  const list =
    filter === "all" ? orders : orders.filter((o) => o.status === filter);

  if (!list.length) {
    els.root.innerHTML = `<div class="panel empty">目前沒有訂單</div>`;
    return;
  }

  els.root.innerHTML = list
    .map((order) => {
      const actions = NEXT_ACTIONS[order.status] || [];
      return `
        <article class="order-card" data-id="${order.id}">
          <div class="order-head">
            <div>
              <strong>${order.orderNo}</strong>
              <span class="badge ${order.status}">${STATUS_LABEL[order.status]}</span>
            </div>
            <div style="font-weight:800;">$${order.total}</div>
          </div>
          <div class="order-meta">
            <span>取餐：${order.customerName}</span>
            ${order.phone ? `<span>電話：${order.phone}</span>` : ""}
            <span>下單：${formatTime(order.createdAt)}</span>
          </div>
          <ul class="order-items">
            ${order.items
              .map((i) => `<li>${i.name} × ${i.qty}（$${i.price * i.qty}）</li>`)
              .join("")}
          </ul>
          ${
            order.note
              ? `<p style="color:var(--warn);margin:0.5rem 0 0;">備註：${order.note}</p>`
              : ""
          }
          <div class="order-actions" style="margin-top:0.8rem;">
            ${actions
              .map(
                (a) => `
              <button class="btn ${a.status === "cancelled" ? "btn-danger" : "btn-primary"}" type="button"
                data-action="status" data-status="${a.status}" data-id="${order.id}">
                ${a.label}
              </button>
            `
              )
              .join("")}
            <button class="btn btn-ghost" type="button" data-action="delete" data-id="${order.id}">
              刪除
            </button>
          </div>
        </article>
      `;
    })
    .join("");
}

function loadOrders() {
  orders = OrderStore.list();
  els.lastUpdated.textContent = new Date().toLocaleTimeString("zh-TW");
  renderStats();
  renderOrders();
}

els.root.addEventListener("click", async (e) => {
  const btn = e.target.closest("button[data-action]");
  if (!btn) return;
  const { action, id, status } = btn.dataset;
  btn.disabled = true;

  try {
    if (action === "status") {
      await OrderStore.updateStatus(id, status);
      toast(`已更新為「${STATUS_LABEL[status]}」`);
    }
    if (action === "delete") {
      if (!confirm("確定刪除此訂單？")) return;
      await OrderStore.remove(id);
      toast("訂單已刪除");
    }
  } catch (err) {
    toast(err.message);
  } finally {
    btn.disabled = false;
    loadOrders();
  }
});

els.refreshBtn.addEventListener("click", async () => {
  await OrderStore.ready();
  loadOrders();
  toast("已重新整理");
});

els.exportBtn.addEventListener("click", () => {
  const blob = new Blob([OrderStore.exportJson()], {
    type: "application/json;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `roast-cook-orders-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
  toast("已匯出訂單");
});

els.importFile.addEventListener("change", async () => {
  const file = els.importFile.files?.[0];
  if (!file) return;
  try {
    const text = await file.text();
    const count = await OrderStore.importJson(text, { merge: true });
    loadOrders();
    toast(`已匯入，目前共 ${count} 筆`);
  } catch (err) {
    toast(err.message || "匯入失敗");
  } finally {
    els.importFile.value = "";
  }
});

els.clearBtn.addEventListener("click", async () => {
  if (!confirm("確定清空全部訂單？此動作無法復原。")) return;
  try {
    await OrderStore.clearAll();
    loadOrders();
    toast("已清空訂單");
  } catch (err) {
    toast(err.message || "清空失敗");
  }
});

window.addEventListener("orders-updated", loadOrders);

renderFilters();
initSyncBanner("sync-banner");
OrderStore.ready().then(loadOrders);
