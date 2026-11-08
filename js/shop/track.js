/* US Camp — order tracking (demo) */
(function () {
  'use strict';
  const S = window.USCampStore, UI = window.USCampUI, esc = UI.esc;
  const $ = (s, c = document) => c.querySelector(s);
  let current = null;

  function showRecent() {
    let last = null;
    try { last = localStorage.getItem('uscamp-last-order'); } catch (e) { /* ignore */ }
    const list = S.orders.list().slice(0, 4);
    if (!list.length) { $('#recent').hidden = true; return; }
    $('#recent').hidden = false;
    $('#recent').innerHTML = `<p class="lbl">คำสั่งซื้อล่าสุดในเครื่องนี้ (โหมดสาธิต)</p>` + list.map((o) =>
      `<button class="recent__item" data-no="${esc(o.no)}"><b>${esc(o.no)}</b><span>${S.dateTH(o.createdAt)} · ${S.thb(o.totals.total)}</span><span class="badge badge--${S.PAY[o.payment.status].tone}">${S.PAY[o.payment.status].label}</span>${o.no === last ? '<em>ล่าสุด</em>' : ''}</button>`).join('');
  }
  $('#recent').addEventListener('click', (e) => { const b = e.target.closest('[data-no]'); if (b) view(b.dataset.no); });

  $('#trackForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const o = S.orders.find($('#tNo').value, $('#tPhone').value);
    $('#tErr').hidden = !!o;
    if (o) view(o.no);
  });
  $('#tPhone').addEventListener('input', (e) => { e.target.value = S.digits(e.target.value).slice(0, 4); });
  $('#backFind').addEventListener('click', () => { $('#view').hidden = true; $('#find').hidden = false; current = null; showRecent(); });

  function view(no) {
    current = no;
    const o = S.orders.get(no); if (!o) return;
    $('#find').hidden = true; $('#view').hidden = false;
    $('#vNo').textContent = o.no;
    $('#vDate').textContent = 'สั่งซื้อเมื่อ ' + S.dateTH(o.createdAt);
    const pay = S.PAY[o.payment.status];
    $('#vBadges').innerHTML = `<span class="badge badge--${pay.tone}">${pay.label}</span>${o.status === 'cancelled' ? '<span class="badge badge--bad">ยกเลิก</span>' : ''}<span class="badge badge--muted">โหมดสาธิต</span>`;

    const flow = S.flowOf(o);
    const idx = flow.indexOf(o.status);
    const st = S.STATUS[o.status];
    $('#vNow').textContent = st.label;
    $('#vNowDesc').textContent = o.status === 'placed' && o.payment.status !== 'paid'
      ? (o.payment.status === 'awaiting_verification' ? 'ร้านกำลังตรวจสอบสลิปการโอนของคุณ' : 'รอการชำระเงินเพื่อดำเนินการต่อ')
      : st.desc;
    $('#vProgress').innerHTML = o.status === 'cancelled' ? '' : flow.map((s, i) => {
      const h = o.history.slice().reverse().find((x) => x.status === s);
      return `<li class="${i < idx ? 'is-done' : i === idx ? 'is-now' : ''}"><i></i><b>${S.STATUS[s].label}</b>${h && i <= idx ? `<small>${S.dateTH(h.at)}</small>` : ''}</li>`;
    }).join('');
    const sh = o.shipping;
    $('#vShip').innerHTML = sh.trackingNo
      ? `<div class="tracking"><span>ขนส่งโดย <b>${esc(sh.carrier)}</b></span><span>เลขพัสดุ <b class="sel">${esc(sh.trackingNo)}</b></span><button class="link-btn" data-copy="${esc(sh.trackingNo)}">คัดลอกเลขพัสดุ</button></div>`
      : (sh.method === 'pickup' || sh.method === 'pos') ? `<p class="hint">นัดรับที่ร้าน ${esc(sh.pickupDate)} เวลา ${esc(sh.pickupTime)} · ${esc(S.STORE.hours)}</p>` : `<p class="hint">เลขพัสดุจะแสดงที่นี่เมื่อร้านส่งมอบสินค้าให้ขนส่ง</p>`;

    // payment box: let a transfer customer attach a slip from here
    const pb = $('#vPayBox');
    if (o.payment.method === 'transfer' && o.payment.status === 'pending') {
      pb.hidden = false;
      pb.innerHTML = `<h3>ยังไม่ได้แนบสลิปการโอน</h3><p>โอน ${S.thb(o.totals.total)} เข้าบัญชีร้าน แล้วแนบสลิปที่นี่ หรือส่งทาง LINE <b class="sel">${S.CONTACT.line}</b></p>
        <div class="banks">${S.BANK.map((b) => `<div class="bank"><i style="--b:${b.color}">${b.short}</i><div><b>${b.bank}</b><span class="sel">${b.acct}</span><small>${b.name}</small></div></div>`).join('')}</div>
        <label class="drop" for="tvSlip"><input type="file" id="tvSlip" accept="image/*"/><span class="drop__empty"><b>แนบสลิปการโอน</b><small>JPG / PNG</small></span></label>`;
      $('#tvSlip').onchange = async (e) => {
        const f = e.target.files[0]; if (!f) return;
        try {
          const img = await S.compressImage(f);
          S.orders.update(o.no, { payment: { status: 'awaiting_verification', slip: { image: img, uploadedAt: new Date().toISOString() } } }, { status: o.status, note: 'ลูกค้าแนบสลิปการโอน รอร้านตรวจสอบ', by: 'customer', pay: 'awaiting_verification' });
          UI.toast('ส่งสลิปแล้ว ร้านจะตรวจสอบภายใน 1 วันทำการ'); view(o.no);
        } catch (err) { UI.toast('ไฟล์นี้ใช้ไม่ได้ เลือกรูป JPG หรือ PNG'); }
      };
    } else if (o.payment.status === 'awaiting_verification') {
      pb.hidden = false; pb.innerHTML = `<h3>ได้รับสลิปแล้ว</h3><p>ร้านกำลังตรวจสอบการโอน หากต้องการเร่งด่วน ติดต่อ LINE <b class="sel">${S.CONTACT.line}</b> พร้อมแจ้งเลขคำสั่งซื้อ</p>`;
    } else if (o.payment.status === 'failed') {
      pb.hidden = false; pb.innerHTML = `<h3>การชำระเงินไม่สำเร็จ</h3><p>${esc(o.payment.reason || 'สลิปไม่ถูกต้องหรือยอดเงินไม่ตรง')} ติดต่อร้านทาง LINE <b class="sel">${S.CONTACT.line}</b></p>`;
    } else pb.hidden = true;

    if (window.USCampReceipts && o.payment.status === 'paid' && o.status !== 'cancelled') {
      const rc = window.USCampReceipts.ensure(o);
      $('#vShip').insertAdjacentHTML('beforeend', `<div class="rc-cta"><span>ใบเสร็จเลขที่ <b>${esc(rc.no)}</b></span><button class="btn btn--line btn--sm" data-rc-open="${esc(rc.no)}">ดูใบเสร็จ / PDF</button></div>`);
    }
    $('#vTimeline').innerHTML = o.history.slice().reverse().map((h) => `<li><time>${S.dateTH(h.at)}</time><b>${esc(S.STATUS[h.status] ? S.STATUS[h.status].label : h.status)}</b>${h.note ? `<span>${esc(h.note)}</span>` : ''}</li>`).join('');
    $('#vLines').innerHTML = o.lines.map((l) => `<div class="sum-line"><span class="sum-line__img"><img src="${esc(l.image)}" alt=""/><i>${l.qty}</i></span><span class="sum-line__name">${esc(l.name)}${l.label ? `<small>${esc(l.label)}</small>` : ''}</span><b>${S.thb(l.price * l.qty)}</b></div>`).join('');
    $('#vTotals').innerHTML = `<div class="sum-row"><span>ยอดรวมสินค้า</span><span>${S.thb(o.totals.subtotal)}</span></div><div class="sum-row"><span>ค่าจัดส่ง</span><span>${o.totals.shipping ? S.thb(o.totals.shipping) : 'ฟรี'}</span></div><div class="sum-row sum-row--total"><span>รวม</span><b>${S.thb(o.totals.total)}</b></div>`;
    $('#vAddr').innerHTML = (sh.method === 'pickup' || sh.method === 'pos')
      ? `รับที่ร้าน · ${esc(S.STORE.name)}<br>${esc(o.customer.name)} · ${esc(o.customer.phone)}`
      : `${esc(o.customer.name)} · ${esc(o.customer.phone)}<br>${esc(sh.address.line1)} ${esc(sh.address.subdistrict)} ${esc(sh.address.district)} ${esc(sh.address.province)} ${esc(sh.address.postcode)}`;
    try { history.replaceState(null, '', '?order=' + encodeURIComponent(o.no)); } catch (e) { /* sandboxed preview */ }
  }

  document.addEventListener('click', async (e) => {
    const ro = e.target.closest('[data-rc-open]'); if (ro) { window.USCampReceipts.open(window.USCampReceipts.get(ro.dataset.rcOpen)); return; }
    const c = e.target.closest('[data-copy]'); if (!c) return;
    try { await navigator.clipboard.writeText(c.dataset.copy); UI.toast('คัดลอกแล้ว'); } catch (err) { UI.toast('คัดลอกไม่ได้ กรุณาจดไว้แทน'); }
  });
  // live update when the admin tab changes the order (same browser)
  document.addEventListener('uscamp:store', () => { if (current) view(current); });

  const q = new URLSearchParams(location.search).get('order');
  if (q && S.orders.get(q)) view(q.toUpperCase()); else showRecent();
})();
