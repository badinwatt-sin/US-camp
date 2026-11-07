/* US Camp — back office (demo). Client-side only: a real shop needs server auth + a database. */
(function () {
  'use strict';
  const S = window.USCampStore, UI = window.USCampUI, C = window.USCampCatalog, esc = UI.esc;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const AUTH = 'uscamp-admin-demo';

  /* ---------- gate ---------- */
  const authed = () => { try { return sessionStorage.getItem(AUTH) === '1'; } catch (e) { return false; } };
  function enter() { $('#gate').hidden = true; $('#app').hidden = false; render(); }
  $('#gateForm').addEventListener('submit', (e) => {
    e.preventDefault();
    if ($('#gCode').value.trim().toLowerCase() === 'demo') { try { sessionStorage.setItem(AUTH, '1'); } catch (err) { /* ignore */ } enter(); }
    else $('#gErr').hidden = false;
  });
  $('#logout').addEventListener('click', (e) => { e.preventDefault(); try { sessionStorage.removeItem(AUTH); } catch (err) { /* ignore */ } location.reload(); });

  /* ---------- filters ---------- */
  const FILTERS = [
    { id: 'all', label: 'ทั้งหมด', test: () => true },
    { id: 'verify', label: 'รอตรวจสลิป', test: (o) => o.payment.status === 'awaiting_verification' },
    { id: 'unpaid', label: 'รอชำระ', test: (o) => o.payment.status === 'pending' && o.status !== 'cancelled' },
    { id: 'todo', label: 'ต้องจัดเตรียม', test: (o) => o.payment.status === 'paid' && ['placed', 'confirmed', 'packing'].includes(o.status) },
    { id: 'transit', label: 'ระหว่างขนส่ง / รอรับ', test: (o) => ['shipped', 'out_for_delivery', 'ready_for_pickup'].includes(o.status) },
    { id: 'done', label: 'สำเร็จ', test: (o) => ['delivered', 'picked_up'].includes(o.status) },
    { id: 'cancelled', label: 'ยกเลิก', test: (o) => o.status === 'cancelled' }
  ];
  let filter = 'all', query = '';
  $('#filters').addEventListener('click', (e) => { const b = e.target.closest('[data-f]'); if (b) { filter = b.dataset.f; render(); } });
  $('#q').addEventListener('input', (e) => { query = e.target.value.trim().toLowerCase(); render(); });

  function render() {
    const all = S.orders.list();
    const paid = all.filter((o) => o.payment.status === 'paid' && o.status !== 'cancelled');
    $('#kpis').innerHTML = [
      ['คำสั่งซื้อทั้งหมด', all.length, ''],
      ['รอตรวจสลิป', all.filter(FILTERS[1].test).length, 'warn'],
      ['รอชำระเงิน', all.filter(FILTERS[2].test).length, 'warn'],
      ['ต้องจัดเตรียม / ส่ง', all.filter(FILTERS[3].test).length, 'ok'],
      ['ยอดที่ชำระแล้ว (จำลอง)', S.thb(paid.reduce((s, o) => s + o.totals.total, 0)), '']
    ].map(([k, v, t]) => `<div class="kpi${t ? ' kpi--' + t : ''}"><span>${k}</span><b>${v}</b></div>`).join('');
    $('#filters').innerHTML = FILTERS.map((f) => `<button role="tab" class="tab${f.id === filter ? ' is-active' : ''}" data-f="${f.id}" aria-selected="${f.id === filter}">${f.label} <i>${all.filter(f.test).length}</i></button>`).join('');
    const f = FILTERS.find((x) => x.id === filter);
    const list = all.filter(f.test).filter((o) => !query || [o.no, o.customer.name, o.customer.phone].join(' ').toLowerCase().includes(query));
    if (!all.length) {
      $('#orders').innerHTML = `<div class="empty"><p>ยังไม่มีคำสั่งซื้อในเบราว์เซอร์นี้</p><p class="fine">ลองสั่งซื้อจากหน้าร้านค้า หรือกด “สร้างคำสั่งซื้อตัวอย่าง”</p></div>`;
      return;
    }
    $('#orders').innerHTML = list.length ? `
      <div class="otable" role="table" aria-label="รายการคำสั่งซื้อ">
        <div class="otable__row otable__head" role="row"><span>คำสั่งซื้อ</span><span>ลูกค้า</span><span>การจัดส่ง</span><span>การชำระเงิน</span><span>สถานะ</span><span class="r">ยอดรวม</span></div>
        ${list.map((o) => `<button class="otable__row" role="row" data-no="${esc(o.no)}">
          <span><b>${esc(o.no)}</b><small>${S.dateTH(o.createdAt)}</small></span>
          <span>${esc(o.customer.name)}<small>${esc(o.customer.phone)}</small></span>
          <span>${esc(o.shipping.label)}${o.shipping.trackingNo ? `<small>${esc(o.shipping.carrier)} · ${esc(o.shipping.trackingNo)}</small>` : ''}</span>
          <span><span class="badge badge--${S.PAY[o.payment.status].tone}">${S.PAY[o.payment.status].label}</span><small>${esc(o.payment.label)}</small></span>
          <span><span class="status-dot status-dot--${o.status}">${S.STATUS[o.status].label}</span></span>
          <span class="r"><b>${S.thb(o.totals.total)}</b><small>${o.lines.reduce((n, l) => n + l.qty, 0)} ชิ้น</small></span>
        </button>`).join('')}
      </div>` : '<div class="empty"><p>ไม่มีคำสั่งซื้อในมุมมองนี้</p></div>';
  }
  $('#orders').addEventListener('click', (e) => { const r = e.target.closest('[data-no]'); if (r) openOrder(r.dataset.no); });
  document.addEventListener('uscamp:store', () => { if (!$('#app').hidden) { render(); if (openNo) fill(openNo); } });

  /* ---------- order drawer ---------- */
  const od = $('#od');
  let openNo = null;
  function openOrder(no) {
    openNo = no; fill(no);
    od.hidden = false; requestAnimationFrame(() => od.classList.add('is-open'));
    document.body.classList.add('no-scroll');
  }
  function closeOrder() { od.classList.remove('is-open'); document.body.classList.remove('no-scroll'); setTimeout(() => { od.hidden = true; openNo = null; }, 300); }
  od.addEventListener('click', (e) => { if (e.target.closest('[data-close-od]')) closeOrder(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !od.hidden) closeOrder(); });

  function nextStatuses(o) {
    const flow = S.flowOf(o);
    return [...flow, 'cancelled'];
  }

  function fill(no) {
    const o = S.orders.get(no); if (!o) { closeOrder(); return; }
    $('#odNo').textContent = o.no;
    $('#odDate').textContent = 'สร้างเมื่อ ' + S.dateTH(o.createdAt) + ' · โหมดสาธิต';
    const p = o.payment, sh = o.shipping;
    const addr = sh.method === 'pickup'
      ? `รับที่ร้าน · ${esc(sh.pickupDate)} ${esc(sh.pickupTime)}`
      : `${esc(sh.address.line1)} ${esc(sh.address.subdistrict)} ${esc(sh.address.district)} ${esc(sh.address.province)} ${esc(sh.address.postcode)}${sh.address.note ? `<br><i>หมายเหตุ: ${esc(sh.address.note)}</i>` : ''}`;
    const slip = p.slip && p.slip.image ? `<button class="slip-thumb" data-slip><img src="${p.slip.image}" alt="สลิปการโอน"/><span>ดูสลิปขนาดเต็ม</span></button><p class="fine">${p.slip.bank ? 'โอนจาก ' + esc(p.slip.bank) + ' · ' : ''}${p.slip.time ? esc(p.slip.time.replace('T', ' ')) + ' · ' : ''}แนบเมื่อ ${S.dateTH(p.slip.uploadedAt)}</p>` : '';
    const payActions = p.status === 'awaiting_verification'
      ? `<div class="od-actions"><button class="btn btn--ink btn--sm" data-act="approve">ยืนยันการชำระเงิน</button><button class="btn btn--line btn--sm danger" data-act="reject">สลิปไม่ถูกต้อง</button></div><label class="f" for="rejReason">เหตุผล (กรณีไม่ผ่าน)<input id="rejReason" placeholder="เช่น ยอดเงินไม่ตรง / สลิปไม่ชัด"/></label>`
      : p.status === 'pending' ? `<div class="od-actions"><button class="btn btn--line btn--sm" data-act="manual-paid">บันทึกว่าชำระแล้ว (ตรวจสอบเอง)</button></div>`
        : p.status === 'paid' ? `<div class="od-actions"><button class="btn btn--line btn--sm" data-act="refund">บันทึกการคืนเงิน</button></div>` : '';

    const st = nextStatuses(o);
    $('#odBody').innerHTML = `
      <section class="od-sec">
        <div class="od-badges"><span class="badge badge--${S.PAY[p.status].tone}">${S.PAY[p.status].label}</span><span class="status-dot status-dot--${o.status}">${S.STATUS[o.status].label}</span></div>
        <div class="od-2">
          <div><p class="lbl">ลูกค้า</p><p>${esc(o.customer.name)}<br><span class="sel">${esc(o.customer.phone)}</span>${o.customer.email ? '<br>' + esc(o.customer.email) : ''}</p></div>
          <div><p class="lbl">${esc(sh.label)}</p><p>${addr}</p></div>
        </div>
      </section>

      <section class="od-sec">
        <h3>การชำระเงิน · ${esc(p.label)}${p.last4 ? ` · ${esc(p.brand)} •••• ${esc(p.last4)}` : ''}</h3>
        ${slip}${payActions}
      </section>

      <section class="od-sec">
        <h3>อัปเดตสถานะการจัดส่ง</h3>
        <form id="stForm" class="f-grid" novalidate>
          <label class="f" for="stSel">สถานะใหม่<select id="stSel">${st.map((s) => `<option value="${s}" ${s === o.status ? 'selected' : ''}>${S.STATUS[s].label}</option>`).join('')}</select></label>
          ${sh.method === 'pickup' ? '' : `
          <label class="f" for="stCarrier">บริษัทขนส่ง<select id="stCarrier"><option value="">— เลือก —</option>${S.CARRIERS.map((c) => `<option ${c === sh.carrier ? 'selected' : ''}>${c}</option>`).join('')}</select></label>
          <label class="f f--full" for="stTrack">เลขพัสดุ (Tracking No.)<input id="stTrack" value="${esc(sh.trackingNo || '')}" placeholder="เช่น KEX123456789TH" autocomplete="off"/><span class="err" hidden>ใส่บริษัทขนส่งและเลขพัสดุเมื่อเปลี่ยนเป็น “ส่งมอบให้ขนส่งแล้ว”</span></label>`}
          <label class="f f--full" for="stNote">ข้อความถึงลูกค้า / บันทึก<input id="stNote" placeholder="เช่น แพ็กพร้อมผ้าปูรองพื้นแล้ว"/></label>
          <label class="check f--full"><input type="checkbox" id="stNotify" checked/> แจ้งลูกค้าทาง SMS / LINE (จำลอง)</label>
          <p class="err f--full" id="stErr" hidden></p>
          <button class="btn btn--ink f--full" type="submit">อัปเดตสถานะ</button>
        </form>
      </section>

      <section class="od-sec">
        <h3>รายการสินค้า</h3>
        <div class="sum-lines">${o.lines.map((l) => `<div class="sum-line"><span class="sum-line__img"><img src="${esc(l.image)}" alt=""/><i>${l.qty}</i></span><span class="sum-line__name">${esc(l.name)}${l.label ? `<small>${esc(l.label)}</small>` : ''}</span><b>${S.thb(l.price * l.qty)}</b></div>`).join('')}</div>
        <div class="sum-calc"><div class="sum-row"><span>สินค้า</span><span>${S.thb(o.totals.subtotal)}</span></div><div class="sum-row"><span>ค่าจัดส่ง</span><span>${o.totals.shipping ? S.thb(o.totals.shipping) : 'ฟรี'}</span></div><div class="sum-row sum-row--total"><span>รวม</span><b>${S.thb(o.totals.total)}</b></div></div>
      </section>

      <section class="od-sec">
        <h3>ประวัติ</h3>
        <ol class="timeline">${o.history.slice().reverse().map((h) => `<li><time>${S.dateTH(h.at)}</time><b>${esc(S.STATUS[h.status] ? S.STATUS[h.status].label : h.status)}</b>${h.note ? `<span>${esc(h.note)}</span>` : ''}<small>${h.by === 'admin' ? 'โดยร้าน' : h.by === 'customer' ? 'โดยลูกค้า' : 'ระบบ'}</small></li>`).join('')}</ol>
        <a class="link-btn" href="track.html?order=${encodeURIComponent(o.no)}" target="_blank" rel="noopener">เปิดหน้าที่ลูกค้าเห็น ↗</a>
      </section>`;

    $('#stForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const ns = $('#stSel').value;
      const carrier = $('#stCarrier') ? $('#stCarrier').value : '';
      const track = $('#stTrack') ? $('#stTrack').value.trim() : '';
      const err = $('#stErr');
      const flow = S.flowOf(o);
      if (ns !== 'cancelled' && flow.indexOf(ns) > flow.indexOf('confirmed') && o.payment.status !== 'paid') { err.textContent = 'ยังไม่ได้รับชำระเงิน ยืนยันการชำระก่อนเริ่มแพ็กหรือส่งสินค้า'; err.hidden = false; return; }
      if (['shipped', 'out_for_delivery', 'delivered'].includes(ns) && (!carrier || !track)) { const te = $('#stTrack').closest('.f').querySelector('.err'); te.hidden = false; $('#stTrack').focus(); return; }
      if (ns === o.status && carrier === (o.shipping.carrier || '') && track === (o.shipping.trackingNo || '') && !$('#stNote').value.trim()) { err.textContent = 'ยังไม่มีอะไรเปลี่ยนแปลง'; err.hidden = false; return; }
      err.hidden = true;
      const note = [$('#stNote').value.trim(), carrier && track && (track !== o.shipping.trackingNo || carrier !== o.shipping.carrier) ? `${carrier} เลขพัสดุ ${track}` : ''].filter(Boolean).join(' · ');
      S.orders.update(o.no, { status: ns, shipping: { carrier, trackingNo: track } }, { status: ns, note, by: 'admin' });
      UI.toast($('#stNotify').checked ? `อัปเดตแล้ว · แจ้งลูกค้า ${o.customer.phone} (จำลอง)` : 'อัปเดตสถานะแล้ว');
    });
  }

  $('#odBody').addEventListener('click', (e) => {
    const s = e.target.closest('[data-slip]');
    if (s) { $('#lbImg').src = s.querySelector('img').src; $('#lightbox').showModal(); return; }
    const a = e.target.closest('[data-act]'); if (!a || !openNo) return;
    const o = S.orders.get(openNo);
    const now = new Date().toISOString();
    if (a.dataset.act === 'approve' || a.dataset.act === 'manual-paid') {
      S.orders.update(o.no, { payment: { status: 'paid', paidAt: now }, status: o.status === 'placed' ? 'confirmed' : o.status },
        { status: o.status === 'placed' ? 'confirmed' : o.status, note: a.dataset.act === 'approve' ? 'ร้านตรวจสอบสลิปแล้ว ยืนยันการชำระเงิน' : 'ร้านบันทึกการชำระเงิน (ตรวจสอบเอง)', by: 'admin', pay: 'paid' });
      UI.toast('ยืนยันการชำระเงินแล้ว · แจ้งลูกค้า (จำลอง)');
    } else if (a.dataset.act === 'reject') {
      const reason = ($('#rejReason').value || 'สลิปไม่ถูกต้อง').trim();
      S.orders.update(o.no, { payment: { status: 'failed', reason } }, { status: o.status, note: 'สลิปไม่ผ่านการตรวจสอบ: ' + reason, by: 'admin', pay: 'failed' });
      UI.toast('บันทึกว่าสลิปไม่ผ่าน · แจ้งลูกค้า (จำลอง)');
    } else if (a.dataset.act === 'refund') {
      if (a.dataset.confirm !== '1') { a.dataset.confirm = '1'; a.textContent = 'กดอีกครั้งเพื่อยืนยันการคืนเงิน'; return; }
      S.orders.update(o.no, { payment: { status: 'refunded' }, status: 'cancelled' }, { status: 'cancelled', note: 'ยกเลิกและคืนเงิน (จำลอง)', by: 'admin', pay: 'refunded' });
      UI.toast('บันทึกการคืนเงินแล้ว');
    }
  });
  $('#lbClose').addEventListener('click', () => $('#lightbox').close());
  $('#lightbox').addEventListener('click', (e) => { if (e.target.id === 'lightbox') $('#lightbox').close(); });

  /* ---------- demo tools ---------- */
  function sampleSlip() {
    const c = document.createElement('canvas'); c.width = 360; c.height = 560;
    const g = c.getContext('2d');
    g.fillStyle = '#f4f7f4'; g.fillRect(0, 0, 360, 560);
    g.fillStyle = '#138f2d'; g.fillRect(0, 0, 360, 90);
    g.fillStyle = '#fff'; g.font = 'bold 22px sans-serif'; g.fillText('โอนเงินสำเร็จ', 24, 55);
    g.fillStyle = '#222'; g.font = '16px sans-serif';
    ['สลิปตัวอย่าง (โหมดสาธิต)', 'จาก  นาย ตัวอย่าง  xxx-x-x1234-x', 'ไปยัง  บจก. ยูเอส แคมป์', 'จำนวนเงิน  40,690.00 บาท', 'เลขที่รายการ  DEMO0001'].forEach((t, i) => g.fillText(t, 24, 150 + i * 44));
    g.fillStyle = '#c33'; g.font = 'bold 26px sans-serif'; g.save(); g.translate(180, 470); g.rotate(-0.2); g.fillText('SAMPLE · ตัวอย่าง', -120, 0); g.restore();
    return c.toDataURL('image/jpeg', 0.8);
  }
  function seed() {
    const t = (id, v, q = 1) => { const r = C.resolve(id, v); return { id, variant: v, name: r.product.name, label: r.label, price: r.price, qty: q, image: r.image }; };
    const mk = (lines, method, shipMethod, customer, address) => {
      const sub = lines.reduce((s, l) => s + l.price * l.qty, 0);
      const shipping = shipMethod === 'pickup' ? { method: 'pickup', label: 'รับที่ร้าน', pickupDate: new Date(Date.now() + 2 * 864e5).toISOString().slice(0, 10), pickupTime: '13:00–15:00', carrier: '', trackingNo: '' }
        : { method: shipMethod, label: S.SHIPPING[shipMethod].label, eta: S.SHIPPING[shipMethod].eta, address, carrier: '', trackingNo: '' };
      return { customer, shipping, payment: { method, label: { card: 'บัตรเครดิต/เดบิต', promptpay: 'พร้อมเพย์ QR', transfer: 'โอนผ่านธนาคาร' }[method], status: 'pending' }, lines, totals: S.totals(shipMethod, sub) };
    };
    const a = S.orders.create(mk([t('tent-vagabond', 'suntan'), t('ground-tarp', '8x10')], 'transfer', 'standard', { name: 'สมชาย ใจดี (ตัวอย่าง)', phone: '081-234-5678', email: '' }, { line1: '99/1 หมู่บ้านตัวอย่าง ถ.สุขุมวิท', subdistrict: 'คลองตันเหนือ', district: 'วัฒนา', province: 'กรุงเทพมหานคร', postcode: '10110', note: '' }));
    S.orders.update(a.no, { payment: { status: 'awaiting_verification', slip: { image: sampleSlip(), bank: 'กสิกรไทย', time: new Date().toISOString().slice(0, 16), uploadedAt: new Date().toISOString() } } }, { status: 'placed', note: 'ลูกค้าแนบสลิปโอนจาก กสิกรไทย รอร้านตรวจสอบ', by: 'customer', pay: 'awaiting_verification' });
    const b = S.orders.create(mk([t('tent-traveler', 'bison'), t('portico'), t('stake', null, 8)], 'card', 'standard', { name: 'Nina K. (ตัวอย่าง)', phone: '089-111-2233', email: 'nina@example.com' }, { line1: '12 ถ.นิมมานเหมินท์', subdistrict: 'สุเทพ', district: 'เมืองเชียงใหม่', province: 'เชียงใหม่', postcode: '50200', note: 'โทรก่อนส่ง' }));
    S.orders.update(b.no, { payment: { status: 'paid', brand: 'Visa', last4: '4242', paidAt: new Date().toISOString() }, status: 'confirmed' }, { status: 'confirmed', note: 'ชำระด้วยบัตร Visa •••• 4242 สำเร็จ (จำลอง)', by: 'system', pay: 'paid' });
    S.orders.update(b.no, { status: 'packing' }, { status: 'packing', note: 'แพ็กพร้อมสมอบก 8 ชิ้น', by: 'admin' });
    S.orders.update(b.no, { status: 'shipped', shipping: { carrier: 'Kerry Express', trackingNo: 'KEX0000DEMO42' } }, { status: 'shipped', note: 'Kerry Express เลขพัสดุ KEX0000DEMO42', by: 'admin' });
    const c = S.orders.create(mk([t('tent-compact', 'pearl-gray'), t('tote')], 'promptpay', 'pickup', { name: 'Ploy (ตัวอย่าง)', phone: '062-555-0101', email: '' }));
    S.orders.update(c.no, { payment: { status: 'paid', paidAt: new Date().toISOString() } }, { status: 'placed', note: 'ได้รับชำระผ่านพร้อมเพย์ QR (จำลอง)', by: 'system', pay: 'paid' });
    UI.toast('สร้างคำสั่งซื้อตัวอย่าง 3 รายการแล้ว');
  }
  $('#seed').addEventListener('click', seed);
  $('#wipe').addEventListener('click', (e) => {
    const b = e.currentTarget;
    if (b.dataset.confirm !== '1') { b.dataset.confirm = '1'; b.textContent = 'กดอีกครั้งเพื่อลบทั้งหมด'; setTimeout(() => { b.dataset.confirm = ''; b.textContent = 'ล้างข้อมูลสาธิต'; }, 4000); return; }
    S.orders.reset(); b.dataset.confirm = ''; b.textContent = 'ล้างข้อมูลสาธิต'; UI.toast('ล้างข้อมูลสาธิตแล้ว');
  });

  if (authed()) enter();
})();
