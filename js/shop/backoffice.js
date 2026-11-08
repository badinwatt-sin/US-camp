/* US Camp — back office (demo): stock, POS, sales summary. Uses USCampInventory + USCampStore. */
(function () {
  'use strict';
  const I = window.USCampInventory, S = window.USCampStore, UI = window.USCampUI, esc = UI.esc;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const thb = S.thb;
  const MOVE = { opening: 'ยอดยกมา', receive: 'รับเข้า', 'sale-web': 'ขายหน้าเว็บ', 'sale-pos': 'ขายหน้าร้าน', adjust: 'ปรับยอด', return: 'คืนสต็อก' };

  /* ---------- tabs ---------- */
  let pane = 'orders';
  function show(p) {
    pane = p;
    $$('.ad-tab').forEach((t) => { const on = t.dataset.pane === p; t.classList.toggle('is-active', on); t.setAttribute('aria-selected', on); });
    $$('.ad-pane').forEach((x) => x.classList.toggle('is-active', x.dataset.pane === p));
    renderPane();
    try { history.replaceState(null, '', '#' + p); } catch (e) { /* sandboxed */ }
  }
  $$('.ad-tab').forEach((t) => t.addEventListener('click', () => show(t.dataset.pane)));
  let seeding = false;
  function renderPane() {
    if ($('#app').hidden || seeding) return;
    I.syncOrders();
    if (window.USCampReceipts) window.USCampReceipts.syncAll();
    if (pane === 'stock') renderStock();
    if (pane === 'pos') renderPos();
    if (pane === 'report') renderReport();
    if (pane === 'receipts') renderReceipts();
  }
  document.addEventListener('uscamp:store', () => { I.syncOrders(); renderPane(); });
  document.addEventListener('uscamp:inventory', renderPane);
  document.addEventListener('uscamp:receipts', () => { if (pane === 'receipts') renderReceipts(); });
  // the gate in admin.js reveals #app; render the chosen pane once it does
  new MutationObserver(() => { if (!$('#app').hidden) { const h = location.hash.slice(1); show(['stock', 'pos', 'report', 'receipts'].includes(h) ? h : pane); } }).observe($('#app'), { attributes: true, attributeFilter: ['hidden'] });

  /* =========================================================
     STOCK
     ========================================================= */
  let stGroup = 'all', stQ = '';
  $('#stFilter').addEventListener('click', (e) => { const b = e.target.closest('[data-g]'); if (!b) return; stGroup = b.dataset.g; $$('#stFilter .tab').forEach((t) => t.classList.toggle('is-active', t === b)); renderStock(); });
  $('#stQ').addEventListener('input', (e) => { stQ = e.target.value.trim().toLowerCase(); renderStock(); });

  function stockRows() {
    return I.skuList().map((s) => {
      const on = I.onHand(s.sku), res = I.reserved(s.sku), av = on - res, ro = I.reorderOf(s);
      return Object.assign({}, s, { on, res, av, ro, cost: I.costOf(s), state: av <= 0 ? 'out' : av <= ro ? 'low' : 'ok' });
    });
  }
  function renderStock() {
    const rows = stockRows();
    const units = rows.reduce((n, r) => n + Math.max(0, r.on), 0);
    $('#stKpis').innerHTML = [
      ['จำนวน SKU', rows.length, ''],
      ['ชิ้นในคลัง', units.toLocaleString('th-TH'), ''],
      ['มูลค่าสต็อก (ทุน)', thb(I.stockValue()), ''],
      ['ใกล้หมด', rows.filter((r) => r.state === 'low').length, 'warn'],
      ['หมด / ติดจอง', rows.filter((r) => r.state === 'out').length, 'bad']
    ].map(([k, v, t]) => `<div class="kpi${t ? ' kpi--' + t : ''}"><span>${k}</span><b>${v}</b></div>`).join('');
    const list = rows.filter((r) => (stGroup === 'all' || (stGroup === 'low' ? r.state !== 'ok' : r.group === stGroup)) && (!stQ || (r.name + ' ' + r.label + ' ' + r.sku).toLowerCase().includes(stQ)));
    const badge = { ok: '<span class="badge badge--ok">พร้อมขาย</span>', low: '<span class="badge badge--warn">ใกล้หมด</span>', out: '<span class="badge badge--bad">หมด</span>' };
    $('#stTable').innerHTML = `<thead><tr><th>สินค้า</th><th>SKU</th><th class="r">คงคลัง</th><th class="r">ติดจอง</th><th class="r">ขายได้</th><th class="r">ทุน/ชิ้น</th><th>สถานะ</th><th></th></tr></thead><tbody>${
      list.map((r) => `<tr><td><span class="st-name"><img src="${esc(r.image)}" alt=""/><span><b>${esc(r.name)}</b>${r.label ? `<small>${esc(r.label)}</small>` : ''}</span></span></td><td class="mono">${esc(r.sku)}</td><td class="r num">${r.on}</td><td class="r num">${r.res || '–'}</td><td class="r num"><b>${r.av}</b></td><td class="r num">${thb(r.cost)}</td><td>${badge[r.state]}</td><td class="r"><button class="link-btn" data-recv="${esc(r.sku)}">รับเข้า</button></td></tr>`).join('')
    }</tbody>`;
    const names = Object.fromEntries(rows.map((r) => [r.sku, r.name + (r.label ? ' · ' + r.label : '')]));
    $('#stMoves').innerHTML = `<thead><tr><th>เวลา</th><th>ประเภท</th><th>สินค้า</th><th class="r">จำนวน</th><th>อ้างอิง / หมายเหตุ</th></tr></thead><tbody>${
      I.moves().filter((m) => m.type !== 'opening').slice(0, 25).map((m) => `<tr><td class="num">${S.dateTH(m.at)}</td><td><span class="mv mv--${m.type}">${MOVE[m.type] || m.type}</span></td><td>${esc(names[m.sku] || m.sku)}</td><td class="r num ${m.qty > 0 ? 'pos' : 'neg'}">${m.qty > 0 ? '+' : ''}${m.qty}</td><td>${esc(m.note || '')}</td></tr>`).join('') || '<tr><td colspan="5" class="muted">ยังไม่มีความเคลื่อนไหว ลองรับสินค้าเข้าหรือขายผ่าน POS</td></tr>'
    }</tbody>`;
  }

  /* receive / count dialog */
  const dlg = $('#stDlg');
  let dlgMode = 'receive';
  function openStock(mode, sku) {
    dlgMode = mode;
    const rows = stockRows();
    $('#stSku').innerHTML = rows.map((r) => `<option value="${esc(r.sku)}">${esc(r.name)}${r.label ? ' · ' + esc(r.label) : ''} (คงคลัง ${r.on})</option>`).join('');
    if (sku) $('#stSku').value = sku;
    $('#stDlgTitle').textContent = mode === 'receive' ? 'รับสินค้าเข้า' : 'ปรับยอดตรวจนับ';
    $('#stQtyLabel').textContent = mode === 'receive' ? 'จำนวนที่รับเข้า' : 'จำนวนที่นับได้จริง';
    $('#stCostWrap').hidden = mode !== 'receive';
    $('#stNote').placeholder = mode === 'receive' ? 'เช่น PO-2026-011 จาก Springbar' : 'เช่น ตรวจนับประจำเดือน';
    $('#stErr2').hidden = true; $('#stNote').value = '';
    syncDlg();
    dlg.showModal();
  }
  function syncDlg() {
    const r = stockRows().find((x) => x.sku === $('#stSku').value);
    $('#stQty').value = dlgMode === 'receive' ? 1 : r.on;
    $('#stCost').value = r.cost;
  }
  $('#stSku').addEventListener('change', syncDlg);
  $('#stReceiveBtn').addEventListener('click', () => openStock('receive'));
  $('#stCountBtn').addEventListener('click', () => openStock('count'));
  $('#stTable').addEventListener('click', (e) => { const b = e.target.closest('[data-recv]'); if (b) openStock('receive', b.dataset.recv); });
  $('#stCancel').addEventListener('click', () => dlg.close());
  $('#stForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const q = parseInt($('#stQty').value, 10), sku = $('#stSku').value, note = $('#stNote').value.trim();
    if (isNaN(q) || q < 0 || (dlgMode === 'receive' && q === 0)) { $('#stErr2').textContent = dlgMode === 'receive' ? 'ใส่จำนวนที่รับเข้าอย่างน้อย 1 ชิ้น' : 'ใส่จำนวนที่นับได้ (0 ขึ้นไป)'; $('#stErr2').hidden = false; return; }
    if (dlgMode === 'receive') { const c = parseInt($('#stCost').value, 10); I.receive(sku, q, note || 'รับสินค้าเข้า', isNaN(c) ? null : c); UI.toast(`รับเข้า ${q} ชิ้นแล้ว`); }
    else { I.adjust(sku, q, note || 'ปรับยอดหลังตรวจนับ'); UI.toast('ปรับยอดคงคลังแล้ว'); }
    dlg.close();
  });

  /* =========================================================
     POS
     ========================================================= */
  let bill = [], pay = 'cash', posQ = '';
  $('#posQ').addEventListener('input', (e) => { posQ = e.target.value.trim().toLowerCase(); renderPosGrid(); });
  $('#posQ').addEventListener('keydown', (e) => {
    if (e.key !== 'Enter') return;
    const hit = stockRows().find((r) => r.sku.toLowerCase() === posQ);
    if (hit) { addToBill(hit.sku); e.target.value = ''; posQ = ''; renderPosGrid(); }
  });
  function renderPos() { renderPosGrid(); renderBill(); }
  function renderPosGrid() {
    const rows = stockRows().filter((r) => !posQ || (r.name + ' ' + r.label + ' ' + r.sku).toLowerCase().includes(posQ));
    $('#posGrid').innerHTML = rows.map((r) => {
      const inBill = (bill.find((b) => b.sku === r.sku) || {}).qty || 0;
      const left = r.av - inBill;
      return `<button class="pos-item${left <= 0 ? ' is-out' : ''}" data-add="${esc(r.sku)}" ${left <= 0 ? 'disabled' : ''}><img src="${esc(r.image)}" alt=""/><b>${esc(r.name)}</b><small>${esc(r.label || ' ')}</small><span class="pos-item__foot"><em>${thb(r.price)}</em><i>${left <= 0 ? 'หมด' : 'เหลือ ' + left}</i></span></button>`;
    }).join('');
  }
  function addToBill(sku) {
    const r = stockRows().find((x) => x.sku === sku); if (!r) return;
    const b = bill.find((x) => x.sku === sku);
    const have = b ? b.qty : 0;
    if (have + 1 > r.av) { UI.toast('สต็อกไม่พอ'); return; }
    if (b) b.qty++; else bill.push({ sku, id: r.id, variant: r.variant, name: r.name, label: r.label, price: r.price, image: r.image, qty: 1 });
    renderPos();
  }
  $('#posGrid').addEventListener('click', (e) => { const b = e.target.closest('[data-add]'); if (b) addToBill(b.dataset.add); });
  function renderBill() {
    $('#posLines').innerHTML = bill.length ? bill.map((l) => `<div class="pos-line"><span><b>${esc(l.name)}</b>${l.label ? `<small>${esc(l.label)}</small>` : ''}</span><div class="qty"><button data-q="-1" data-sku="${esc(l.sku)}" aria-label="ลด">−</button><output>${l.qty}</output><button data-q="1" data-sku="${esc(l.sku)}" aria-label="เพิ่ม">+</button></div><em>${thb(l.price * l.qty)}</em></div>`).join('') : '<p class="muted pos__empty">แตะสินค้าทางซ้ายเพื่อเพิ่มลงบิล</p>';
    const total = bill.reduce((n, l) => n + l.price * l.qty, 0);
    $('#posSum').innerHTML = `<div class="sum-row"><span>รวม ${bill.reduce((n, l) => n + l.qty, 0)} ชิ้น</span><span></span></div><div class="sum-row"><span>ภาษีมูลค่าเพิ่ม 7% (รวมในราคา)</span><span>${thb(Math.round(total * 7 / 107))}</span></div><div class="sum-row sum-row--total"><span>ยอดชำระ</span><b>${thb(total)}</b></div>`;
    $('#posCharge').disabled = !bill.length;
    $('#posCharge').textContent = bill.length ? `ชำระเงิน ${thb(total)}` : 'ชำระเงิน';
    $('#posCash').hidden = pay !== 'cash';
    updateChange();
  }
  function updateChange() {
    const total = bill.reduce((n, l) => n + l.price * l.qty, 0), recv = parseInt(S.digits($('#posRecv').value), 10) || 0;
    $('#posChange').textContent = recv ? (recv >= total ? `เงินทอน ${thb(recv - total)}` : `ยังขาดอีก ${thb(total - recv)}`) : '';
    $('#posChange').classList.toggle('is-short', recv > 0 && recv < total);
  }
  $('#posRecv').addEventListener('input', updateChange);
  $('#posLines').addEventListener('click', (e) => {
    const b = e.target.closest('[data-q]'); if (!b) return;
    const l = bill.find((x) => x.sku === b.dataset.sku); if (!l) return;
    if (+b.dataset.q > 0) { addToBill(l.sku); return; }
    l.qty--; if (l.qty <= 0) bill = bill.filter((x) => x !== l);
    renderPos();
  });
  $('#posPay').addEventListener('click', (e) => {
    const b = e.target.closest('[data-pay]'); if (!b) return;
    pay = b.dataset.pay;
    $$('#posPay .opt').forEach((x) => { const on = x === b; x.classList.toggle('is-active', on); x.setAttribute('aria-checked', on); });
    renderBill();
  });
  $('#posClear').addEventListener('click', () => { bill = []; $('#posRecv').value = ''; renderPos(); });
  $('#posCharge').addEventListener('click', () => {
    const total = bill.reduce((n, l) => n + l.price * l.qty, 0);
    if (pay === 'cash' && (parseInt(S.digits($('#posRecv').value), 10) || 0) < total) { UI.toast('ใส่จำนวนเงินที่รับมาให้ครบก่อน'); $('#posRecv').focus(); return; }
    const name = $('#posCust').value.trim();
    const o = I.posSale(bill, pay, name ? { name } : null);
    UI.toast(`บันทึกการขาย ${o.no} · ${thb(total)} · ตัดสต็อกแล้ว`);
    if (window.USCampReceipts) { const rc = window.USCampReceipts.ensure(o); setTimeout(() => window.USCampReceipts.open(rc), 250); }
    bill = []; $('#posRecv').value = ''; $('#posCust').value = '';
    renderPos();
  });

  /* =========================================================
     REPORT
     ========================================================= */
  let range = '30';
  $('#rpRange').addEventListener('click', (e) => { const b = e.target.closest('[data-r]'); if (!b) return; range = b.dataset.r; $$('#rpRange .tab').forEach((t) => t.classList.toggle('is-active', t === b)); renderReport(); });
  function bounds() {
    const now = new Date();
    if (range === 'all') return [null, null, null];
    if (range === 'month') { const f = new Date(now.getFullYear(), now.getMonth(), 1); return [f.toISOString(), null, f]; }
    const f = new Date(now); f.setHours(0, 0, 0, 0); f.setDate(f.getDate() - (+range - 1));
    return [f.toISOString(), null, f];
  }
  let lastReport = null;
  function renderReport() {
    const [from, to, fromDate] = bounds();
    const r = I.report(from, to); lastReport = r;
    $('#rpKpis').innerHTML = [
      ['ยอดขายรวม (รวม VAT)', thb(r.gross)],
      ['จำนวนบิล', r.orders],
      ['เฉลี่ยต่อบิล', thb(r.aov)],
      ['กำไรขั้นต้น (ประมาณ)', thb(r.profit)],
      ['อัตรากำไร', (r.margin * 100).toFixed(1) + '%']
    ].map(([k, v]) => `<div class="kpi"><span>${k}</span><b>${v}</b></div>`).join('');
    $('#rpPL').innerHTML = [
      ['ยอดขายรวม VAT', r.gross, ''], ['หัก ภาษีขาย 7%', -r.vat, 'sub'], ['ยอดขายสุทธิ', r.net, 'strong'],
      ['หัก ต้นทุนขาย (ก่อน VAT)', -r.cogsExVat, 'sub'], ['หัก ค่าธรรมเนียมรับชำระ', -r.fees, 'sub'], ['กำไรขั้นต้น', r.profit, 'total'],
      ['มูลค่าสต็อกคงเหลือ (ทุน)', I.stockValue(), 'note']
    ].map(([k, v, c]) => `<div class="pl__row ${c}"><dt>${k}</dt><dd>${v < 0 ? '−' + thb(-v) : thb(v)}</dd></div>`).join('');
    drawChart(r, fromDate);
    const prods = Object.entries(r.byProduct).sort((a, b) => b[1].revenue - a[1].revenue);
    $('#rpProducts').innerHTML = `<thead><tr><th>สินค้า</th><th class="r">ชิ้น</th><th class="r">ยอดขาย</th><th class="r">กำไร*</th></tr></thead><tbody>${
      prods.map(([, p]) => `<tr><td><b>${esc(p.name)}</b>${p.label ? `<small class="muted"> · ${esc(p.label)}</small>` : ''}</td><td class="r num">${p.qty}</td><td class="r num">${thb(p.revenue)}</td><td class="r num">${thb(Math.round(p.revenue * 100 / 107 - p.cost * 100 / 107))}</td></tr>`).join('') || '<tr><td colspan="4" class="muted">ยังไม่มียอดขายในช่วงนี้</td></tr>'
    }</tbody>`;
    const pays = Object.entries(r.byPay).sort((a, b) => b[1] - a[1]);
    $('#rpPay').innerHTML = `<thead><tr><th>วิธีชำระ</th><th class="r">ยอด</th><th class="r">สัดส่วน</th></tr></thead><tbody>${
      pays.map(([k, v]) => `<tr><td>${esc(k)}</td><td class="r num">${thb(v)}</td><td class="r num">${r.gross ? (v / r.gross * 100).toFixed(0) : 0}%</td></tr>`).join('') || '<tr><td colspan="3" class="muted">–</td></tr>'
    }<tr class="sub"><td>หน้าเว็บ / หน้าร้าน</td><td class="r num" colspan="2">${thb(r.byChannel.web)} / ${thb(r.byChannel.pos)}</td></tr></tbody>`;
  }

  /* daily stacked bars (web + POS), one shared scale, hover tooltip */
  function drawChart(r, fromDate) {
    const el = $('#rpChart');
    const days = Object.keys(r.byDay).sort();
    const start = fromDate || (days[0] ? new Date(days[0]) : new Date());
    const end = new Date(); end.setHours(0, 0, 0, 0);
    const list = [];
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const k = d.toISOString().slice(0, 10); list.push({ k, d: new Date(d), web: (r.byDay[k] || {}).web || 0, pos: (r.byDay[k] || {}).pos || 0 });
      if (list.length > 62) break;
    }
    if (!list.length || !r.gross) { el.innerHTML = '<p class="muted chart__empty">ยังไม่มียอดขายในช่วงนี้ ลองขายผ่าน POS หรือกด “สร้างคำสั่งซื้อตัวอย่าง” ในแท็บคำสั่งซื้อ</p>'; return; }
    const max = Math.max(...list.map((x) => x.web + x.pos));
    const step = niceStep(max / 4), top = Math.ceil(max / step) * step || step;
    const W = 640, H = 220, L = 54, B = 26, T = 8, bw = (W - L - 8) / list.length;
    const y = (v) => T + (H - T - B) * (1 - v / top);
    let svg = '';
    for (let v = 0; v <= top; v += step) svg += `<line x1="${L}" x2="${W - 4}" y1="${y(v)}" y2="${y(v)}" class="grid"/><text x="${L - 8}" y="${y(v) + 4}" class="ax" text-anchor="end">${short(v)}</text>`;
    list.forEach((x, i) => {
      const x0 = L + i * bw + bw * 0.18, w = Math.max(2, bw * 0.64);
      const hw = (H - T - B) * x.web / top, hp = (H - T - B) * x.pos / top;
      const base = y(0);
      if (x.web) svg += `<rect x="${x0}" y="${base - hw}" width="${w}" height="${hw}" rx="${Math.min(3, w / 2)}" class="b-web"/>`;
      if (x.pos) svg += `<rect x="${x0}" y="${base - hw - hp - (x.web ? 2 : 0)}" width="${w}" height="${hp}" rx="${Math.min(3, w / 2)}" class="b-pos"/>`;
      svg += `<rect x="${L + i * bw}" y="${T}" width="${bw}" height="${H - T - B}" class="hit" data-i="${i}"/>`;
      if (list.length <= 10 || i % Math.ceil(list.length / 8) === 0) svg += `<text x="${x0 + w / 2}" y="${H - 8}" class="ax" text-anchor="middle">${x.d.getDate()}/${x.d.getMonth() + 1}</text>`;
    });
    el.innerHTML = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="กราฟยอดขายรายวัน แยกหน้าเว็บและหน้าร้าน">${svg}</svg><div class="tip" hidden></div>`;
    const tip = el.querySelector('.tip');
    el.querySelectorAll('.hit').forEach((h) => {
      const x = list[+h.dataset.i];
      const showTip = () => {
        tip.hidden = false;
        tip.innerHTML = `<b>${x.d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}</b><span><i style="--c:var(--ch-web)"></i>หน้าเว็บ ${thb(x.web)}</span><span><i style="--c:var(--ch-pos)"></i>หน้าร้าน ${thb(x.pos)}</span><span>รวม ${thb(x.web + x.pos)}</span>`;
        const bx = h.getBoundingClientRect(), cx = el.getBoundingClientRect();
        tip.style.left = Math.min(cx.width - 170, Math.max(0, bx.left - cx.left + bx.width / 2 - 80)) + 'px';
      };
      h.addEventListener('pointerenter', showTip); h.addEventListener('click', showTip);
      h.addEventListener('pointerleave', () => { tip.hidden = true; });
    });
  }
  function niceStep(raw) { const p = Math.pow(10, Math.floor(Math.log10(raw || 1))); const n = raw / p; return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * p; }
  function short(v) { return v >= 1e6 ? (v / 1e6).toFixed(1).replace('.0', '') + 'M' : v >= 1e3 ? Math.round(v / 1e3) + 'k' : String(v); }

  /* demo: the 'sample orders' button also adds ~3 weeks of backdated sales so the summary has a history */
  $('#seed').addEventListener('click', () => {
    seeding = true;
    const picks = [['tent-compact', 'natural'], ['tent-vagabond', 'suntan'], ['ground-tarp', '8x10'], ['stake', null], ['tote', null], ['door-mat', null], ['tent-outfitter', 'driftwood'], ['lantern-strap', null], ['organizer', null], ['weekender', null]];
    const pays = ['card', 'promptpay', 'transfer', 'cash', 'promptpay'];
    for (let i = 0; i < 12; i++) {
      const d = new Date(); d.setDate(d.getDate() - (2 + Math.round(i * 1.7))); d.setHours(11 + (i % 6), 15 * (i % 4));
      const [id, v] = picks[i % picks.length], extra = picks[(i * 3 + 2) % picks.length];
      const mk = (pid, pv, q) => { const r = window.USCampCatalog.resolve(pid, pv); return { id: pid, variant: pv, name: r.product.name, label: r.label, price: r.price, qty: q, image: r.image, sku: I.skuOf(pid, pv) }; };
      const lines = [mk(id, v, 1), mk(extra[0], extra[1], extra[0] === 'stake' ? 6 : 1)];
      if (lines.some((l) => I.available(l.sku) < l.qty)) continue;
      const pay = pays[i % pays.length];
      let o;
      if (pay === 'cash' || i % 3 === 0) o = I.posSale(lines, pay === 'card' ? 'card' : pay === 'transfer' ? 'promptpay' : pay, null);
      else {
        const sub = lines.reduce((n, l) => n + l.price * l.qty, 0), ship = sub >= 20000 ? 0 : 250;
        o = S.orders.create({ customer: { name: 'ลูกค้าตัวอย่าง ' + (i + 1), phone: '08' + String(10000000 + i * 7919).slice(0, 8), email: '' }, shipping: { method: 'standard', label: 'จัดส่งมาตรฐาน', eta: '2–4 วันทำการ', address: { line1: 'ที่อยู่ตัวอย่าง', subdistrict: '-', district: '-', province: 'กรุงเทพมหานคร', postcode: '10110', note: '' }, carrier: 'Kerry Express', trackingNo: 'KEXDEMO' + (100 + i) }, payment: { method: pay, label: { card: 'บัตรเครดิต/เดบิต', promptpay: 'พร้อมเพย์ QR', transfer: 'โอนผ่านธนาคาร' }[pay], status: 'paid' }, lines, totals: { subtotal: sub, shipping: ship, total: sub + ship, vat: Math.round((sub + ship) * 7 / 107) } });
        S.orders.update(o.no, { status: 'delivered' }, { status: 'delivered', note: 'ตัวอย่างย้อนหลัง', by: 'system', pay: 'paid' });
      }
      S.orders.update(o.no, { createdAt: d.toISOString(), payment: { paidAt: d.toISOString() } });
    }
    seeding = false;
    I.syncOrders();
    renderPane();
  });

  /* =========================================================
     RECEIPTS
     ========================================================= */
  const R = window.USCampReceipts;
  let rcF = 'all', rcQ = '', rcSel = new Set();
  const monthKey = (iso) => iso.slice(0, 7);
  const archLabel = () => (rcSel.size ? `จัดเก็บ ${rcSel.size} รายการที่เลือก (หลังบันทึก PDF แล้ว)` : 'จัดเก็บรายการที่เลือก (หลังบันทึก PDF แล้ว)');
  $('#rcFilter').addEventListener('click', (e) => { const b = e.target.closest('[data-f]'); if (!b) return; rcF = b.dataset.f; $$('#rcFilter .tab').forEach((t) => t.classList.toggle('is-active', t === b)); renderReceipts(); });
  $('#rcQ').addEventListener('input', (e) => { rcQ = e.target.value.trim().toLowerCase(); renderReceipts(); });
  $('#rcMonth').addEventListener('change', renderReceipts);
  function renderReceipts() {
    if (!R) return;
    R.syncAll();
    const all = R.list();
    const months = [...new Set(all.map((r) => monthKey(r.paidAt)))].sort().reverse();
    const cur = $('#rcMonth').value;
    $('#rcMonth').innerHTML = '<option value="">ทุกเดือน</option>' + months.map((m) => `<option value="${m}">${new Date(m + '-01').toLocaleDateString('th-TH', { month: 'long', year: 'numeric' })}</option>`).join('');
    if (months.includes(cur)) $('#rcMonth').value = cur;
    const m = $('#rcMonth').value;
    const list = all.filter((r) => (!m || monthKey(r.paidAt) === m)
      && (rcF === 'all' || (rcF === 'void' ? r.status === 'void' : rcF === 'archived' ? r.archived : (!r.archived && r.status !== 'void')))
      && (!rcQ || [r.no, r.orderNo, r.customer.name].join(' ').toLowerCase().includes(rcQ)));
    const bytes = R.storageBytes(), quota = 5 * 1024 * 1024;
    const slipBytes = S.orders.list().reduce((n, o) => n + ((o.payment.slip && o.payment.slip.image) ? o.payment.slip.image.length * 2 : 0), 0);
    $('#rcStore').innerHTML = `<p><b>พื้นที่ข้อมูลที่ใช้ (เบราว์เซอร์นี้)</b><br>${(bytes / 1024).toFixed(0)} KB จากประมาณ 5 MB · รูปสลิป ${(slipBytes / 1024).toFixed(0)} KB · ใบเสร็จ ${all.length} ใบ</p><div class="rc-store__bar" role="img" aria-label="ใช้พื้นที่ ${(bytes / quota * 100).toFixed(1)}%"><i style="width:${Math.min(100, bytes / quota * 100).toFixed(1)}%"></i></div>`;
    rcSel = new Set([...rcSel].filter((no) => list.some((r) => r.no === no)));
    $('#rcTable').innerHTML = `<thead><tr><th><input type="checkbox" id="rcAll" aria-label="เลือกทั้งหมด"/></th><th>เลขที่</th><th>วันที่ชำระ</th><th>ลูกค้า</th><th>ช่องทาง</th><th class="r">ยอดรวม</th><th>สถานะ</th><th></th></tr></thead><tbody>${
      list.map((r) => `<tr><td><input type="checkbox" data-sel="${esc(r.no)}" ${rcSel.has(r.no) ? 'checked' : ''} ${r.archived || r.status === 'void' ? 'disabled' : ''} aria-label="เลือก ${esc(r.no)}"/></td><td class="mono"><b>${esc(r.no)}</b><small>${esc(r.orderNo)}</small></td><td class="num">${S.dateTH(r.paidAt)}</td><td>${esc(r.customer.name)}</td><td>${r.channel === 'pos' ? 'หน้าร้าน' : 'หน้าเว็บ'}</td><td class="r num">${thb(r.total)}</td><td>${r.status === 'void' ? '<span class="badge badge--bad">ยกเลิก</span>' : r.archived ? '<span class="badge badge--muted">จัดเก็บแล้ว</span>' : '<span class="badge badge--ok">ออกแล้ว</span>'}</td><td class="r"><button class="link-btn" data-view="${esc(r.no)}">ดู / PDF</button>${r.status !== 'void' ? ` · <button class="link-btn danger" data-void="${esc(r.no)}">ยกเลิก</button>` : ''}</td></tr>`).join('') || '<tr><td colspan="8" class="muted">ยังไม่มีใบเสร็จ ใบเสร็จจะออกอัตโนมัติเมื่อคำสั่งซื้อชำระเงินแล้ว</td></tr>'
    }</tbody>`;
    $('#rcArchive').disabled = !rcSel.size;
    $('#rcArchive').textContent = archLabel();
  }
  $('#rcTable').addEventListener('change', (e) => {
    if (e.target.id === 'rcAll') $$('#rcTable [data-sel]:not(:disabled)').forEach((c) => { c.checked = e.target.checked; if (c.checked) rcSel.add(c.dataset.sel); else rcSel.delete(c.dataset.sel); });
    const c = e.target.closest('[data-sel]'); if (c) { if (c.checked) rcSel.add(c.dataset.sel); else rcSel.delete(c.dataset.sel); }
    $('#rcArchive').disabled = !rcSel.size;
    $('#rcArchive').textContent = archLabel();
  });
  $('#rcTable').addEventListener('click', (e) => {
    const v = e.target.closest('[data-view]'); if (v) { R.open(R.get(v.dataset.view)); return; }
    const x = e.target.closest('[data-void]');
    if (x) {
      if (x.dataset.confirm !== '1') { x.dataset.confirm = '1'; x.textContent = 'กดอีกครั้งเพื่อยืนยันยกเลิก'; return; }
      R.void(x.dataset.void, 'ยกเลิกโดยร้าน'); UI.toast('ยกเลิกใบเสร็จแล้ว (เลขที่ยังเก็บไว้ในระบบ)');
    }
  });
  $('#rcArchive').addEventListener('click', () => {
    const freed = R.archive([...rcSel]); rcSel.clear();
    UI.toast(`จัดเก็บแล้ว · คืนพื้นที่ ${(freed * 2 / 1024).toFixed(0)} KB`);
    renderReceipts();
  });
  $('#rcPdfMonth').addEventListener('click', async (e) => {
    const m = $('#rcMonth').value;
    const list = R.list().filter((r) => r.status !== 'void' && (!m || monthKey(r.paidAt) === m)).reverse();
    if (!list.length) { UI.toast('ไม่มีใบเสร็จในช่วงนี้'); return; }
    const b = e.currentTarget; b.disabled = true; const t = b.textContent; b.textContent = `กำลังสร้าง PDF ${list.length} ใบ…`;
    try { await R.pdf(list, `uscamp-receipts-${m || 'all'}.pdf`); UI.toast(`บันทึก PDF ${list.length} ใบแล้ว · เลือกรายการแล้วกด “จัดเก็บ” เพื่อคืนพื้นที่`); }
    catch (err) { UI.toast('สร้าง PDF ไม่ได้ในหน้านี้'); }
    b.disabled = false; b.textContent = t;
  });

  /* CSV export (sales lines) */
  $('#rpCsv').addEventListener('click', async () => {
    const [from] = bounds();
    const rows = [['วันที่', 'เลขที่', 'ช่องทาง', 'วิธีชำระ', 'สินค้า', 'ตัวเลือก', 'จำนวน', 'ราคาต่อชิ้น', 'ยอดรวม', 'VAT 7% (รวมในราคา)']];
    S.orders.list().filter((o) => o.payment.status === 'paid' && o.status !== 'cancelled' && (!from || (o.payment.paidAt || o.createdAt) >= from)).forEach((o) => {
      o.lines.forEach((l) => { const t = l.price * l.qty; rows.push([(o.payment.paidAt || o.createdAt).slice(0, 10), o.no, o.channel === 'pos' ? 'หน้าร้าน' : 'หน้าเว็บ', o.payment.label, l.name, l.label || '', l.qty, l.price, t, Math.round(t * 7 / 107)]); });
      if (o.totals.shipping) rows.push([(o.payment.paidAt || o.createdAt).slice(0, 10), o.no, 'หน้าเว็บ', o.payment.label, 'ค่าจัดส่ง', '', 1, o.totals.shipping, o.totals.shipping, Math.round(o.totals.shipping * 7 / 107)]);
    });
    const csv = '﻿' + rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    try {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
      a.download = `uscamp-sales-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a); a.click(); a.remove();
      UI.toast(`ส่งออก ${rows.length - 1} รายการแล้ว`);
    } catch (e) {
      try { await navigator.clipboard.writeText(csv); UI.toast('คัดลอกข้อมูล CSV ไปที่คลิปบอร์ดแล้ว'); } catch (err) { UI.toast('ส่งออกไม่ได้ในหน้านี้'); }
    }
  });
})();
