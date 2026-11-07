/* US Camp — demo commerce store
   Everything lives in this browser's localStorage. Nothing is sent anywhere,
   no payment is processed, and no card number is ever stored (only brand + last 4). */
(function () {
  'use strict';
  const KEY = 'uscamp-demo-v1';
  const C = window.USCampCatalog;

  const blank = () => ({ cart: [], orders: [] });
  let mem = blank();
  function load() {
    try { const raw = localStorage.getItem(KEY); if (raw) mem = Object.assign(blank(), JSON.parse(raw)); } catch (e) { /* private mode: keep in memory */ }
    return mem;
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(mem)); } catch (e) { /* quota or private mode */ }
    document.dispatchEvent(new CustomEvent('uscamp:store'));
  }
  load();
  window.addEventListener('storage', (e) => { if (e.key === KEY) { load(); document.dispatchEvent(new CustomEvent('uscamp:store')); } });

  /* ---------- formatting & validation ---------- */
  const nf = new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', maximumFractionDigits: 0 });
  const thb = (n) => nf.format(Math.round(n));
  const dateTH = (iso, withTime = true) => new Date(iso).toLocaleString('th-TH', withTime
    ? { day: 'numeric', month: 'short', year: '2-digit', hour: '2-digit', minute: '2-digit' }
    : { day: 'numeric', month: 'short', year: 'numeric' });
  const digits = (s) => String(s || '').replace(/\D/g, '');
  const valid = {
    phone: (s) => /^0[0-9]{8,9}$/.test(digits(s)),
    email: (s) => !s || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s),
    postcode: (s) => /^[1-9][0-9]{4}$/.test(digits(s)),
    card: (s) => { const d = digits(s); if (d.length < 13 || d.length > 19) return false; let sum = 0, alt = false; for (let i = d.length - 1; i >= 0; i--) { let n = +d[i]; if (alt) { n *= 2; if (n > 9) n -= 9; } sum += n; alt = !alt; } return sum % 10 === 0; },
    expiry: (s) => { const m = /^(\d{2})\s*\/\s*(\d{2})$/.exec(s || ''); if (!m) return false; const mo = +m[1], yr = 2000 + +m[2]; if (mo < 1 || mo > 12) return false; const end = new Date(yr, mo, 1); return end > new Date(); },
    cvc: (s) => /^\d{3,4}$/.test(s || '')
  };
  function cardBrand(num) {
    const d = digits(num);
    if (/^4/.test(d)) return 'Visa';
    if (/^(5[1-5]|2[2-7])/.test(d)) return 'Mastercard';
    if (/^3[47]/.test(d)) return 'Amex';
    if (/^35/.test(d)) return 'JCB';
    if (/^62/.test(d)) return 'UnionPay';
    return '';
  }

  /* ---------- cart ---------- */
  const lineKey = (id, variant) => id + (variant ? ':' + variant : '');
  const cart = {
    lines() {
      return mem.cart.map((l) => {
        const r = C.resolve(l.id, l.variant);
        return r ? Object.assign({}, l, { name: r.product.name, label: r.label, price: r.price, image: r.image, total: r.price * l.qty, type: r.product.type }) : null;
      }).filter(Boolean);
    },
    count() { return mem.cart.reduce((n, l) => n + l.qty, 0); },
    add(id, variant, qty = 1) {
      const k = lineKey(id, variant);
      const ex = mem.cart.find((l) => l.key === k);
      if (ex) ex.qty = Math.min(99, ex.qty + qty); else mem.cart.push({ key: k, id, variant: variant || null, qty });
      save();
    },
    setQty(key, qty) {
      const l = mem.cart.find((x) => x.key === key); if (!l) return;
      if (qty <= 0) mem.cart = mem.cart.filter((x) => x.key !== key); else l.qty = Math.min(99, qty);
      save();
    },
    remove(key) { mem.cart = mem.cart.filter((x) => x.key !== key); save(); },
    clear() { mem.cart = []; save(); },
    subtotal() { return cart.lines().reduce((s, l) => s + l.total, 0); }
  };

  /* ---------- shipping ---------- */
  const STORE = { name: 'US Camp Showroom (ตัวอย่าง)', address: 'กรุงเทพมหานคร · ที่อยู่จริงจะแจ้งเมื่อเปิดร้าน', hours: 'เสาร์–อาทิตย์ 10:00–18:00' };
  const SHIPPING = {
    pickup: { id: 'pickup', label: 'รับที่ร้าน', sub: 'รับเองที่โชว์รูม พร้อมสอนกางเต้นท์', fee: () => 0, eta: 'พร้อมรับภายใน 1–3 วันทำการ' },
    standard: { id: 'standard', label: 'จัดส่งมาตรฐาน', sub: 'ทั่วประเทศ 2–4 วันทำการ', fee: (sub) => (sub >= 20000 ? 0 : 250), eta: '2–4 วันทำการ', note: 'ส่งฟรีเมื่อสั่งครบ ฿20,000' },
    express: { id: 'express', label: 'จัดส่งด่วน', sub: 'กรุงเทพฯ และปริมณฑล 1–2 วันทำการ', fee: () => 590, eta: '1–2 วันทำการ', metroOnly: true }
  };
  const METRO = ['กรุงเทพมหานคร', 'นนทบุรี', 'ปทุมธานี', 'สมุทรปราการ', 'สมุทรสาคร', 'นครปฐม'];
  const PROVINCES = ['กรุงเทพมหานคร', 'กระบี่', 'กาญจนบุรี', 'กาฬสินธุ์', 'กำแพงเพชร', 'ขอนแก่น', 'จันทบุรี', 'ฉะเชิงเทรา', 'ชลบุรี', 'ชัยนาท', 'ชัยภูมิ', 'ชุมพร', 'เชียงราย', 'เชียงใหม่', 'ตรัง', 'ตราด', 'ตาก', 'นครนายก', 'นครปฐม', 'นครพนม', 'นครราชสีมา', 'นครศรีธรรมราช', 'นครสวรรค์', 'นนทบุรี', 'นราธิวาส', 'น่าน', 'บึงกาฬ', 'บุรีรัมย์', 'ปทุมธานี', 'ประจวบคีรีขันธ์', 'ปราจีนบุรี', 'ปัตตานี', 'พระนครศรีอยุธยา', 'พะเยา', 'พังงา', 'พัทลุง', 'พิจิตร', 'พิษณุโลก', 'เพชรบุรี', 'เพชรบูรณ์', 'แพร่', 'ภูเก็ต', 'มหาสารคาม', 'มุกดาหาร', 'แม่ฮ่องสอน', 'ยโสธร', 'ยะลา', 'ร้อยเอ็ด', 'ระนอง', 'ระยอง', 'ราชบุรี', 'ลพบุรี', 'ลำปาง', 'ลำพูน', 'เลย', 'ศรีสะเกษ', 'สกลนคร', 'สงขลา', 'สตูล', 'สมุทรปราการ', 'สมุทรสงคราม', 'สมุทรสาคร', 'สระแก้ว', 'สระบุรี', 'สิงห์บุรี', 'สุโขทัย', 'สุพรรณบุรี', 'สุราษฎร์ธานี', 'สุรินทร์', 'หนองคาย', 'หนองบัวลำภู', 'อ่างทอง', 'อำนาจเจริญ', 'อุดรธานี', 'อุตรดิตถ์', 'อุทัยธานี', 'อุบลราชธานี'];
  const CARRIERS = ['Kerry Express', 'Flash Express', 'J&T Express', 'ไปรษณีย์ไทย (EMS)', 'Lalamove', 'ร้านจัดส่งเอง'];

  function totals(method, sub = cart.subtotal()) {
    const s = SHIPPING[method];
    const shipping = s ? s.fee(sub) : 0;
    const total = sub + shipping;
    return { subtotal: sub, shipping, total, vat: Math.round(total * 7 / 107) };
  }

  /* ---------- order status model ---------- */
  const PAY = {
    pending: { label: 'รอชำระเงิน', tone: 'warn' },
    awaiting_verification: { label: 'รอตรวจสอบสลิป', tone: 'warn' },
    paid: { label: 'ชำระแล้ว', tone: 'ok' },
    failed: { label: 'ชำระไม่สำเร็จ', tone: 'bad' },
    refunded: { label: 'คืนเงินแล้ว', tone: 'muted' }
  };
  const STATUS = {
    placed: { label: 'ได้รับคำสั่งซื้อ', desc: 'ร้านได้รับคำสั่งซื้อของคุณแล้ว' },
    confirmed: { label: 'ยืนยันคำสั่งซื้อ', desc: 'ร้านยืนยันราคาและสินค้าแล้ว' },
    packing: { label: 'กำลังแพ็กสินค้า', desc: 'ตรวจสอบสินค้าและบรรจุหีบห่อ' },
    shipped: { label: 'ส่งมอบให้ขนส่งแล้ว', desc: 'พัสดุอยู่ระหว่างการขนส่ง' },
    out_for_delivery: { label: 'กำลังนำส่ง', desc: 'พนักงานขนส่งกำลังนำส่งถึงคุณ' },
    delivered: { label: 'จัดส่งสำเร็จ', desc: 'ลูกค้าได้รับสินค้าแล้ว' },
    ready_for_pickup: { label: 'พร้อมให้รับที่ร้าน', desc: 'สินค้าพร้อมแล้ว นำเลขคำสั่งซื้อมาแสดงที่ร้าน' },
    picked_up: { label: 'รับสินค้าแล้ว', desc: 'ลูกค้ารับสินค้าที่ร้านเรียบร้อย' },
    cancelled: { label: 'ยกเลิก', desc: 'คำสั่งซื้อนี้ถูกยกเลิก' }
  };
  const FLOW = {
    delivery: ['placed', 'confirmed', 'packing', 'shipped', 'out_for_delivery', 'delivered'],
    pickup: ['placed', 'confirmed', 'packing', 'ready_for_pickup', 'picked_up']
  };
  const flowOf = (o) => FLOW[o.shipping.method === 'pickup' ? 'pickup' : 'delivery'];

  /* ---------- orders ---------- */
  function newOrderNo() {
    const d = new Date();
    const ymd = String(d.getFullYear()).slice(2) + String(d.getMonth() + 1).padStart(2, '0') + String(d.getDate()).padStart(2, '0');
    let no;
    do { no = `USC-${ymd}-${Math.floor(1000 + Math.random() * 9000)}`; } while (mem.orders.some((o) => o.no === no));
    return no;
  }
  const orders = {
    list() { return mem.orders.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt)); },
    get(no) { return mem.orders.find((o) => o.no === String(no || '').trim().toUpperCase()); },
    find(no, phone) { const o = orders.get(no); return o && digits(o.customer.phone).slice(-4) === digits(phone).slice(-4) ? o : null; },
    create(data) {
      const now = new Date().toISOString();
      const o = Object.assign({
        no: newOrderNo(), createdAt: now, status: 'placed', demo: true,
        history: [{ at: now, status: 'placed', note: 'สร้างคำสั่งซื้อ (โหมดสาธิต)', by: 'customer' }]
      }, data);
      mem.orders.push(o); save();
      return o;
    },
    update(no, patch, event) {
      const o = orders.get(no); if (!o) return null;
      Object.keys(patch || {}).forEach((k) => {
        if (patch[k] && typeof patch[k] === 'object' && !Array.isArray(patch[k]) && o[k] && typeof o[k] === 'object') Object.assign(o[k], patch[k]);
        else o[k] = patch[k];
      });
      if (event) o.history.push(Object.assign({ at: new Date().toISOString() }, event));
      save();
      return o;
    },
    remove(no) { mem.orders = mem.orders.filter((o) => o.no !== no); save(); },
    reset() { mem = blank(); save(); }
  };

  // shrink an uploaded slip so it fits comfortably in localStorage
  function compressImage(file, max = 900) {
    return new Promise((resolve, reject) => {
      if (!file || !/^image\//.test(file.type)) { reject(new Error('type')); return; }
      const r = new FileReader();
      r.onerror = reject;
      r.onload = () => {
        const img = new Image();
        img.onerror = reject;
        img.onload = () => {
          const k = Math.min(1, max / Math.max(img.width, img.height));
          const c = document.createElement('canvas');
          c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
          c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
          resolve(c.toDataURL('image/jpeg', 0.72));
        };
        img.src = r.result;
      };
      r.readAsDataURL(file);
    });
  }

  window.USCampStore = {
    cart, orders, totals, thb, dateTH, digits, valid, cardBrand, compressImage,
    SHIPPING, METRO, PROVINCES, CARRIERS, STORE, PAY, STATUS, FLOW, flowOf,
    BANK: [
      { bank: 'ธนาคารกสิกรไทย', short: 'KBank', color: '#138f2d', acct: 'xxx-x-x0000-x', name: 'บจก. ยูเอส แคมป์ (บัญชีตัวอย่าง)' },
      { bank: 'ธนาคารไทยพาณิชย์', short: 'SCB', color: '#4e2a84', acct: 'xxx-x-x0000-x', name: 'บจก. ยูเอส แคมป์ (บัญชีตัวอย่าง)' },
      { bank: 'ธนาคารกรุงเทพ', short: 'BBL', color: '#1e3a8a', acct: 'xxx-x-x0000-x', name: 'บจก. ยูเอส แคมป์ (บัญชีตัวอย่าง)' }
    ],
    CONTACT: { line: '@uscamp', phone: '0X-XXX-XXXX (ตัวอย่าง)', email: 'hello@uscamp.co' }
  };
})();
