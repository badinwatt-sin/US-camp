/* US Camp — receipts (demo).
   A receipt is issued once an order is paid. Only a small data snapshot is stored (~1–2 KB);
   the PDF or printout is rebuilt from that snapshot whenever needed, so no files sit in the database.
   The shop downloads PDFs to keep, then may archive: slip images are removed to free space,
   while the receipt record (number, lines, totals) stays for the books.
   Seller details below are PLACEHOLDERS. */
(function () {
  'use strict';
  const S = window.USCampStore;
  const KEY = 'uscamp-receipts-v1';
  const SELLER = {
    name: 'บริษัท ยูเอส แคมป์ จำกัด (ตัวอย่าง)', nameEn: 'US Camp Co., Ltd. (sample)',
    address: 'เลขที่ 00 ถนนตัวอย่าง แขวงตัวอย่าง เขตตัวอย่าง กรุงเทพมหานคร 10000',
    taxId: '0-0000-00000-00-0', branch: 'สำนักงานใหญ่', phone: '0X-XXX-XXXX', line: '@uscamp', email: 'hello@uscamp.co'
  };
  const nf2 = new Intl.NumberFormat('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const money = (n) => nf2.format(n);
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));

  /* ---------- storage ---------- */
  let mem = { list: [], seq: {} };
  function load() { try { const r = localStorage.getItem(KEY); if (r) mem = Object.assign({ list: [], seq: {} }, JSON.parse(r)); } catch (e) { /* ignore */ } }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(mem)); } catch (e) { /* ignore */ } document.dispatchEvent(new CustomEvent('uscamp:receipts')); }
  load();
  window.addEventListener('storage', (e) => { if (e.key === KEY) load(); });

  const byOrder = (no) => mem.list.find((r) => r.orderNo === no && r.status !== 'void');
  function nextNo(d) {
    const ym = String(d.getFullYear()).slice(2) + String(d.getMonth() + 1).padStart(2, '0');
    mem.seq[ym] = (mem.seq[ym] || 0) + 1;
    return `RC${ym}-${String(mem.seq[ym]).padStart(4, '0')}`;
  }

  /* issue once per paid order; the snapshot never changes afterwards */
  function ensure(o) {
    if (!o || o.payment.status !== 'paid' || o.status === 'cancelled') return null;
    const have = byOrder(o.no); if (have) return have;
    const at = new Date(o.payment.paidAt || o.createdAt);
    const sh = o.shipping;
    const r = {
      no: nextNo(new Date()), orderNo: o.no, issuedAt: new Date().toISOString(), paidAt: at.toISOString(), status: 'issued', archived: false,
      channel: o.channel === 'pos' ? 'pos' : 'web',
      customer: { name: o.customer.name, phone: o.customer.phone, email: o.customer.email || '', address: sh.address ? [sh.address.line1, sh.address.subdistrict, sh.address.district, sh.address.province, sh.address.postcode].filter(Boolean).join(' ') : '', taxId: o.customer.taxId || '' },
      delivery: sh.method === 'pos' ? 'ขายหน้าร้าน' : sh.method === 'pickup' ? `รับที่ร้าน ${sh.pickupDate || ''}` : sh.label,
      payment: { label: o.payment.label, ref: o.payment.last4 ? `${o.payment.brand || 'บัตร'} •••• ${o.payment.last4}` : '' },
      lines: o.lines.map((l) => ({ n: l.name, v: l.label || '', q: l.qty, p: l.price })),
      shipping: o.totals.shipping || 0, total: o.totals.total
    };
    mem.list.push(r); save();
    return r;
  }
  function syncAll() { S.orders.list().slice().reverse().forEach(ensure); }

  function voidReceipt(no, reason) { const r = mem.list.find((x) => x.no === no); if (r) { r.status = 'void'; r.voidReason = reason || ''; r.voidAt = new Date().toISOString(); save(); } }

  /* archiving: the shop has saved the PDF; drop heavy data (slip image) from the order */
  function archive(nos) {
    let freed = 0;
    nos.forEach((no) => {
      const r = mem.list.find((x) => x.no === no); if (!r) return;
      r.archived = true; r.archivedAt = new Date().toISOString();
      const o = S.orders.get(r.orderNo);
      if (o && o.payment.slip && o.payment.slip.image) {
        freed += o.payment.slip.image.length;
        S.orders.update(o.no, { payment: { slip: Object.assign({}, o.payment.slip, { image: '', archived: true }) } });
      }
    });
    save();
    return freed;
  }

  function storageBytes() {
    let n = 0;
    try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (/^uscamp/.test(k)) n += (localStorage.getItem(k) || '').length * 2; } } catch (e) { /* ignore */ }
    return n;
  }

  /* ---------- document ---------- */
  function thaiBahtText(n) {
    const d = ['', 'หนึ่ง', 'สอง', 'สาม', 'สี่', 'ห้า', 'หก', 'เจ็ด', 'แปด', 'เก้า'], u = ['', 'สิบ', 'ร้อย', 'พัน', 'หมื่น', 'แสน'];
    const read = (num) => {
      const s = String(num); let out = '';
      if (s.length > 6) return read(Math.floor(num / 1e6)) + 'ล้าน' + read(num % 1e6);
      for (let i = 0; i < s.length; i++) {
        const k = +s[i], pos = s.length - i - 1; if (!k) continue;
        if (pos === 1 && k === 1) out += 'สิบ';
        else if (pos === 1 && k === 2) out += 'ยี่สิบ';
        else if (pos === 0 && k === 1 && s.length > 1) out += 'เอ็ด';
        else out += d[k] + u[pos];
      }
      return out;
    };
    const baht = Math.floor(n), sat = Math.round((n - baht) * 100);
    return (baht ? read(baht) + 'บาท' : 'ศูนย์บาท') + (sat ? read(sat) + 'สตางค์' : 'ถ้วน');
  }

  function html(r, size = 'a4') {
    const vat = r.total * 7 / 107, before = r.total - vat;
    const issued = new Date(r.paidAt).toLocaleString('th-TH', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    const full = !!r.customer.taxId;
    const title = full ? 'ใบเสร็จรับเงิน / ใบกำกับภาษี' : 'ใบเสร็จรับเงิน / ใบกำกับภาษีอย่างย่อ';
    const rows = r.lines.map((l, i) => `<tr><td class="c">${i + 1}</td><td>${esc(l.n)}${l.v ? `<small>${esc(l.v)}</small>` : ''}</td><td class="r">${l.q}</td><td class="r">${money(l.p)}</td><td class="r">${money(l.p * l.q)}</td></tr>`).join('')
      + (r.shipping ? `<tr><td class="c">${r.lines.length + 1}</td><td>ค่าจัดส่ง</td><td class="r">1</td><td class="r">${money(r.shipping)}</td><td class="r">${money(r.shipping)}</td></tr>` : '');
    const track = `${location.origin}${location.pathname.replace(/[^/]*$/, '')}track.html?order=${encodeURIComponent(r.orderNo)}`;
    let qr = '';
    if (window.qrcode) { try { const q = window.qrcode(0, 'M'); q.addData(track); q.make(); qr = q.createImgTag(3, 0); } catch (e) { /* ignore */ } }
    return `<article class="rc rc--${size}${r.status === 'void' ? ' rc--void' : ''}" data-no-wrap>
      <div class="rc__demo">เอกสารตัวอย่าง · โหมดสาธิต · ไม่ใช่เอกสารทางภาษีจริง</div>
      <header class="rc__head">
        <div class="rc__brand"><b>US CAMP</b><span>${esc(SELLER.name)}</span><span>${esc(SELLER.address)}</span><span>เลขประจำตัวผู้เสียภาษี ${esc(SELLER.taxId)} · ${esc(SELLER.branch)}</span><span>โทร ${esc(SELLER.phone)} · LINE ${esc(SELLER.line)} · ${esc(SELLER.email)}</span></div>
        <div class="rc__title"><h1>${title}</h1><p>RECEIPT${full ? ' / TAX INVOICE' : ''}</p><p class="rc__copy">ต้นฉบับ (Original)</p></div>
      </header>
      <section class="rc__meta">
        <div><span>เลขที่</span><b>${esc(r.no)}</b></div>
        <div><span>วันที่</span><b>${esc(issued)}</b></div>
        <div><span>อ้างอิงคำสั่งซื้อ</span><b>${esc(r.orderNo)}</b></div>
        <div><span>ช่องทาง</span><b>${r.channel === 'pos' ? 'หน้าร้าน (POS)' : 'หน้าเว็บ'}</b></div>
      </section>
      <section class="rc__party">
        <p class="rc__lbl">ลูกค้า</p>
        <p><b>${esc(r.customer.name)}</b>${r.customer.taxId ? ` · เลขผู้เสียภาษี ${esc(r.customer.taxId)}` : ''}</p>
        ${r.customer.address ? `<p>${esc(r.customer.address)}</p>` : ''}
        <p>${r.customer.phone && r.customer.phone !== '-' ? 'โทร ' + esc(r.customer.phone) : ''}${r.customer.email ? ' · ' + esc(r.customer.email) : ''}</p>
        <p>การรับสินค้า: ${esc(r.delivery)}</p>
      </section>
      <table class="rc__table"><thead><tr><th class="c">#</th><th>รายการ</th><th class="r">จำนวน</th><th class="r">ราคา/หน่วย</th><th class="r">จำนวนเงิน</th></tr></thead><tbody>${rows}</tbody></table>
      <section class="rc__sum">
        <div class="rc__words"><span>จำนวนเงินตัวอักษร</span><b>(${thaiBahtText(r.total)})</b></div>
        <dl>
          <div><dt>มูลค่าสินค้าก่อนภาษี</dt><dd>${money(before)}</dd></div>
          <div><dt>ภาษีมูลค่าเพิ่ม 7%</dt><dd>${money(vat)}</dd></div>
          <div class="rc__total"><dt>รวมทั้งสิ้น (บาท)</dt><dd>${money(r.total)}</dd></div>
        </dl>
      </section>
      <section class="rc__pay">
        <p><span class="rc__lbl">ชำระโดย</span> ${esc(r.payment.label)}${r.payment.ref ? ' · ' + esc(r.payment.ref) : ''} · ชำระเมื่อ ${esc(issued)}</p>
        <p class="rc__paid">ได้รับเงินเรียบร้อยแล้ว · PAID</p>
      </section>
      <footer class="rc__foot">
        <div class="rc__sign"><span></span><p>ผู้รับเงิน / Authorized</p></div>
        <div class="rc__qr">${qr}<p>สแกนเพื่อติดตามคำสั่งซื้อ</p></div>
        <p class="rc__note">ขอบคุณที่เลือก Springbar® กับ US Camp · สินค้ารับประกันตามเงื่อนไขผู้ผลิต · เก็บใบเสร็จนี้ไว้เป็นหลักฐาน</p>
      </footer>
      ${r.status === 'void' ? `<div class="rc__stamp">ยกเลิก · VOID</div>` : ''}
    </article>`;
  }

  /* ---------- print & PDF ---------- */
  function printReceipt(r, size = 'a4') {
    let area = document.getElementById('printArea');
    if (!area) { area = document.createElement('div'); area.id = 'printArea'; document.body.appendChild(area); }
    let page = document.getElementById('printPage');
    if (!page) { page = document.createElement('style'); page.id = 'printPage'; document.head.appendChild(page); }
    page.textContent = size === 'slip' ? '@page { size: 80mm auto; margin: 3mm; }' : '@page { size: A4; margin: 12mm; }';
    area.innerHTML = html(r, size);
    document.body.classList.add('is-printing');
    const done = () => { document.body.classList.remove('is-printing'); window.removeEventListener('afterprint', done); };
    window.addEventListener('afterprint', done);
    setTimeout(() => { try { window.print(); } catch (e) { /* blocked */ } setTimeout(done, 1500); }, 50);
  }

  async function pdf(list, filename) {
    if (!window.html2pdf) throw new Error('pdf-lib');
    // the fixed wrapper keeps it out of sight; html2pdf gets the normal-flow inner element
    const wrap = document.createElement('div');
    wrap.className = 'rc-holder';
    const holder = document.createElement('div');
    holder.style.width = '760px';
    holder.innerHTML = list.map((r) => html(r, 'a4')).join('<div class="rc-break"></div>');
    wrap.appendChild(holder);
    document.body.appendChild(wrap);
    window.scrollTo(0, 0);
    await new Promise((r) => setTimeout(r, 60));
    try {
      await window.html2pdf().set({
        margin: [8, 8, 8, 8], filename, image: { type: 'jpeg', quality: 0.92 },
        html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff', scrollY: 0 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['css', 'avoid-all'], before: '.rc-break' }
      }).from(holder).save();
    } finally { wrap.remove(); }
  }

  /* ---------- viewer dialog (shared by admin, POS, tracking, checkout) ---------- */
  let dlg = null;
  function open(r) {
    if (!dlg) {
      dlg = document.createElement('dialog');
      dlg.className = 'rc-view';
      dlg.setAttribute('aria-label', 'ใบเสร็จ');
      dlg.innerHTML = `<header class="rc-view__bar"><b id="rcvNo"></b><div class="rc-view__acts">
          <button class="btn btn--ink btn--sm" data-rc="pdf">ดาวน์โหลด PDF</button>
          <button class="btn btn--line btn--sm" data-rc="a4">พิมพ์ A4</button>
          <button class="btn btn--line btn--sm" data-rc="slip">พิมพ์สลิป 80 มม.</button>
          <button class="icon-btn" data-rc="close" aria-label="ปิด">✕</button></div></header>
        <div class="rc-view__body" id="rcvBody"></div>`;
      document.body.appendChild(dlg);
      dlg.addEventListener('click', async (e) => {
        if (e.target === dlg) { dlg.close(); return; }
        const b = e.target.closest('[data-rc]'); if (!b) return;
        const rec = dlg._r, t = (m) => (window.USCampUI ? window.USCampUI.toast(m) : null);
        if (b.dataset.rc === 'close') dlg.close();
        if (b.dataset.rc === 'a4' || b.dataset.rc === 'slip') { dlg.close(); printReceipt(rec, b.dataset.rc); }
        if (b.dataset.rc === 'pdf') {
          b.disabled = true; const label = b.textContent; b.textContent = 'กำลังสร้าง PDF…';
          try { await pdf([rec], `${rec.no}.pdf`); t('บันทึก PDF แล้ว'); }
          catch (err) { t('สร้าง PDF ไม่ได้ในหน้านี้ ใช้ “พิมพ์ A4” แล้วเลือก Save as PDF แทน'); }
          b.disabled = false; b.textContent = label;
        }
      });
    }
    dlg._r = r;
    dlg.querySelector('#rcvNo').textContent = `ใบเสร็จ ${r.no}${r.status === 'void' ? ' (ยกเลิกแล้ว)' : ''}`;
    dlg.querySelector('#rcvBody').innerHTML = html(r, 'a4');
    dlg.showModal();
  }

  window.USCampReceipts = {
    open,
    ensure, syncAll, list: () => mem.list.slice().sort((a, b) => b.issuedAt.localeCompare(a.issuedAt)),
    byOrder, get: (no) => mem.list.find((r) => r.no === no), html, print: printReceipt, pdf, void: voidReceipt, archive, storageBytes,
    SELLER, reset: () => { mem = { list: [], seq: {} }; save(); }
  };
})();
