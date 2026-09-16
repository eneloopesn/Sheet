const state = {
  menu: window.ROAST_MENU || [],
  filter: '全部',
  cart: {},
};

const CATEGORY_ORDER = ['招牌飯盒', '特別餐點', '人氣單點', '營養選擇'];

const els = {
  filters: document.getElementById('filters'),
  grid: document.getElementById('menu-grid'),
  cartList: document.getElementById('cart-list'),
  cartTotal: document.getElementById('cart-total'),
  submit: document.getElementById('submit-order'),
  toast: document.getElementById('toast'),
  customerName: document.getElementById('customerName'),
  cloudBanner: document.getElementById('cloud-banner'),
};

function money(n) {
  return `$${Number(n).toLocaleString('zh-TW')}`;
}

function priceText(item) {
  if (item.inquire || item.price == null) {
    return item.priceLabel || '請詢價';
  }
  return money(item.price);
}

let toastTimer;
function showToast(msg) {
  els.toast.textContent = msg;
  els.toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => els.toast.classList.remove('show'), 2400);
}

function cartItems() {
  return Object.values(state.cart);
}

function cartTotal() {
  return cartItems().reduce((s, i) => s + i.price * i.qty, 0);
}

function addToCart(item) {
  if (item.inquire || item.price == null) {
    showToast(`「${item.name}」請向店家詢價／預約`);
    return;
  }
  if (!state.cart[item.id]) {
    state.cart[item.id] = {
      id: item.id,
      name: item.name,
      price: item.price,
      qty: 0,
    };
  }
  state.cart[item.id].qty += 1;
  renderCart();
  showToast(`已加入 ${item.name}`);
}

function setQty(id, qty) {
  if (!state.cart[id]) return;
  if (qty <= 0) {
    delete state.cart[id];
  } else {
    state.cart[id].qty = qty;
  }
  renderCart();
}

function renderFilters() {
  const present = new Set(state.menu.map((m) => m.category));
  const cats = [
    '全部',
    ...CATEGORY_ORDER.filter((c) => present.has(c)),
    ...[...present].filter((c) => !CATEGORY_ORDER.includes(c)),
  ];
  els.filters.innerHTML = cats
    .map(
      (c) =>
        `<button class="chip ${c === state.filter ? 'active' : ''}" data-cat="${c}" type="button">${c}</button>`
    )
    .join('');
}

function renderMenu() {
  const list =
    state.filter === '全部'
      ? state.menu
      : state.menu.filter((m) => m.category === state.filter);

  els.grid.innerHTML = list
    .map((item, idx) => {
      const inquire = item.inquire || item.price == null;
      const tag = item.tag
        ? `<span class="menu-tag">${item.tag}</span>`
        : item.needBooking
          ? `<span class="menu-tag">需預約</span>`
          : '';
      const priceHtml = inquire
        ? `<div class="price inquire">${priceText(item)}</div>`
        : `<div class="price"><small>NT</small>${item.price}</div>`;
      const btn = inquire
        ? `<button class="btn" type="button" data-inquire="${item.id}">詢價</button>`
        : `<button class="btn btn-primary" type="button" data-add="${item.id}">加入</button>`;

      return `
      <article class="menu-item" style="animation-delay:${idx * 30}ms">
        ${tag}
        <div class="menu-emoji">${item.image || '🍱'}</div>
        <h3>${item.name}</h3>
        <p class="desc">${item.desc}</p>
        <div class="menu-foot">
          ${priceHtml}
          ${btn}
        </div>
      </article>`;
    })
    .join('');
}

function renderCart() {
  const items = cartItems();
  if (!items.length) {
    els.cartList.innerHTML = `<div class="cart-empty">購物車還是空的</div>`;
  } else {
    els.cartList.innerHTML = items
      .map(
        (item) => `
        <div class="cart-row">
          <div class="name">${item.name}</div>
          <div>${money(item.price * item.qty)}</div>
          <div class="meta">
            <div class="qty-ctrl">
              <button type="button" data-dec="${item.id}">−</button>
              <span>${item.qty}</span>
              <button type="button" data-inc="${item.id}">＋</button>
            </div>
            <span>${money(item.price)} / 份</span>
          </div>
        </div>`
      )
      .join('');
  }
  els.cartTotal.textContent = money(cartTotal());
}

function updateCloudBanner() {
  if (!els.cloudBanner) return;
  if (OrderStore.getStorageId()) {
    els.cloudBanner.hidden = true;
    els.submit.disabled = false;
  } else {
    els.cloudBanner.hidden = false;
    els.submit.disabled = true;
  }
}

els.filters.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-cat]');
  if (!btn) return;
  state.filter = btn.dataset.cat;
  renderFilters();
  renderMenu();
});

els.grid.addEventListener('click', (e) => {
  const addBtn = e.target.closest('[data-add]');
  const inquireBtn = e.target.closest('[data-inquire]');
  if (addBtn) {
    const item = state.menu.find((m) => m.id === addBtn.dataset.add);
    if (item) addToCart(item);
    return;
  }
  if (inquireBtn) {
    const item = state.menu.find((m) => m.id === inquireBtn.dataset.inquire);
    if (item) {
      showToast(
        item.needBooking
          ? `「${item.name}」需提前預約，請聯繫店家`
          : `「${item.name}」請向店家詢價`
      );
    }
  }
});

els.cartList.addEventListener('click', (e) => {
  const inc = e.target.closest('[data-inc]');
  const dec = e.target.closest('[data-dec]');
  if (inc) {
    const item = state.cart[inc.dataset.inc];
    if (item) setQty(item.id, item.qty + 1);
  }
  if (dec) {
    const item = state.cart[dec.dataset.dec];
    if (item) setQty(item.id, item.qty - 1);
  }
});

els.submit.addEventListener('click', async () => {
  const customerName = els.customerName.value.trim();
  const items = cartItems().map((i) => ({ id: i.id, qty: i.qty }));

  if (!OrderStore.getStorageId()) {
    showToast('請先到後台啟用雲端訂單庫');
    return;
  }
  if (!items.length) {
    showToast('請先選餐');
    return;
  }
  if (!customerName) {
    showToast('請填寫姓名');
    els.customerName.focus();
    return;
  }

  els.submit.disabled = true;
  try {
    const order = await OrderStore.createOrder({ customerName, items });
    state.cart = {};
    renderCart();
    showToast(`訂單已送出：${order.id}`);
  } catch (err) {
    showToast(err.message || '送出失敗');
  } finally {
    els.submit.disabled = !OrderStore.getStorageId();
  }
});

renderFilters();
renderMenu();
renderCart();
updateCloudBanner();
