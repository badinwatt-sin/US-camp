/* US Camp — quick-access button (bottom-right).
   A small round button that opens a short menu: browse the shop, design your camp, track an order, cart.
   Stays out of the way: hidden over the homepage hero, while scrolling down, inside the configurator
   or the booking form, and while a cart drawer or dialog is open. */
(function () {
  'use strict';
  const S = window.USCampStore;
  const page = /shop\.html/.test(location.pathname) ? 'shop' : /track\.html/.test(location.pathname) ? 'track' : 'home';
  const onHome = page === 'home';

  const links = [
    { id: 'shop', href: 'shop.html', label: 'เลือกดูสินค้า', sub: 'เต้นท์และอุปกรณ์', icon: '<path d="M4 8h16l-1.5 11a2 2 0 0 1-2 1.7H7.5a2 2 0 0 1-2-1.7Z M8.5 8V6.5a3.5 3.5 0 0 1 7 0V8"/>' },
    { id: 'build', href: onHome ? '#build' : 'index.html#build', label: 'ออกแบบแคมป์ของคุณ', sub: 'Build Your Camp', icon: '<path d="M3 20 L12 5 L21 20 Z M10 20 L12 14 L14 20"/>' },
    { id: 'track', href: 'track.html', label: 'ติดตามคำสั่งซื้อ', sub: 'ดูสถานะพัสดุ', icon: '<path d="M3 7h11v9H3Z M14 10h4l3 3v3h-7 M7 19.5a1.5 1.5 0 1 0 0-.01 M17 19.5a1.5 1.5 0 1 0 0-.01"/>' }
  ].filter((l) => l.id !== page);

  const el = document.createElement('div');
  el.className = 'qnav';
  el.innerHTML = `
    <div class="qnav__menu" id="qnavMenu" role="menu" aria-label="ทางลัด">
      ${links.map((l) => `<a class="qnav__item" role="menuitem" href="${l.href}"><svg viewBox="0 0 24 24" aria-hidden="true">${l.icon}</svg><span><b>${l.label}</b><small>${l.sub}</small></span></a>`).join('')}
      <button class="qnav__item qnav__cart" role="menuitem" type="button" data-open-cart hidden><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 4h2l2.4 11.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.5L21 8H6.2"/></svg><span><b>ตะกร้าสินค้า</b><small data-qnav-count></small></span></button>
    </div>
    <button class="qnav__btn" type="button" aria-expanded="false" aria-controls="qnavMenu" aria-label="เปิดเมนูทางลัด">
      <svg class="qnav__ico qnav__ico--open" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 19 L12 5 L21 19 Z M10 19 L12 13 L14 19"/></svg>
      <svg class="qnav__ico qnav__ico--close" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6 L18 18 M18 6 L6 18"/></svg>
      <i class="qnav__dot" hidden></i>
    </button>`;
  document.body.appendChild(el);
  const btn = el.querySelector('.qnav__btn');

  const setOpen = (open) => {
    el.classList.toggle('is-open', open);
    btn.setAttribute('aria-expanded', open);
    btn.setAttribute('aria-label', open ? 'ปิดเมนูทางลัด' : 'เปิดเมนูทางลัด');
    if (open) setTimeout(() => { const f = el.querySelector('.qnav__item'); f && f.focus({ preventScroll: true }); }, 60);
  };
  btn.addEventListener('click', () => setOpen(!el.classList.contains('is-open')));
  el.addEventListener('click', (e) => { if (e.target.closest('.qnav__item')) setOpen(false); });
  document.addEventListener('click', (e) => { if (!el.contains(e.target)) setOpen(false); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && el.classList.contains('is-open')) { setOpen(false); btn.focus(); } });

  // cart entry + small dot on the button when the cart has items
  function syncCart() {
    const n = S ? S.cart.count() : 0;
    el.querySelector('.qnav__cart').hidden = !n;
    el.querySelector('[data-qnav-count]').textContent = n ? `${n} ชิ้นในตะกร้า` : '';
    el.querySelector('.qnav__dot').hidden = !n;
  }
  document.addEventListener('uscamp:store', syncCart);
  syncCart();

  // visibility rules
  let lastY = window.scrollY, idle = null, scrollingDown = false;
  const zones = onHome ? ['build', 'visit'].map((id) => document.getElementById(id)).filter(Boolean) : [];
  function inZone() {
    const h = window.innerHeight;
    return zones.some((z) => { const r = z.getBoundingClientRect(); return r.top < h * 0.55 && r.bottom > h * 0.45; });
  }
  function update() {
    const y = window.scrollY;
    const pastHero = onHome ? y > window.innerHeight * 0.8 : true;
    const blocked = document.body.classList.contains('no-scroll') || document.querySelector('dialog[open]');
    const show = pastHero && !scrollingDown && !inZone() && !blocked;
    el.classList.toggle('is-on', !!show || el.classList.contains('is-open'));
  }
  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    if (Math.abs(y - lastY) > 6) { scrollingDown = y > lastY; lastY = y; }
    if (scrollingDown && el.classList.contains('is-open')) setOpen(false);
    update();
    clearTimeout(idle);
    idle = setTimeout(() => { scrollingDown = false; update(); }, 900);
  }, { passive: true });
  new MutationObserver(update).observe(document.body, { attributes: true, attributeFilter: ['class'] });
  update();
})();
