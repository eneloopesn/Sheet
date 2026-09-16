const CATEGORIES = [
  {
    id: "bento",
    title: "主餐飯盒",
    note: "內含：主餐一份、白飯、當季小菜四樣、炒蘿蔔乾一份｜白飯可續",
    items: [
      {
        id: "chicken-leg-bento",
        name: "招牌烤雞腿飯盒",
        desc: "去骨雞腿以特調醬汁醃製，烤至黃金比例",
        price: 150,
        tag: "人氣",
      },
      {
        id: "beef-bento",
        name: "醬烤牛肉片飯盒",
        desc: "牛肉片刷上特製韓式醬汁炭烤",
        price: 150,
        tag: "BBQ風味",
      },
      {
        id: "matsusaka-bento",
        name: "原燒松阪豬飯盒",
        desc: "軟嫩豬頸肉原味燒烤，口感有嚼勁，撒上蒜香粉",
        price: 180,
      },
      {
        id: "salmon-bento",
        name: "薄鹽烤鮭魚飯盒",
        desc: "北海道風味鮭魚，油脂豐富，薄鹽調味清爽",
        price: 180,
      },
      {
        id: "blade-steak-bento",
        name: "頂級板腱牛排飯盒",
        desc: "板腱牛排油花豐厚，炭烤後鮮嫩多汁",
        price: 250,
      },
      {
        id: "salted-pork-bento",
        name: "私房鹹豬肉飯盒",
        desc: "秘方醃製，外酥內嫩、鹹香帶勁",
        price: 150,
        tag: "大推",
      },
      {
        id: "mackerel-bento",
        name: "挪威烤鯖魚飯盒",
        desc: "挪威薄鹽鯖魚，低熱量，原味簡單烤",
        price: 130,
        tag: "人氣",
      },
      {
        id: "pork-collar-bento",
        name: "醬烤梅花豬飯盒",
        desc: "精選梅花豬片，刷上獨特店家醬汁",
        price: 120,
      },
      {
        id: "tilapia-bento",
        name: "蒲燒烤鯛魚飯盒",
        desc: "去骨烤鯛魚腹，日式甜鹹醬汁",
        price: 120,
      },
      {
        id: "mushroom-bento",
        name: "椒鹽杏鮑菇飯盒",
        desc: "多汁烤杏鮑菇，蒜香椒鹽調味",
        price: 120,
        tag: "蛋奶素可",
      },
    ],
  },
  {
    id: "special",
    title: "特別餐點",
    note: "",
    items: [
      {
        id: "chicken-oil",
        name: "雞油拌飯盒",
        desc: "每日小菜淋上雞油",
        price: 80,
      },
      {
        id: "bento",
        name: "小菜飯盒",
        desc: "每日小菜淋上雞油",
        price: 80,
      },
      {
        id: "vegan-bento",
        name: "全素飯盒",
        desc: "全素餐盒，售價請洽詢",
        price: 0,
        inquiry: true,
      },
      {
        id: "daily-soup",
        name: "每日例湯",
        desc: "當日湯品",
        price: 30,
      },
      {
        id: "cold-brew-tea",
        name: "瓶裝冷泡茶（600cc）",
        desc: "冷泡茶一瓶",
        price: 60,
      },
      {
        id: "limited-bento",
        name: "隱藏版限量飯盒",
        desc: "主廚季節限定，需預約｜售價 $120–$390",
        price: 120,
        priceMax: 390,
        tag: "需預約",
      },
    ],
  },
  {
    id: "alacarte",
    title: "人氣單點",
    note: "僅主餐／配菜單點",
    items: [
      { id: "solo-chicken", name: "雞腿", desc: "單點主餐", price: 90 },
      { id: "solo-beef", name: "牛片", desc: "單點主餐", price: 90 },
      { id: "solo-salted-pork", name: "鹹豬", desc: "單點主餐", price: 90 },
      { id: "solo-salmon", name: "鮭魚", desc: "單點主餐", price: 100 },
      { id: "solo-matsusaka", name: "松阪", desc: "單點主餐", price: 120 },
      { id: "solo-blade", name: "板腱牛排", desc: "單點主餐", price: 180 },
      { id: "solo-mackerel", name: "鯖魚", desc: "單點主餐", price: 70 },
      { id: "solo-tilapia", name: "鯛魚", desc: "單點主餐", price: 60 },
      { id: "solo-pork-collar", name: "梅豬", desc: "單點主餐", price: 60 },
      { id: "side-veg", name: "燙青菜", desc: "配菜單點", price: 50 },
      { id: "side-mushroom", name: "杏鮑菇", desc: "配菜單點", price: 60 },
      { id: "side-sausage", name: "雙腸", desc: "配菜單點", price: 70 },
    ],
  },
  {
    id: "healthy",
    title: "營養均衡好選擇",
    note: "",
    items: [
      {
        id: "fruit-cup",
        name: "Minibox 水果杯",
        desc: "內含四種水果｜需提前一天預訂",
        price: 50,
        tag: "需預訂",
      },
    ],
  },
];

