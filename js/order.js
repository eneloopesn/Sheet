const state = {
  cart: new Map(),
};

const els = {
  menuRoot: document.getElementById("menu-root"),
  note: document.getElementById("restaurant-note"),
  cartCount: document.getElementById("cart-count"),
  cartTotal: document.getElementById("cart-total"),
  cartList: document.getElementById("cart-list"),
  cartModal: document.getElementById("cart-modal"),
  openCartBtn: document.getElementById("open-cart-btn"),
  closeCartBtn: document.getElementById("close-cart-btn"),
  submitBtn: document.getElementById("submit-order-btn"),
  name: document.getElementById("customer-name"),
  phone: document.getElementById("customer-phone"),
  noteInput: document.getElementById("customer-note"),
  toast: document.getElementById("toast"),
};

function toast(message) {
  els.toast.textContent = message;
  els.toast.classList.add("show");
  clearTimeout(toast._t);
  toast._t = setTimeout(() => els.toast.classList.remove("show"), 2200);
}

function cartItems() {
  return [...state.cart.values()];
}

function cartCount() {
  return cartItems().reduce((sum, i) => sum + i.qty, 0);
}

function cartTotal() {
  return cartItems().reduce((sum, i) => sum + i.price * i.qty, 0);
}

function updateCartDock() {
  els.cartCount.textContent = String(cartCount());
  els.cartTotal.textContent = `$${cartTotal()}`;
}

function setQty(item, qty) {
  if (qty <= 0) {
    state.cart.delete(item.id);
  } else {
    state.cart.set(item.id, { ...item, qty });
  }
  updateCartDock();
  renderMenu();
  if (els.cartModal.classList.contains("open")) renderCartList();
}

function getQty(id) {
  return state.cart.get(id)?.qty || 0;
}

function findItem(id) {
  for (const cat of MENU.categories) {
    const found = cat.items.find((i) => i.id === id);
    if (found) return found;
  }
  return null;
}

function renderMenu() {
  els.menuRoot.innerHTML = MENU.categories
    .map(
      (cat) => `
      <section>
        <h2 class="section-title">${cat.name}</h2>
        <div class="grid">
          ${cat.items
            .map((item) => {
              const qty = getQty(item.id);
              const priceLabel = item.priceNote
                ? `$${item.priceNote}`
                : `$${item.price}`;
              return `
                <article class="card">
                  <div class="card-head">
                    <h3>${item.name}</h3>
                    <div class="price">${priceLabel}</div>
                  </div>
                  <div class="tags">
                    ${(item.tags || [])
                      .map((t) => `<span class="tag">${t}</span>`)
                      .join("")}
                  </div>
                  <div class="card-actions">
                    <div class="qty">
                      <button type="button" data-action="dec" data-id="${item.id}">−</button>
                      <span>${qty}</span>
                      <button type="button" data-action="inc" data-id="${item.id}">＋</button>
                    </div>
                    <button class="btn btn-primary" type="button" data-action="add" data-id="${item.id}">
                      加入
                    </button>
                  </div>
                </article>
              `;
            })
            .join("")}
        </div>
      </section>
    `
    )
    .join("");
}

els.menuRoot.addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-action]");
  if (!btn) return;
  const item = findItem(btn.dataset.id);
  if (!item) return;
  const current = getQty(item.id);
  if (btn.dataset.action === "add" || btn.dataset.action === "inc") {
    setQty(item, current + 1);
  } else if (btn.dataset.action === "dec") {
    setQty(item, current - 1);
  }
});

function renderCartList() {
  const items = cartItems();
  if (!items.length) {
    els.cartList.innerHTML = `<div class="empty">購物車是空的</div>`;
    return;
  }
  els.cartList.innerHTML =
    items
      .map(
        (item) => `
      <div class="cart-item">
        <div>
          <strong>${item.name}</strong>
          <div style="color:var(--muted);font-size:0.88rem;">$${item.price} × ${item.qty}</div>
        </div>
        <div class="qty">
          <button type="button" data-cart="dec" data-id="${item.id}">−</button>
          <span>${item.qty}</span>
          <button type="button" data-cart="inc" data-id="${item.id}">＋</button>
        </div>
        <div style="grid-column:1/-1;text-align:right;font-weight:700;">
          $${item.price * item.qty}
        </div>
      </div>
    `
      )
      .join("") +
    `<div style="text-align:right;font-size:1.1rem;">合計 <strong>$${cartTotal()}</strong></div>`;
}

els.cartList.addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-cart]");
  if (!btn) return;
  const item = findItem(btn.dataset.id);
  if (!item) return;
  const current = getQty(item.id);
  setQty(item, btn.dataset.cart === "inc" ? current + 1 : current - 1);
});

function openCart() {
  renderCartList();
  els.cartModal.classList.add("open");
}

function closeCart() {
  els.cartModal.classList.remove("open");
}

els.openCartBtn.addEventListener("click", openCart);
els.closeCartBtn.addEventListener("click", closeCart);
els.cartModal.addEventListener("click", (e) => {
  if (e.target === els.cartModal) closeCart();
});

els.submitBtn.addEventListener("click", async () => {
  const items = cartItems();
  if (!items.length) {
    toast("請先選擇餐點");
    return;
  }
  const customerName = els.name.value.trim();
  if (!customerName) {
    toast("請填寫取餐姓名");
    els.name.focus();
    return;
  }

  els.submitBtn.disabled = true;
  try {
    const order = await OrderStore.create({
      customerName,
      phone: els.phone.value.trim(),
      note: els.noteInput.value.trim(),
      items,
    });
    state.cart.clear();
    updateCartDock();
    renderMenu();
    closeCart();
    els.name.value = "";
    els.phone.value = "";
    els.noteInput.value = "";
    toast(`訂單已送出：${order.orderNo}`);
  } catch (err) {
    toast(err.message || "送出失敗");
  } finally {
    els.submitBtn.disabled = false;
  }
});

els.note.textContent = MENU.restaurant.note;
renderMenu();
updateCartDock();
initSyncBanner("sync-banner");
OrderStore.ready();
