/* US Camp — checkout (demo): shipping → payment → review → pay → done
   No payment is processed and no card number is kept (brand + last 4 only). */
(function () {
  'use strict';
  const S = window.USCampStore, UI = window.USCampUI, esc = UI.esc;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const DRAFT = 'uscamp-checkout-draft';

  const PROFILE = 'uscamp-profile';
  // returning customers: contact + address from the last order prefill the form (this browser only)
  const profile = (() => { try { return JSON.parse(localStorage.getItem(PROFILE)) || {}; } catch (e) { return {}; } })();
  const draft = (() => { try { return Object.assign({}, profile, JSON.parse(sessionStorage.getItem(DRAFT)) || {}); } catch (e) { return Object.assign({}, profile); } })();
  const saveDraft = () => { try { sessionStorage.setItem(DRAFT, JSON.stringify(draft)); } catch (e) { /* ignore */ } };
  draft.ship = draft.ship || 'standard';
  draft.pay = draft.pay || 'card';

  /* ---------- screens ---------- */
  const show = (id) => ['coEmpty', 'coFlow', 'ppScreen', 'trScreen', 'doneScreen'].forEach((x) => { $('#' + x).hidden = x !== id; });
  function boot() {
    if (!S.cart.count()) { show('coEmpty'); return; }
    show('coFlow');
    renderSummary();
  }

  /* ---------- summary ---------- */
  function renderSummary() {
    const lines = S.cart.lines();
    if (!lines.length && !$('#coFlow').hidden) { show('coEmpty'); return; }
    const t = S.totals(draft.ship);
    $('#sumLines').innerHTML = lines.map((l) => `<div class="sum-line"><span class="sum-line__img"><img src="${esc(l.image)}" alt=""/><i>${l.qty}</i></span><span class="sum-line__name">${esc(l.name)}${l.label ? `<small>${esc(l.label)}</small>` : ''}</span><b>${S.thb(l.total)}</b></div>`).join('');
    $('#sumSub').textContent = S.thb(t.subtotal);
    $('#sumShip').textContent = t.shipping ? S.thb(t.shipping) : 'ฟรี';
    $('#sumTotal').textContent = S.thb(t.total);
    $('#sumTotalTop').textContent = S.thb(t.total);
    $('#sumVat').textContent = `รวมภาษีมูลค่าเพิ่ม 7% (${S.thb(t.vat)}) แล้ว`;
    $('#placeOrder').textContent = draft.pay === 'card' ? `ชำระเงิน ${S.thb(t.total)}` : `ยืนยันคำสั่งซื้อ ${S.thb(t.total)}`;
    renderShipChoices();
  }
  document.addEventListener('uscamp:store', () => { if (!$('#coFlow').hidden) renderSummary(); });
  if (window.matchMedia('(max-width: 900px)').matches) $('#sumToggle').open = false;

  /* ---------- steps ---------- */
  let step = 0;
  const steps = [$('#fShip'), $('#fPay'), $('#fReview')];
  function go(i) {
    step = i;
    steps.forEach((s, k) => s.classList.toggle('is-active', k === i));
    $$('#stepper li').forEach((li, k) => { li.classList.toggle('is-active', k === i); li.classList.toggle('is-done', k < i); });
    if (i === 2) renderReview();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => { const f = steps[i].querySelector('input:not([type=radio]):not([type=checkbox]), button.btn--ink'); f && f.focus({ preventScroll: true }); }, 350);
  }
  document.addEventListener('click', (e) => {
    if (e.target.closest('[data-back]')) go(step - 1);
    const g = e.target.closest('[data-goto]'); if (g) go(+g.dataset.goto);
  });

  /* ---------- field helpers ---------- */
  function setErr(input, bad) {
    const f = input.closest('.f'); const err = f && f.querySelector('.err');
    input.setAttribute('aria-invalid', bad ? 'true' : 'false');
    if (err) err.hidden = !bad;
    return bad;
  }
  function bindDraft(form) {
    $$('input[name], select[name]', form).forEach((el) => {
      if (draft[el.name] != null && el.type !== 'radio') el.value = draft[el.name];
      el.addEventListener('input', () => { draft[el.name] = el.value; saveDraft(); if (el.getAttribute('aria-invalid') === 'true') setErr(el, false); });
    });
  }

  /* ---------- step 1: shipping ---------- */
  $('#aProv').innerHTML = '<option value="">เลือกจังหวัด</option>' + S.PROVINCES.map((p) => `<option>${p}</option>`).join('');
  $('#storeName').textContent = S.STORE.name; $('#storeAddr').textContent = S.STORE.address; $('#storeHours').textContent = S.STORE.hours;
  const tomorrow = new Date(Date.now() + 864e5).toISOString().slice(0, 10);
  $('#pDate').min = tomorrow;
  bindDraft($('#fShip'));
  if (!$('#pDate').value) $('#pDate').value = tomorrow;

  function renderShipChoices() {
    const sub = S.cart.subtotal();
    const metro = !$('#aProv').value || S.METRO.includes($('#aProv').value);
    if (draft.ship === 'express' && !metro) { draft.ship = 'standard'; saveDraft(); UI.toast('จังหวัดนี้ใช้จัดส่งด่วนไม่ได้ เปลี่ยนเป็นจัดส่งมาตรฐานให้แล้ว'); }
    $('#shipChoices').innerHTML = Object.values(S.SHIPPING).map((s) => {
      const fee = s.fee(sub), dis = s.metroOnly && !metro;
      return `<label class="choice${dis ? ' is-disabled' : ''}"><input type="radio" name="ship" value="${s.id}" ${draft.ship === s.id ? 'checked' : ''} ${dis ? 'disabled' : ''}/>
        <span class="choice__body"><b>${s.label}</b><small>${s.sub}${s.note && fee ? ' · ' + s.note : ''}</small></span><span class="choice__price">${fee ? S.thb(fee) : 'ฟรี'}</span></label>`;
    }).join('');
    $('#pickupBox').hidden = draft.ship !== 'pickup';
    $('#addrBox').hidden = draft.ship === 'pickup';
    $('#expressHint').hidden = metro;
  }
  $('#shipChoices').addEventListener('change', (e) => { if (e.target.name === 'ship') { draft.ship = e.target.value; saveDraft(); renderSummary(); } });
  $('#aProv').addEventListener('change', () => { draft.province = $('#aProv').value; saveDraft(); renderSummary(); });
  $('#aZip').addEventListener('input', (e) => { e.target.value = S.digits(e.target.value).slice(0, 5); });

  $('#fShip').addEventListener('submit', (e) => {
    e.preventDefault();
    const bad = [];
    const chk = (id, ok) => { const el = $(id); if (setErr(el, !ok)) bad.push(el); };
    chk('#cName', $('#cName').value.trim().length > 1);
    chk('#cPhone', S.valid.phone($('#cPhone').value));
    chk('#cEmail', S.valid.email($('#cEmail').value.trim()));
    if (draft.ship === 'pickup') chk('#pDate', $('#pDate').value >= tomorrow);
    else {
      chk('#aLine', $('#aLine').value.trim().length > 4);
      chk('#aSub', $('#aSub').value.trim().length > 1);
      chk('#aDist', $('#aDist').value.trim().length > 1);
      chk('#aProv', !!$('#aProv').value);
      chk('#aZip', S.valid.postcode($('#aZip').value));
    }
    if (bad.length) { bad[0].focus(); UI.toast('กรุณาตรวจสอบช่องที่ไฮไลต์'); return; }
    go(1);
  });

  /* ---------- step 2: payment ---------- */
  const payBoxes = { card: '#cardBox', promptpay: '#ppBox', transfer: '#trBox' };
  function renderPay() {
    $$('#payChoices input').forEach((r) => { r.checked = r.value === draft.pay; });
    Object.entries(payBoxes).forEach(([k, sel]) => { $(sel).hidden = k !== draft.pay; });
  }
  $('#payChoices').addEventListener('change', (e) => { draft.pay = e.target.value; saveDraft(); renderPay(); renderSummary(); });
  renderPay();

  const kNum = $('#kNum'), kExp = $('#kExp'), kCvc = $('#kCvc'), kName = $('#kName');
  kNum.addEventListener('input', () => {
    const d = S.digits(kNum.value).slice(0, 19);
    kNum.value = d.replace(/(.{4})/g, '$1 ').trim();
    $('#kBrand').textContent = S.cardBrand(d);
    if (kNum.getAttribute('aria-invalid') === 'true') setErr(kNum, false);
  });
  kExp.addEventListener('input', (e) => {
    let d = S.digits(kExp.value).slice(0, 4);
    if (d.length >= 3) d = d.slice(0, 2) + ' / ' + d.slice(2);
    else if (d.length === 2 && e.inputType !== 'deleteContentBackward') d = d + ' / ';
    kExp.value = d;
  });
  kCvc.addEventListener('input', () => { kCvc.value = S.digits(kCvc.value).slice(0, 4); });
  [kName, kExp, kCvc].forEach((el) => el.addEventListener('input', () => { if (el.getAttribute('aria-invalid') === 'true') setErr(el, false); }));
  $('#kTest').addEventListener('click', () => {
    kNum.value = '4242 4242 4242 4242'; kNum.dispatchEvent(new Event('input'));
    kName.value = ($('#cName').value || 'US CAMP TEST').toUpperCase();
    const y = String(new Date().getFullYear() + 2).slice(2); kExp.value = '12 / ' + y; kCvc.value = '123';
    [kNum, kName, kExp, kCvc].forEach((el) => setErr(el, false));
  });

  $('#fPay').addEventListener('submit', (e) => {
    e.preventDefault();
    if (draft.pay === 'card') {
      const bad = [];
      const chk = (el, ok) => { if (setErr(el, !ok)) bad.push(el); };
      chk(kNum, S.valid.card(kNum.value));
      chk(kName, kName.value.trim().length > 1);
      chk(kExp, S.valid.expiry(kExp.value));
      chk(kCvc, S.valid.cvc(kCvc.value));
      if (bad.length) { bad[0].focus(); return; }
    }
    go(2);
  });

  /* ---------- step 3: review ---------- */
  function shippingSummary() {
    if (draft.ship === 'pickup') return `รับที่ร้าน · ${new Date($('#pDate').value).toLocaleDateString('th-TH', { weekday: 'short', day: 'numeric', month: 'short' })} เวลา ${$('#pTime').value}`;
    const s = S.SHIPPING[draft.ship];
    return `${s.label} (${s.eta})<br>${esc($('#aLine').value)} ${esc($('#aSub').value)} ${esc($('#aDist').value)} ${esc($('#aProv').value)} ${esc($('#aZip').value)}`;
  }
  function paySummary() {
    if (draft.pay === 'card') return `บัตร ${S.cardBrand(kNum.value) || ''} ลงท้าย ${S.digits(kNum.value).slice(-4)}`;
    return draft.pay === 'promptpay' ? 'พร้อมเพย์ QR (แสดงหลังยืนยัน)' : 'โอนผ่านธนาคาร + แนบสลิป';
  }
  function renderReview() {
    $('#rvCustomer').innerHTML = `${esc($('#cName').value)} · ${esc($('#cPhone').value)}${$('#cEmail').value ? ' · ' + esc($('#cEmail').value) : ''}`;
    $('#rvShip').innerHTML = shippingSummary();
    $('#rvPay').textContent = paySummary();
  }

  function busy(msg) { $('#busyMsg').textContent = msg; $('#busy').hidden = !msg; }
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  function buildOrder(payment) {
    const lines = S.cart.lines().map((l) => ({ id: l.id, variant: l.variant, name: l.name, label: l.label, price: l.price, qty: l.qty, image: l.image }));
    const sub = lines.reduce((s, l) => s + l.price * l.qty, 0);
    const pickup = draft.ship === 'pickup';
    return {
      customer: { name: $('#cName').value.trim(), phone: $('#cPhone').value.trim(), email: $('#cEmail').value.trim() },
      shipping: pickup
        ? { method: 'pickup', label: 'รับที่ร้าน', pickupDate: $('#pDate').value, pickupTime: $('#pTime').value, carrier: '', trackingNo: '' }
        : { method: draft.ship, label: S.SHIPPING[draft.ship].label, eta: S.SHIPPING[draft.ship].eta, address: { line1: $('#aLine').value.trim(), subdistrict: $('#aSub').value.trim(), district: $('#aDist').value.trim(), province: $('#aProv').value, postcode: $('#aZip').value, note: $('#aNote').value.trim() }, carrier: '', trackingNo: '' },
      payment,
      lines,
      totals: S.totals(draft.ship, sub)
    };
  }

  /* card: simulated 3-D Secure */
  const otp = $('#otp');
  function askOtp(amount) {
    return new Promise((resolve) => {
      $('#otpPhone').textContent = 'xxx-xxx-' + S.digits($('#cPhone').value).slice(-4);
      $('#otpAmt').textContent = S.thb(amount);
      $('#otpCode').value = ''; $('#otpErr').hidden = true;
      otp.showModal(); setTimeout(() => $('#otpCode').focus(), 50);
      const done = (ok) => { otp.close(); $('#otpOk').onclick = null; $('#otpCancel').onclick = null; resolve(ok); };
      $('#otpOk').onclick = () => { if ($('#otpCode').value === '123456') done(true); else { $('#otpErr').hidden = false; $('#otpCode').select(); } };
      $('#otpCancel').onclick = () => done(false);
      $('#otpCode').onkeydown = (e) => { if (e.key === 'Enter') $('#otpOk').click(); };
    });
  }

  $('#placeOrder').addEventListener('click', async () => {
    if (!$('#consent').checked) { $('#consentErr').hidden = false; $('#consent').focus(); return; }
    $('#consentErr').hidden = true;
    const total = S.totals(draft.ship).total;

    if (draft.pay === 'card') {
      busy('กำลังเชื่อมต่อธนาคารผู้ออกบัตร (จำลอง)…'); await wait(1200); busy('');
      const ok = await askOtp(total);
      if (!ok) { UI.toast('ยกเลิกการชำระด้วยบัตรแล้ว คำสั่งซื้อยังไม่ถูกสร้าง'); return; }
      busy('กำลังอนุมัติรายการ (จำลอง)…'); await wait(1300); busy('');
      const d = S.digits(kNum.value);
      const o = S.orders.create(buildOrder({ method: 'card', label: 'บัตรเครดิต/เดบิต', status: 'paid', brand: S.cardBrand(d), last4: d.slice(-4), paidAt: new Date().toISOString() }));
      S.orders.update(o.no, {}, { status: 'placed', note: `ชำระด้วยบัตร ${S.cardBrand(d)} •••• ${d.slice(-4)} สำเร็จ (จำลอง)`, by: 'system', pay: 'paid' });
      [kNum, kExp, kCvc].forEach((el) => { el.value = ''; });
      finish(o.no);
    } else if (draft.pay === 'promptpay') {
      busy('กำลังสร้าง QR พร้อมเพย์…'); await wait(700); busy('');
      const o = S.orders.create(buildOrder({ method: 'promptpay', label: 'พร้อมเพย์ QR', status: 'pending' }));
      afterCreate(); showPromptPay(o.no);
    } else {
      const o = S.orders.create(buildOrder({ method: 'transfer', label: 'โอนผ่านธนาคาร', status: 'pending' }));
      afterCreate(); showTransfer(o.no);
    }
  });
  function afterCreate() {
    try {
      const keep = {}; ['name', 'phone', 'email', 'line1', 'subdistrict', 'district', 'province', 'postcode'].forEach((k) => { if (draft[k]) keep[k] = draft[k]; });
      if (Object.keys(keep).length) localStorage.setItem(PROFILE, JSON.stringify(keep));
    } catch (e) { /* ignore */ }
    S.cart.clear(); try { sessionStorage.removeItem(DRAFT); } catch (e) { /* ignore */ } try { localStorage.setItem('uscamp-last-order', S.orders.list()[0].no); } catch (e) { /* ignore */ } }

  /* ---------- PromptPay ---------- */
  let ppTimer = null;
  function showPromptPay(no) {
    const o = S.orders.get(no);
    show('ppScreen'); window.scrollTo(0, 0);
    $('#ppNo').textContent = no; $('#ppAmt').textContent = S.thb(o.totals.total);
    // demo QR: encodes a plain text note, NOT a payable PromptPay payload
    const text = `US CAMP DEMO ORDER ${no} THB ${o.totals.total} - SAMPLE QR, NOT A REAL PAYMENT`;
    if (window.qrcode) { const q = window.qrcode(0, 'M'); q.addData(text); q.make(); $('#ppQr').innerHTML = q.createSvgTag({ cellSize: 6, margin: 2, scalable: true }); }
    else $('#ppQr').innerHTML = '<div class="qr-fallback">QR ตัวอย่าง</div>';
    let left = 15 * 60;
    clearInterval(ppTimer);
    ppTimer = setInterval(() => {
      left--; $('#ppTimer').textContent = `${String(Math.floor(left / 60)).padStart(2, '0')}:${String(left % 60).padStart(2, '0')}`;
      if (left <= 0) { clearInterval(ppTimer); $('#ppTimer').textContent = 'หมดอายุ'; }
    }, 1000);
    $('#ppCheck').onclick = async () => {
      busy('กำลังตรวจสอบการชำระเงิน (จำลอง)…'); await wait(1500); busy('');
      clearInterval(ppTimer);
      S.orders.update(no, { payment: { status: 'paid', paidAt: new Date().toISOString() } }, { status: 'placed', note: 'ได้รับชำระผ่านพร้อมเพย์ QR (จำลอง)', by: 'system', pay: 'paid' });
      finish(no);
    };
    $('#ppSwitch').onclick = () => { clearInterval(ppTimer); S.orders.update(no, { payment: { method: 'transfer', label: 'โอนผ่านธนาคาร' } }, { status: 'placed', note: 'ลูกค้าเปลี่ยนเป็นโอนผ่านธนาคาร', by: 'customer' }); showTransfer(no); };
  }

  /* ---------- bank transfer ---------- */
  function showTransfer(no) {
    const o = S.orders.get(no);
    show('trScreen'); window.scrollTo(0, 0);
    $('#trNo').textContent = no; $('#trAmt').textContent = S.thb(o.totals.total);
    $('#banks').innerHTML = S.BANK.map((b) => `<div class="bank"><i style="--b:${b.color}">${b.short}</i><div><b>${b.bank}</b><span class="sel">${b.acct}</span><small>${b.name}</small></div><button class="link-btn" type="button" data-copy="${b.acct}">คัดลอก</button></div>`).join('');
    const now = new Date(); now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    $('#slipTime').value = now.toISOString().slice(0, 16);
    let slip = null;
    const file = $('#slipFile');
    const take = async (f) => {
      try { slip = await S.compressImage(f); $('#slipPreview').src = slip; $('#slipPreview').hidden = false; $('#drop').classList.add('has-file'); $('#slipErr').hidden = true; }
      catch (e) { UI.toast('ไฟล์นี้ใช้ไม่ได้ เลือกรูปสลิป JPG หรือ PNG'); }
    };
    file.onchange = () => file.files[0] && take(file.files[0]);
    const drop = $('#drop');
    drop.ondragover = (e) => { e.preventDefault(); drop.classList.add('is-over'); };
    drop.ondragleave = () => drop.classList.remove('is-over');
    drop.ondrop = (e) => { e.preventDefault(); drop.classList.remove('is-over'); const f = e.dataTransfer.files[0]; if (f) take(f); };
    $('#slipForm').onsubmit = (e) => {
      e.preventDefault();
      if (!slip) { $('#slipErr').hidden = false; return; }
      S.orders.update(no, { payment: { status: 'awaiting_verification', slip: { image: slip, time: $('#slipTime').value, bank: $('#slipBank').value, uploadedAt: new Date().toISOString() } } },
        { status: 'placed', note: `ลูกค้าแนบสลิปโอนจาก ${$('#slipBank').value} รอร้านตรวจสอบ`, by: 'customer', pay: 'awaiting_verification' });
      finish(no);
    };
    $('#trLater').onclick = () => finish(no);
  }
  document.addEventListener('click', async (e) => {
    const c = e.target.closest('[data-copy]'); if (!c) return;
    try { await navigator.clipboard.writeText(c.dataset.copy); UI.toast('คัดลอกแล้ว'); } catch (err) { UI.toast('คัดลอกไม่ได้ กรุณาจดเลขบัญชีแทน'); }
  });

  /* ---------- done ---------- */
  function finish(no) {
    afterCreate();
    const o = S.orders.get(no);
    show('doneScreen'); window.scrollTo(0, 0);
    const p = o.payment.status;
    $('#doneTitle').textContent = p === 'paid' ? 'Thank you!' : 'Almost there.';
    $('#doneLead').textContent = p === 'paid'
      ? 'ร้านได้รับคำสั่งซื้อและการชำระเงิน (จำลอง) แล้ว เราจะแจ้งเมื่อสินค้าออกจากร้าน'
      : p === 'awaiting_verification'
        ? 'ได้รับสลิปแล้ว ร้านจะตรวจสอบและยืนยันภายใน 1 วันทำการ ติดตามสถานะได้ด้วยเลขคำสั่งซื้อด้านล่าง'
        : 'คำสั่งซื้อถูกสร้างแล้ว แต่ยังไม่ได้ชำระเงิน โอนเงินแล้วแนบสลิปได้ที่หน้าติดตามคำสั่งซื้อ';
    $('#doneNo').textContent = no;
    $('#donePay').innerHTML = `<span class="badge badge--${S.PAY[p].tone}">${S.PAY[p].label}</span> ${esc(o.payment.label)}`;
    $('#doneShip').innerHTML = o.shipping.method === 'pickup' ? `รับที่ร้าน · ${esc(o.shipping.pickupDate)} ${esc(o.shipping.pickupTime)}` : `${esc(o.shipping.label)} · ${esc(o.shipping.address.province)}`;
    $('#doneTotal').textContent = S.thb(o.totals.total);
    $('#doneTrack').href = 'track.html?order=' + encodeURIComponent(no);
    const rcBtn = $('#doneReceipt');
    if (rcBtn) {
      const rc = window.USCampReceipts && window.USCampReceipts.ensure(o);
      rcBtn.hidden = !rc;
      if (rc) rcBtn.onclick = () => window.USCampReceipts.open(rc);
    }
    $('#copyNo').onclick = async () => { try { await navigator.clipboard.writeText(no); UI.toast('คัดลอกเลขคำสั่งซื้อแล้ว'); } catch (e) { UI.toast('คัดลอกไม่ได้ กรุณาจดเลขคำสั่งซื้อไว้'); } };
  }

  boot();
})();