const MENU = CATEGORIES.flatMap((cat) => cat.items);

const STORAGE_KEY = "roastcook-orders-v1";

const state = {
  cart: new Map(),
  orders: loadOrders(),
};

const els = {
  menuList: document.getElementById("menu-list"),
  cartList: document.getElementById("cart-list"),
  cartTotal: document.getElementById("cart-total"),
  orderNote: document.getElementById("order-note"),
  submitOrder: document.getElementById("submit-order"),
  clearCart: document.getElementById("clear-cart"),
  ordersList: document.getElementById("orders-list"),
  clearOrders: document.getElementById("clear-orders"),
  toast: document.getElementById("toast"),
};

function loadOrders() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveOrders() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.orders));
}

function money(n) {
  return `NT$ ${n.toLocaleString("zh-TW")}`;
}

function priceLabel(item) {
  if (item.inquiry) return "售價依詢問";
  if (item.priceMax) return `NT$ ${item.price.toLocaleString("zh-TW")}–${item.priceMax.toLocaleString("zh-TW")}`;
  return money(item.price);
}

function lineTotalLabel(item) {
  if (item.inquiry) return "售價依詢問";
  return money(item.price * item.qty);
}

function showToast(message) {
  els.toast.textContent = message;
  els.toast.classList.add("show");
  clearTimeout(showToast._timer);
  showToast._timer = setTimeout(() => {
    els.toast.classList.remove("show");
  }, 1800);
}

function addToCart(id) {
  const item = MENU.find((m) => m.id === id);
  if (!item) return;
  const current = state.cart.get(id) || { ...item, qty: 0 };
  current.qty += 1;
  state.cart.set(id, current);
  renderCart();
  showToast(`已加入「${item.name}」`);
}

function changeQty(id, delta) {
  const current = state.cart.get(id);
  if (!current) return;
  current.qty += delta;
  if (current.qty <= 0) state.cart.delete(id);
  else state.cart.set(id, current);
  renderCart();
}

function cartEntries() {
  return [...state.cart.values()];
}

function cartTotal() {
  return cartEntries().reduce((sum, item) => {
    if (item.inquiry) return sum;
    return sum + item.price * item.qty;
  }, 0);
}

function hasInquiryItems() {
  return cartEntries().some((item) => item.inquiry);
}

function renderMenuItem(item) {
  const tag = item.tag ? `<span class="menu-tag">${item.tag}</span>` : "";
  return `
    <article class="menu-item">
      <div class="menu-item-info">
        <h3>${item.name}${tag}</h3>
        <p>${item.desc}</p>
      </div>
      <div class="menu-price">${priceLabel(item)}</div>
      <button class="btn-add" type="button" data-add="${item.id}">加入購物車</button>
    </article>
  `;
}

function renderMenu() {
  els.menuList.innerHTML = CATEGORIES.map(
    (cat) => `
      <section class="menu-category" aria-labelledby="cat-${cat.id}">
        <div class="menu-category-head">
          <h3 id="cat-${cat.id}">${cat.title}</h3>
          ${cat.note ? `<p>${cat.note}</p>` : ""}
        </div>
        <div class="menu-category-list">
          ${cat.items.map(renderMenuItem).join("")}
        </div>
      </section>
    `
  ).join("");
}

