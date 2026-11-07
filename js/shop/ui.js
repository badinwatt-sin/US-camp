/* US Camp — shared commerce UI: demo notice, cart button + drawer, toasts, mobile nav */
(function () {
  'use strict';
  const S = window.USCampStore;
  const $ = (s, c = document) => c.querySelector(s);
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));

  /* ---------- toast (reuses the homepage toast if present) ---------- */
  function toast(msg) {
    if (window.USCampToast) { window.USCampToast(msg); return; }
    let t = $('#toast');
    if (!t) { t = document.createElement('div'); t.id = 'toast'; t.className = 'toast'; t.setAttribute('role', 'status'); document.body.appendChild(t); }
    t.textContent = msg; t.classList.add('is-on');
    clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('is-on'), 2800);
  }

  /* ---------- cart drawer ---------- */
  const drawer = document.createElement('div');
  drawer.className = 'drawer';
  drawer.id = 'cartDrawer';
  drawer.hidden = true;
  drawer.innerHTML = `
    <div class="drawer__scrim" data-close></div>
    <aside class="drawer__panel" role="dialog" aria-modal="true" aria-labelledby="cartTitle">
      <header class="drawer__head">
        <h2 id="cartTitle">ตะกร้าสินค้า <span id="cartHeadCount"></span></h2>
        <button class="icon-btn" data-close aria-label="ปิดตะกร้า">✕</button>
      </header>
      <p class="demo-note">โหมดสาธิต · ราคาจำลอง รอยืนยันราคาจริง</p>
      <div class="drawer__body" id="cartBody"></div>
      <footer class="drawer__foot" id="cartFoot"></footer>
    </aside>`;
  document.body.appendChild(drawer);
  let lastFocus = null;

  function openCart() {
    lastFocus = document.activeElement;
    render();
    drawer.hidden = false;
    requestAnimationFrame(() => drawer.classList.add('is-open'));
    document.body.classList.add('no-scroll');
    setTimeout(() => { const f = drawer.querySelector('.drawer__panel button, .drawer__panel a'); f && f.focus(); }, 60);
  }
  function closeCart() {
    drawer.classList.remove('is-open');
    document.body.classList.remove('no-scroll');
    setTimeout(() => { drawer.hidden = true; lastFocus && lastFocus.focus && lastFocus.focus(); }, 320);
  }
  drawer.addEventListener('click', (e) => {
    if (e.target.closest('[data-close]')) { closeCart(); return; }
    const b = e.target.closest('[data-qty]');
    if (b) { const l = S.cart.lines().find((x) => x.key === b.dataset.key); if (l) S.cart.setQty(l.key, l.qty + (+b.dataset.qty)); return; }
    const r = e.target.closest('[data-remove]');
    if (r) { S.cart.remove(r.dataset.key); toast('นำสินค้าออกจากตะกร้าแล้ว'); }
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !drawer.hidden) closeCart(); });

  function render() {
    const lines = S.cart.lines();
    $('#cartHeadCount').textContent = lines.length ? `(${S.cart.count()})` : '';
    if (!lines.length) {
      $('#cartBody').innerHTML = `<div class="empty"><svg viewBox="0 0 48 48" aria-hidden="true"><path d="M6 40 L16 12 H32 L42 40 Z M20 40 L24 24 L28 40" fill="none" stroke="currentColor" stroke-width="2"/></svg><p>ตะกร้ายังว่างอยู่</p><a href="shop.html" class="btn btn--ink btn--sm">เลือกดูสินค้า</a></div>`;
      $('#cartFoot').innerHTML = '';
      return;
    }
    $('#cartBody').innerHTML = lines.map((l) => `
      <article class="line">
        <img src="${esc(l.image)}" alt="" />
        <div class="line__info">
          <h3>${esc(l.name)}</h3>
          ${l.label ? `<p class="line__var">${esc(l.label)}</p>` : ''}
          <p class="line__price">${S.thb(l.price)}</p>
          <div class="line__row">
            <div class="qty" role="group" aria-label="จำนวน">
              <button data-qty="-1" data-key="${esc(l.key)}" aria-label="ลดจำนวน">−</button>
              <output>${l.qty}</output>
              <button data-qty="1" data-key="${esc(l.key)}" aria-label="เพิ่มจำนวน">+</button>
            </div>
            <button class="link-btn" data-remove data-key="${esc(l.key)}">ลบ</button>
          </div>
        </div>
      </article>`).join('');
    const sub = S.cart.subtotal();
    const free = 20000 - sub;
    $('#cartFoot').innerHTML = `
      ${free > 0 ? `<p class="ship-hint">ซื้อเพิ่มอีก <b>${S.thb(free)}</b> รับสิทธิ์จัดส่งมาตรฐานฟรี</p>` : '<p class="ship-hint ship-hint--ok">✓ ได้สิทธิ์จัดส่งมาตรฐานฟรี</p>'}
      <div class="sum-row"><span>ยอดรวมสินค้า</span><b>${S.thb(sub)}</b></div>
      <p class="fine">ค่าจัดส่งคำนวณในขั้นตอนถัดไป · ราคารวม VAT แล้ว (จำลอง)</p>
      <a href="checkout.html" class="btn btn--ink btn--block">ดำเนินการสั่งซื้อ →</a>
      <button class="btn btn--line btn--block btn--sm" data-close>เลือกสินค้าต่อ</button>`;
  }

  /* ---------- header cart buttons ---------- */
  function syncBadges() {
    const n = S.cart.count();
    document.querySelectorAll('[data-cart-count]').forEach((b) => { b.textContent = n; b.hidden = n === 0; });
    if (!drawer.hidden) render();
  }
  document.addEventListener('click', (e) => { if (e.target.closest('[data-open-cart]')) { e.preventDefault(); openCart(); } });
  document.addEventListener('uscamp:store', syncBadges);
  syncBadges();

  function add(id, variant, qty = 1, opts = {}) {
    S.cart.add(id, variant, qty);
    const r = window.USCampCatalog.resolve(id, variant);
    document.querySelectorAll('.nav__cart').forEach((b) => { b.classList.remove('is-bump'); void b.offsetWidth; b.classList.add('is-bump'); });
    if (!opts.silent) toast(`เพิ่ม ${r ? r.product.short : 'สินค้า'} ลงตะกร้าแล้ว`);
    if (opts.open) openCart();
  }

  /* ---------- commerce-page nav (the homepage has its own in main.js) ---------- */
  const burger = $('#burger'), nav = $('#nav');
  if (burger && nav && document.body.classList.contains('commerce')) {
    burger.addEventListener('click', () => {
      const open = nav.classList.toggle('is-open');
      burger.setAttribute('aria-expanded', open);
      document.body.classList.toggle('no-scroll', open);
    });
    document.querySelectorAll('#navLinks a').forEach((a) => a.addEventListener('click', () => { nav.classList.remove('is-open'); document.body.classList.remove('no-scroll'); }));
  }

  window.USCampUI = { openCart, closeCart, add, toast, esc, renderCart: render };
})();
