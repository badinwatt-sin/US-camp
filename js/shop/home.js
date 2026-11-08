/* US Camp — homepage ↔ shop bridge: 360° studio "add to cart" and Camp Card "order this camp" */
(function () {
  'use strict';
  const C = window.USCampCatalog, S = window.USCampStore, UI = window.USCampUI;
  const $ = (s) => document.querySelector(s);
  const studio = window.USCampStudio && window.USCampStudio.state;

  /* studio: price + add the tent in the chosen colour */
  function syncStudio() {
    if (!studio) return;
    const r = C.resolve('tent-' + studio.model, studio.color);
    if (r) $('#studioPrice').textContent = S.thb(r.price);
  }
  if ($('#studioAdd')) {
    $('#studioAdd').addEventListener('click', () => {
      UI.add('tent-' + studio.model, studio.color, 1, { open: true });
      if (studio.awning && studio.model === 'traveler') UI.toast('เพิ่มเต้นท์แล้ว · ผนังข้างกันสาดเลือกเพิ่มได้ที่ร้านค้า');
    });
    // the studio changes model/colour via chips & swatches; refresh the price after any click there
    document.querySelector('.studio__panel').addEventListener('click', () => setTimeout(syncStudio, 0));
    syncStudio();
  }

  /* Camp Card → cart: tent + every option, using the same option → product mapping as the configurator */
  function campItems() {
    const model = $('.build [data-group="model"] .is-active');
    const color = $('.build [data-group="color"] .is-active');
    if (!model || !color || !window.USCampGear) return null;
    const m = model.dataset.id, c = color.dataset.id;
    const all = [...window.USCampData.items.shelter, ...window.USCampData.items.living];
    const picked = Array.from(document.querySelectorAll('.build .item.is-active')).map((b) => all.find((i) => i.id === b.dataset.id));
    const items = [['tent-' + m, c]];
    picked.forEach((i) => window.USCampGear.lines(i, m).forEach((l) => items.push([l.id, l.variant])));
    return { items, notSold: [] };
  }
  function syncCamp() {
    const r = campItems(); if (!r || !$('#campPrice')) return;
    // the configurator keeps #campPrice up to date
  }
  if ($('#orderCamp')) {
    $('#orderCamp').addEventListener('click', () => {
      const r = campItems(); if (!r) return;
      r.items.forEach(([id, v]) => S.cart.add(id, v, 1));
      UI.openCart();
      UI.toast(r.notSold.length ? `เพิ่ม ${r.items.length} รายการแล้ว · ของตกแต่งอื่นให้ Camp Advisor ช่วยจัดหา` : `เพิ่ม ${r.items.length} รายการลงตะกร้าแล้ว`);
    });
    const obs = new MutationObserver(() => syncCamp());
    obs.observe(document.querySelector('.build__panel'), { subtree: true, attributes: true, attributeFilter: ['class'] });
    syncCamp();
  }
})();
