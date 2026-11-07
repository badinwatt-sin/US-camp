/* US Camp — shop page: catalogue grid + product dialog */
(function () {
  'use strict';
  const C = window.USCampCatalog, S = window.USCampStore, UI = window.USCampUI, esc = UI.esc;
  const $ = (s, c = document) => c.querySelector(s);
  const catName = { tents: 'เต้นท์ Springbar®', shelter: 'อุปกรณ์เสริมเต้นท์', gear: 'ของใช้ในแคมป์', bags: 'กระเป๋า' };

  let cat = 'all', sort = 'featured';
  const tabs = $('#catTabs');
  tabs.innerHTML = C.categories.map((c) => `<button role="tab" class="tab${c.id === cat ? ' is-active' : ''}" data-cat="${c.id}" aria-selected="${c.id === cat}">${c.label}</button>`).join('');
  tabs.addEventListener('click', (e) => {
    const b = e.target.closest('[data-cat]'); if (!b) return;
    cat = b.dataset.cat;
    tabs.querySelectorAll('.tab').forEach((t) => { t.classList.toggle('is-active', t === b); t.setAttribute('aria-selected', t === b); });
    render();
  });
  $('#sortSel').addEventListener('change', (e) => { sort = e.target.value; render(); });

  function minPrice(p) { return p.options ? Math.min(...p.options.map((o) => o.price)) : p.price; }

  function render() {
    let list = C.all.filter((p) => cat === 'all' || p.category === cat);
    if (sort === 'low') list = list.slice().sort((a, b) => minPrice(a) - minPrice(b));
    if (sort === 'high') list = list.slice().sort((a, b) => minPrice(b) - minPrice(a));
    $('#grid').innerHTML = list.map((p) => {
      const from = p.options ? 'เริ่มต้น ' : '';
      const sw = p.type === 'tent' ? `<div class="card-sw">${p.variants.map((v) => `<i style="--c:${v.swatch}" title="${esc(v.label)}"></i>`).join('')}</div>` : '';
      return `<article class="pcard${p.type === 'tent' ? ' pcard--tent' : ''}">
        <button class="pcard__hit" data-open="${p.id}" aria-label="ดูรายละเอียด ${esc(p.name)}"></button>
        <div class="pcard__img"><img src="${esc(p.image(p.type === 'tent' ? 'natural' : undefined))}" alt="" loading="lazy" /></div>
        <div class="pcard__body">
          <p class="pcard__cat">${catName[p.category]}</p>
          <h3>${esc(p.name)}</h3>
          ${p.type === 'tent' ? `<p class="pcard__meta">${esc(p.specs[0][1])} · นอน ${esc(p.specs[2][1])}</p>` : `<p class="pcard__meta">${esc(p.th)}</p>`}
          ${sw}
          <p class="pcard__price">${from}${S.thb(minPrice(p))} <small>ราคาจำลอง</small></p>
        </div>
        <button class="pcard__quick" data-quick="${p.id}" aria-label="เพิ่ม ${esc(p.name)} ลงตะกร้า">+ ตะกร้า</button>
      </article>`;
    }).join('');
  }

  /* ---------- product dialog ---------- */
  const dlg = $('#pd');
  let cur = null, variant = null, qty = 1, view = 'front';

  function open(id) {
    cur = C.byId(id); if (!cur) return;
    variant = cur.type === 'tent' ? cur.variants[0].id : (cur.options ? cur.options[0].id : null);
    qty = 1; view = 'front';
    $('#pdCat').textContent = catName[cur.category];
    $('#pdName').textContent = cur.name;
    $('#pdTag').textContent = cur.tag || cur.th || '';
    $('#pdDesc').textContent = cur.desc;
    $('#pdLead').textContent = cur.leadTime;
    $('#pdSpecs').innerHTML = (cur.specs || []).map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('');
    renderVariant();
    if (typeof dlg.showModal === 'function') dlg.showModal(); else dlg.setAttribute('open', '');
    document.body.classList.add('no-scroll');
    try { history.replaceState(null, '', '#' + cur.id); } catch (e) { /* sandboxed preview */ }
  }
  function close() {
    if (dlg.open) dlg.close();
    document.body.classList.remove('no-scroll');
    try { history.replaceState(null, '', location.pathname); } catch (e) { /* sandboxed preview */ }
  }
  dlg.addEventListener('close', () => document.body.classList.remove('no-scroll'));
  dlg.addEventListener('click', (e) => { if (e.target === dlg) close(); });
  $('#pdClose').addEventListener('click', close);

  function renderVariant() {
    const r = C.resolve(cur.id, variant);
    $('#pdPrice').textContent = S.thb(r.price);
    const img = $('#pdImg');
    img.src = view === 'back' && cur.back ? cur.back : r.image;
    img.alt = `${cur.name}${r.label ? ' · ' + r.label : ''}`;
    $('#pdQty').textContent = qty;
    $('#pdAdd').textContent = `เพิ่มลงตะกร้า · ${S.thb(r.price * qty)}`;
    if (cur.type === 'tent') {
      $('#pdThumbs').innerHTML = `<button class="thumb${view === 'front' ? ' is-active' : ''}" data-view="front"><img src="${esc(r.image)}" alt="ด้านหน้า"/></button><button class="thumb${view === 'back' ? ' is-active' : ''}" data-view="back"><img src="${esc(cur.back)}" alt="ด้านหลัง"/></button>`;
      $('#pdVariants').innerHTML = `<p class="opt-label">สีผ้าแคนวาส: <b>${esc(r.label)}</b></p><div class="swatches">${cur.variants.map((v) => `<button class="swatch${v.id === variant ? ' is-active' : ''}" data-var="${v.id}" aria-label="${esc(v.label)}" style="--wall:${v.swatch};--roof:${v.roof}"></button>`).join('')}</div>`;
    } else if (cur.options) {
      $('#pdThumbs').innerHTML = '';
      $('#pdVariants').innerHTML = `<p class="opt-label">ตัวเลือก</p><div class="opts">${cur.options.map((o) => `<button class="opt${o.id === variant ? ' is-active' : ''}" data-var="${o.id}"><span>${esc(o.label)}</span><b>${S.thb(o.price)}</b></button>`).join('')}</div>`;
    } else {
      $('#pdThumbs').innerHTML = ''; $('#pdVariants').innerHTML = '';
    }
  }
  dlg.addEventListener('click', (e) => {
    const v = e.target.closest('[data-var]'); if (v) { variant = v.dataset.var; view = 'front'; renderVariant(); return; }
    const t = e.target.closest('[data-view]'); if (t) { view = t.dataset.view; renderVariant(); }
  });
  $('#pdMinus').addEventListener('click', () => { qty = Math.max(1, qty - 1); renderVariant(); });
  $('#pdPlus').addEventListener('click', () => { qty = Math.min(99, qty + 1); renderVariant(); });
  $('#pdAdd').addEventListener('click', () => { UI.add(cur.id, variant, qty); close(); UI.openCart(); });
  $('#pdBuyNow').addEventListener('click', () => { UI.add(cur.id, variant, qty, { silent: true }); location.href = 'checkout.html'; });

  document.addEventListener('click', (e) => {
    const o = e.target.closest('[data-open]'); if (o) { open(o.dataset.open); return; }
    const q = e.target.closest('[data-quick]');
    if (q) {
      const p = C.byId(q.dataset.quick);
      if (p.type === 'tent' || p.options) open(p.id); else UI.add(p.id, null, 1, { open: false });
    }
  });

  render();
  const deep = location.hash.slice(1);
  if (deep && C.byId(deep)) open(deep);
})();
