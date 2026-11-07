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

  /* Camp Card → cart: tent + the shelter items we actually sell */
  const TARP = { compact: '6x8', outfitter: '7x9', vagabond: '8x10', traveler: '10x10' };
  const FLY = { compact: 'compact', outfitter: 'compact', vagabond: 'medium', traveler: 'medium' };
  function campItems() {
    const model = $('.build [data-group="model"] .is-active');
    const color = $('.build [data-group="color"] .is-active');
    if (!model || !color) return null;
    const m = model.dataset.id, c = color.dataset.id;
    const picked = Array.from(document.querySelectorAll('.build .item.is-active')).map((b) => b.dataset.id);
    const items = [['tent-' + m, c]];
    if (picked.includes('tarp')) items.push(['ground-tarp', TARP[m]]);
    if (picked.includes('fly')) items.push(['stormfly', FLY[m]]);
    if (picked.includes('awning') && m === 'traveler') items.push(['portico', null]);
    if (picked.includes('stove')) items.push(['stove-jack', null]);
    if (picked.includes('loft')) items.push(['organizer', null]);
    if (picked.includes('rug')) items.push(['door-mat', null]);
    if (picked.includes('lantern')) items.push(['lantern-strap', null]);
    const notSold = picked.filter((x) => ['chairs', 'table', 'lights', 'fire', 'cooler', 'cot'].includes(x) || (x === 'awning' && m !== 'traveler'));
    return { items, notSold };
  }
  function syncCamp() {
    const r = campItems(); if (!r || !$('#campPrice')) return;
    $('#campPrice').textContent = S.thb(r.items.reduce((s, [id, v]) => s + C.resolve(id, v).price, 0));
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
