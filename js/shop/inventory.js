/* US Camp — inventory & POS (demo). Stored in this browser's localStorage like the rest of the demo.
   One stock pool for web and in-store sales. Every change is a ledger entry (movement), and on-hand
   quantities are derived from those entries, so history can always be audited.
   Costs, fees and opening stock are SIMULATED placeholders. */
(function () {
  'use strict';
  const C = window.USCampCatalog, S = window.USCampStore;
  const KEY = 'uscamp-inv-v1';

  /* ---------- SKUs: every sellable variant ---------- */
  function skuList() {
    const out = [];
    C.all.forEach((p) => {
      if (p.type === 'tent') p.variants.forEach((v) => out.push({ sku: `${p.id}:${v.id}`, id: p.id, variant: v.id }));
      else if (p.options) p.options.forEach((o) => out.push({ sku: `${p.id}:${o.id}`, id: p.id, variant: o.id }));
      else out.push({ sku: p.id, id: p.id, variant: null });
    });
    return out.map((x) => {
      const r = C.resolve(x.id, x.variant);
      return Object.assign(x, { name: r.product.name, label: r.label, price: r.price, image: r.image, group: r.product.type === 'tent' ? 'tents' : (r.product.partner ? 'partner' : 'accessories'), partner: !!r.product.partner });
    });
  }
  const skuOf = (id, variant) => (variant ? `${id}:${variant}` : id);

  /* ---------- state ---------- */
  const blank = () => ({ cost: {}, reorder: {}, moves: [], applied: {} });
  let mem = blank();
  function load() { try { const r = localStorage.getItem(KEY); if (r) mem = Object.assign(blank(), JSON.parse(r)); } catch (e) { /* private mode */ } }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(mem)); } catch (e) { /* quota */ } document.dispatchEvent(new CustomEvent('uscamp:inventory')); }
  load();
  window.addEventListener('storage', (e) => { if (e.key === KEY) { load(); document.dispatchEvent(new CustomEvent('uscamp:inventory')); } });

  // simulated unit cost: ~62% of price for Springbar goods, ~55% for partner gear
  const costOf = (s) => mem.cost[s.sku] != null ? mem.cost[s.sku] : Math.round(s.price * (s.partner ? 0.55 : 0.62) / 10) * 10;
  const reorderOf = (s) => mem.reorder[s.sku] != null ? mem.reorder[s.sku] : (s.group === 'tents' ? 1 : 3);

  function seedOpening() {
    if (mem.moves.length) return;
    const at = new Date(Date.now() - 30 * 864e5).toISOString();
    skuList().forEach((s, i) => {
      const qty = s.group === 'tents' ? [2, 3, 1, 2, 4][i % 5] : (s.id === 'stake' ? 40 : 4 + (i % 5));
      mem.moves.push({ at, sku: s.sku, qty, type: 'opening', note: 'ยอดยกมา (จำลอง)', by: 'system', cost: costOf(s) });
    });
    save();
  }

  function onHand(sku) { return mem.moves.reduce((n, m) => (m.sku === sku ? n + m.qty : n), 0); }
  // stock promised to orders that are placed but not yet paid
  function reserved(sku) {
    return S.orders.list().filter((o) => o.payment.status !== 'paid' && o.status !== 'cancelled' && !mem.applied[o.no])
      .reduce((n, o) => n + o.lines.filter((l) => skuOf(l.id, l.variant) === sku).reduce((k, l) => k + l.qty, 0), 0);
  }

  function move(sku, qty, type, note, ref, by = 'admin') {
    const s = skuList().find((x) => x.sku === sku);
    mem.moves.push({ at: new Date().toISOString(), sku, qty, type, note: note || '', ref: ref || '', by, cost: s ? costOf(s) : 0 });
  }

  /* ---------- keep stock in step with orders ----------
     paid & not cancelled → deduct once;  cancelled/refunded after deduction → return to stock */
  function syncOrders() {
    let changed = false;
    S.orders.list().forEach((o) => {
      const shouldDeduct = o.payment.status === 'paid' && o.status !== 'cancelled';
      const done = mem.applied[o.no];
      const type = o.channel === 'pos' ? 'sale-pos' : 'sale-web';
      if (shouldDeduct && !done) {
        o.lines.forEach((l) => move(skuOf(l.id, l.variant), -l.qty, type, `ขาย ${o.no}`, o.no, 'system'));
        mem.applied[o.no] = 'deducted'; changed = true;
      } else if (!shouldDeduct && done === 'deducted' && (o.status === 'cancelled' || o.payment.status === 'refunded')) {
        o.lines.forEach((l) => move(skuOf(l.id, l.variant), l.qty, 'return', `คืนสต็อก ${o.no}`, o.no, 'system'));
        mem.applied[o.no] = 'returned'; changed = true;
      }
    });
    if (changed) save();
  }

  /* ---------- POS sale ---------- */
  const POS_PAY = { cash: 'เงินสด', promptpay: 'พร้อมเพย์ QR', card: 'บัตร (เครื่อง EDC)' };
  function posSale(lines, payMethod, customer) {
    const sub = lines.reduce((n, l) => n + l.price * l.qty, 0);
    const now = new Date().toISOString();
    const o = S.orders.create({
      channel: 'pos',
      customer: Object.assign({ name: 'ลูกค้าหน้าร้าน', phone: '-', email: '' }, customer || {}),
      shipping: { method: 'pos', label: 'ขายหน้าร้าน (POS)', pickupDate: now.slice(0, 10), pickupTime: now.slice(11, 16), carrier: '', trackingNo: '' },
      payment: { method: 'pos-' + payMethod, label: POS_PAY[payMethod], status: 'paid', paidAt: now },
      lines: lines.map((l) => ({ id: l.id, variant: l.variant, name: l.name, label: l.label, price: l.price, qty: l.qty, image: l.image })),
      totals: { subtotal: sub, shipping: 0, total: sub, vat: Math.round(sub * 7 / 107) }
    });
    S.orders.update(o.no, { status: 'picked_up' }, { status: 'picked_up', note: `ขายหน้าร้าน ชำระด้วย${POS_PAY[payMethod]}`, by: 'admin', pay: 'paid' });
    syncOrders();
    return S.orders.get(o.no);
  }

  /* ---------- reporting ---------- */
  // simulated payment fees (confirm real rates with the gateway / bank)
  const FEE = { card: 0.0365, promptpay: 0.0165, transfer: 0, 'pos-cash': 0, 'pos-promptpay': 0, 'pos-card': 0.02 };
  function report(fromISO, toISO) {
    const inRange = (iso) => (!fromISO || iso >= fromISO) && (!toISO || iso < toISO);
    const sales = S.orders.list().filter((o) => o.payment.status === 'paid' && o.status !== 'cancelled' && inRange(o.payment.paidAt || o.createdAt));
    const costMap = {};
    mem.moves.forEach((m) => { if (m.cost) costMap[m.sku] = m.cost; });
    const sk = skuList();
    const unitCost = (sku) => costMap[sku] != null ? costMap[sku] : (sk.find((s) => s.sku === sku) ? costOf(sk.find((s) => s.sku === sku)) : 0);
    const r = { orders: sales.length, gross: 0, shipping: 0, vat: 0, net: 0, cogs: 0, fees: 0, byDay: {}, byChannel: { web: 0, pos: 0 }, byPay: {}, byProduct: {} };
    sales.forEach((o) => {
      const t = o.totals.total, ch = o.channel === 'pos' ? 'pos' : 'web', day = (o.payment.paidAt || o.createdAt).slice(0, 10);
      r.gross += t; r.shipping += o.totals.shipping || 0; r.vat += Math.round(t * 7 / 107);
      r.fees += Math.round(t * (FEE[o.payment.method] || 0));
      r.byChannel[ch] += t;
      r.byDay[day] = r.byDay[day] || { web: 0, pos: 0 }; r.byDay[day][ch] += t;
      const pl = o.payment.label || o.payment.method; r.byPay[pl] = (r.byPay[pl] || 0) + t;
      o.lines.forEach((l) => {
        const sku = skuOf(l.id, l.variant), c = unitCost(sku) * l.qty;
        r.cogs += c;
        const p = r.byProduct[sku] = r.byProduct[sku] || { name: l.name, label: l.label, qty: 0, revenue: 0, cost: 0 };
        p.qty += l.qty; p.revenue += l.price * l.qty; p.cost += c;
      });
    });
    r.net = r.gross - r.vat;
    r.cogsExVat = Math.round(r.cogs * 100 / 107);
    r.profit = r.net - r.cogsExVat - r.fees;
    r.margin = r.net ? r.profit / r.net : 0;
    r.aov = r.orders ? r.gross / r.orders : 0;
    return r;
  }
  function stockValue() {
    return skuList().reduce((n, s) => n + Math.max(0, onHand(s.sku)) * costOf(s), 0);
  }

  window.USCampInventory = {
    skuList, skuOf, onHand, reserved, available: (sku) => onHand(sku) - reserved(sku),
    costOf, reorderOf, setCost: (sku, v) => { mem.cost[sku] = v; save(); }, setReorder: (sku, v) => { mem.reorder[sku] = v; save(); },
    receive: (sku, qty, note, cost) => { if (cost != null) mem.cost[sku] = cost; move(sku, Math.abs(qty), 'receive', note); save(); },
    adjust: (sku, newQty, note) => { const d = newQty - onHand(sku); if (d) { move(sku, d, 'adjust', note || 'ปรับยอดหลังตรวจนับ'); save(); } },
    moves: () => mem.moves.slice().sort((a, b) => b.at.localeCompare(a.at)),
    syncOrders, posSale, report, stockValue, POS_PAY, FEE, seedOpening,
    reset: () => { mem = blank(); save(); seedOpening(); }
  };
  seedOpening();
  syncOrders();
})();