function renderCart() {
  const items = cartEntries();
  if (!items.length) {
    els.cartList.innerHTML = `<li class="empty">購物車是空的，先點幾樣吧</li>`;
  } else {
    els.cartList.innerHTML = items
      .map(
        (item) => `
        <li class="cart-row">
          <div>
            <strong>${item.name}</strong>
            <div class="cart-meta">${priceLabel(item)} × ${item.qty} = ${lineTotalLabel(item)}</div>
          </div>
          <div class="qty-controls">
            <button class="qty-btn" type="button" data-qty="${item.id}" data-delta="-1" aria-label="減少">−</button>
            <span>${item.qty}</span>
            <button class="qty-btn" type="button" data-qty="${item.id}" data-delta="1" aria-label="增加">＋</button>
          </div>
        </li>
      `
      )
      .join("");
  }

  const suffix = hasInquiryItems() ? "起（含詢價品）" : "";
  els.cartTotal.textContent = `${money(cartTotal())}${suffix}`;
}

function renderOrders() {
  if (!state.orders.length) {
    els.ordersList.innerHTML = `<div class="empty">尚無訂單紀錄</div>`;
    return;
  }

  els.ordersList.innerHTML = state.orders
    .map(
      (order) => `
      <article class="order-card">
        <header>
          <span class="order-id">${order.id}</span>
          <span class="order-time">${order.time}</span>
        </header>
        <ul class="order-items">
          ${order.items
            .map((item) => {
              const line = item.inquiry
                ? `${item.name} × ${item.qty}（售價依詢問）`
                : `${item.name} × ${item.qty}（${money(item.price * item.qty)}）`;
              return `<li>${line}</li>`;
            })
            .join("")}
        </ul>
        <div class="order-foot">
          <span class="order-note">${order.note ? `備註：${order.note}` : "無備註"}</span>
          <span class="order-sum">${money(order.total)}${order.hasInquiry ? "起" : ""}</span>
        </div>
      </article>
    `
    )
    .join("");
}

function nextOrderId() {
  const n = state.orders.length + 1;
  return `A${String(n).padStart(3, "0")}`;
}

function submitOrder() {
  const items = cartEntries();
  if (!items.length) {
    showToast("購物車是空的");
    return;
  }

  const now = new Date();
  const inquiry = hasInquiryItems();
  const order = {
    id: nextOrderId(),
    time: now.toLocaleString("zh-TW", {
      hour12: false,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }),
    note: els.orderNote.value.trim(),
    items: items.map(({ name, price, qty, inquiry: isInquiry }) => ({
      name,
      price,
      qty,
      inquiry: Boolean(isInquiry),
    })),
    total: cartTotal(),
    hasInquiry: inquiry,
  };

  state.orders = [order, ...state.orders];
  saveOrders();
  state.cart.clear();
  els.orderNote.value = "";
  renderCart();
  renderOrders();
  showToast(`訂單 ${order.id} 已送出`);
}

function clearCart() {
  state.cart.clear();
  renderCart();
  showToast("已清空購物車");
}

function clearOrders() {
  if (!state.orders.length) {
    showToast("目前沒有紀錄");
    return;
  }
  if (!confirm("確定要清除全部訂單紀錄？")) return;
  state.orders = [];
  saveOrders();
  renderOrders();
  showToast("已清除全部紀錄");
}

els.menuList.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-add]");
  if (!btn) return;
  addToCart(btn.dataset.add);
});

els.cartList.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-qty]");
  if (!btn) return;
  changeQty(btn.dataset.qty, Number(btn.dataset.delta));
});

els.submitOrder.addEventListener("click", submitOrder);
els.clearCart.addEventListener("click", clearCart);
els.clearOrders.addEventListener("click", clearOrders);

renderMenu();
renderCart();
renderOrders();
