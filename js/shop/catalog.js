/* US Camp — demo catalogue
   ALL PRICES ARE SIMULATED (THB). They are placeholders derived roughly from
   springbar.com USD list prices and must be confirmed before any real sale. */
(function () {
  'use strict';
  const D = window.USCampData;
  const PRICE = { compact: 26900, outfitter: 41500, vagabond: 37900, traveler: 53900 };

  const tents = D.models.map((m) => ({
    id: 'tent-' + m.id,
    type: 'tent',
    category: 'tents',
    model: m.id,
    name: 'Springbar® ' + m.name,
    short: m.name,
    tag: m.tag,
    price: PRICE[m.id],
    variants: D.colors.map((c) => ({ id: c.id, label: c.name, th: c.th, swatch: c.wall, roof: c.roof })),
    image: (v) => `assets/img/products/${m.id}-${v || 'natural'}.jpg`,
    back: `assets/img/products/${m.id}-back.jpg`,
    desc: m.desc,
    specs: [['ขนาดพื้น', m.ft], ['ความสูงภายใน', m.ftH], ['นอนได้', m.sleeps + ' คน'], ['น้ำหนักรวม', m.weight], ['ประตู/หน้าต่าง', m.openings]],
    leadTime: 'พร้อมส่ง 3–5 วันทำการหลังยืนยันราคา'
  }));

  const accessories = [
    { id: 'stormfly', category: 'shelter', name: 'Stormfly® Rain Fly', th: 'ฟลายชีทกันฝนหนัก', price: 6390, image: () => 'assets/img/shop/stormfly-medium.jpg',
      options: [{ id: 'compact', label: 'สำหรับ Compact / Outfitter', price: 5790, image: 'assets/img/shop/stormfly-compact.jpg' }, { id: 'medium', label: 'สำหรับ Vagabond / Traveler', price: 6390 }],
      desc: 'ฟลายชีทผ้าฝ้ายคลุมทั้งหลัง เพิ่มชั้นกันฝนและแดดจัด เหมาะกับหน้ามรสุมของไทย' },
    { id: 'portico', category: 'shelter', name: 'Cotton Portico Awning Panels', th: 'ผนังข้างกันสาด', price: 4490, image: () => 'assets/img/shop/portico.jpg',
      desc: 'แผงผ้าฝ้ายติดข้างกันสาด สร้างห้องนั่งเล่นหน้าเต้นท์ที่บังลมและแดดได้ (สำหรับ Traveler)' },
    { id: 'ground-tarp', category: 'shelter', name: 'Heavy-Duty Ground Tarp', th: 'ผ้าปูรองพื้น', price: 2590, image: () => 'assets/img/shop/ground-tarp.jpg',
      options: [{ id: '6x8', label: "6' × 8' · Compact", price: 2590 }, { id: '7x9', label: "7' × 9' · Outfitter", price: 2790 }, { id: '8x10', label: "8' × 10' · Vagabond", price: 2990 }, { id: '10x10', label: "10' × 10' · Traveler", price: 4190 }],
      desc: 'ผ้าใบปูรองพื้นขนาดพอดีเต้นท์ ปกป้องพื้นไวนิลจากหิน กิ่งไม้ และความชื้น' },
    { id: 'stove-jack', category: 'shelter', name: 'Zip-In Stove Jack', th: 'ช่องปล่องควันแบบซิป', price: 3590, image: () => 'assets/img/shop/stove-jack.jpg',
      desc: 'ช่องปล่องควันกันไฟแบบซิปติดตั้งที่ผนังเต้นท์ สำหรับใช้เตาฟืนในหน้าหนาว (ตรวจสอบรุ่นที่รองรับกับร้าน)' },
    { id: 'organizer', category: 'gear', name: 'Hanging Organizer', th: 'ที่แขวนเก็บของ', price: 690, image: () => 'assets/img/shop/organizer.jpg',
      desc: 'ช่องเก็บของแบบตาข่ายแขวนในเต้นท์ ไฟฉาย แว่น กุญแจรถ อยู่ที่เดียวกันหมด' },
    { id: 'door-mat', category: 'gear', name: 'Standard Door Mat', th: 'พรมหน้าประตู', price: 1090, image: () => 'assets/img/shop/door-mat.jpg',
      desc: 'พรมผ้าใบหน้าประตูเต้นท์ ถอดรองเท้าไว้ข้างนอก ข้างในสะอาดตลอดทริป' },
    { id: 'stake', category: 'gear', name: 'Military Aluminum Wedge Stake 12"', th: 'สมอบกอะลูมิเนียม (ต่อชิ้น)', price: 220, image: () => 'assets/img/shop/stake.jpg',
      desc: 'สมอบกอะลูมิเนียมทรงลิ่มยาว 12 นิ้ว ยึดแน่นในดินแข็งและดินร่วน ขายเป็นชิ้น' },
    { id: 'lantern-strap', category: 'gear', name: 'Lantern Strap', th: 'สายแขวนตะเกียง', price: 390, image: () => 'assets/img/shop/lantern-strap.jpg',
      desc: 'สายแขวนตะเกียงกลางเต้นท์ คล้องกับโครงหลังคาได้ทันที' },
    { id: 'tote', category: 'bags', name: 'Camp Tote', th: 'กระเป๋าผ้าแคนวาส', price: 1290, image: () => 'assets/img/shop/tote.jpg',
      desc: 'กระเป๋าผ้าแคนวาสทรงโท้ต ตัดเย็บที่ Salt Lake City ใส่ของเข้าแคมป์หรือใช้ในเมือง' },
    { id: 'weekender', category: 'bags', name: 'Weekender Duffle', th: 'กระเป๋าดัฟเฟิล', price: 2690, image: () => 'assets/img/shop/weekender.jpg',
      desc: 'กระเป๋าดัฟเฟิลผ้าแคนวาสสำหรับทริปสุดสัปดาห์ จุเสื้อผ้า 2–3 วันพอดี' }
  ].map((a) => Object.assign({ type: 'accessory', short: a.name, leadTime: 'พร้อมส่ง 2–3 วันทำการหลังยืนยันราคา' }, a));

  const all = [...tents, ...accessories];
  const byId = (id) => all.find((p) => p.id === id);

  // price + image for a product with an optional variant/option
  function resolve(id, variant) {
    const p = byId(id);
    if (!p) return null;
    let price = p.price, image = p.image(variant), label = '';
    if (p.type === 'tent') {
      const v = p.variants.find((x) => x.id === variant) || p.variants[0];
      label = v.label; image = p.image(v.id);
    } else if (p.options) {
      const o = p.options.find((x) => x.id === variant) || p.options[0];
      price = o.price; label = o.label; if (o.image) image = o.image;
    }
    return { product: p, price, image, label };
  }

  window.USCampCatalog = {
    tents, accessories, all, byId, resolve,
    categories: [
      { id: 'all', label: 'ทั้งหมด' }, { id: 'tents', label: 'เต้นท์' },
      { id: 'shelter', label: 'อุปกรณ์เสริมเต้นท์' }, { id: 'gear', label: 'ของใช้ในแคมป์' }, { id: 'bags', label: 'กระเป๋า' }
    ]
  };
})();
