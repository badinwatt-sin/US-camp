/* US Camp — catalogue data
   Specs: springbar.com product pages (Nov 2026). Metric values converted from feet/inches.
   Geometry ratios (roof vs. footprint) are estimated from Springbar product photos and
   field-guide outlines; they are for visualisation, not manufacturing. */
window.USCampData = {
  models: [
    { id: 'compact', name: 'Compact', tag: 'The classic two-person',
      ft: "6' × 8'", ftH: '52"', sleeps: '1–2', weight: '15 kg', area: '4.5 m²',
      w: 2.44, d: 1.83, h: 1.32, rw: 0.6, rd: 0.62, door: 'rollup', back: 'rollup', centerPole: false, awning: false,
      openings: 'ประตูม้วนเก็บได้ทั้งหน้าและหลัง',
      desc: 'Springbar ไซซ์สองคนรุ่นคลาสสิก ตัวเตี้ยกว่า โครงสปริงบาร์เต็มระบบ เลยนิ่งเป็นพิเศษเวลาลมแรงหรือพายุเข้า เหมาะกับคนชอบเดินทางเบาๆ' },
    { id: 'outfitter', name: 'Outfitter', tag: 'Built to go places',
      ft: "7' × 9'", ftH: "6.2'", sleeps: '2–3', weight: '18 kg', area: '5.9 m²',
      w: 2.13, d: 2.74, h: 1.89, rw: 0.66, rd: 0.6, door: 'rollup', back: 'window-center', centerPole: false, awning: false,
      openings: 'ประตูม้วนหน้า · หน้าต่างบานใหญ่ด้านหลัง',
      desc: 'ได้แรงบันดาลใจจากเต้นท์ที่ Jack ทำให้คนต้อนม้าและไกด์ล่องแก่ง เป็น Springbar ที่เบาและพับเก็บได้เล็กที่สุดที่ยังยืนเดินในเต้นท์ได้ เสา 3 ท่อนใส่ท้ายรถได้สบาย' },
    { id: 'vagabond', name: 'Vagabond', tag: 'Everything you need, nothing you don’t',
      ft: "8' × 10'", ftH: "6.5'", sleeps: '2–4', weight: '27 kg', area: '7.4 m²',
      w: 3.05, d: 2.44, h: 1.98, rw: 0.6, rd: 0.6, door: 'a-center', back: 'window-wide', centerPole: true, awning: false,
      openings: 'ประตูกว้าง 26" · หน้าต่างเต็มความกว้างด้านหลัง',
      desc: 'ประตูเดียว หน้าต่างเดียว กับโครง Springbar ที่ไว้ใจได้ ความเรียบง่ายนี่แหละที่ทำให้มันดี จนเป็นรุ่นโปรดของทีมงานที่ Salt Lake City เอง' },
    { id: 'traveler', name: 'Traveler', tag: 'The original since the 1960s',
      ft: "10' × 10'", ftH: "6.5'", sleeps: '2–6', weight: '33 kg', area: '9.3 m²',
      w: 3.05, d: 3.05, h: 1.98, rw: 0.62, rd: 0.58, door: 'a-left', back: 'window-pair', centerPole: true, awning: true,
      openings: 'ประตู 26" · หน้าต่างมุ้งสูงเต็มผนัง 3 บาน',
      desc: 'จะเรียกว่าคลาสสิก ไร้กาลเวลา หรือไอคอนก็ได้ Traveler 10×10 ฟุตคือ Springbar ต้นฉบับ ผลิตต่อเนื่องมาตั้งแต่กลางยุค 60 พื้นที่ 100 ตารางฟุต ยืนตัวตรงได้ทั้งหลัง' }
  ],
  colors: [
    { id: 'natural', name: 'Natural', th: 'ผ้าดิบธรรมชาติ', wall: '#CDBDA6', shade: '#B4A38D', roof: '#DCD6CA' },
    { id: 'suntan', name: 'Suntan', th: 'แทนอาบแดด', wall: '#B08852', shade: '#987447', roof: '#DCD6CA' },
    { id: 'pearl-gray', name: 'Pearl Gray', th: 'เทาไข่มุกอมเขียว', wall: '#9D9E8E', shade: '#84857A', roof: '#DCD6CA' },
    { id: 'driftwood', name: 'Driftwood', th: 'น้ำตาลขอนไม้', wall: '#8A7461', shade: '#725F4F', roof: '#DCD6CA' },
    { id: 'bison', name: 'Bison', th: 'น้ำตาลไบซัน', wall: '#574836', shade: '#45392B', roof: '#DCD6CA' }
  ],
  terrains: [
    { id: 'desert', name: 'High Desert', th: 'ทะเลทรายที่ราบสูง', word: 'Mesa', thumb: 'assets/img/real/awning-desert.jpg' },
    { id: 'forest', name: 'Pine Forest', th: 'ป่าสนบนดอย', word: 'Pines', thumb: 'assets/img/real/ranger.jpg' },
    { id: 'lake', name: 'Lakeside', th: 'ริมทะเลสาบ', word: 'Lake', thumb: 'assets/img/real/lake.jpg' },
    { id: 'range', name: 'Open Range', th: 'ทุ่งกว้างริมหุบเขา', word: 'Range', thumb: 'assets/img/real/canyon-autumn.jpg' }
  ],
  moods: [
    { id: 'dawn', name: 'First Light', th: 'รุ่งเช้า', word: 'First Light', time: '06:10' },
    { id: 'noon', name: 'High Noon', th: 'เที่ยงวัน', word: 'High Sun', time: '12:30' },
    { id: 'golden', name: 'Golden Hour', th: 'แสงเย็น', word: 'Golden', time: '17:52' },
    { id: 'night', name: 'Lantern Light', th: 'กลางคืน', word: 'Lantern', time: '21:15' }
  ],
  /* which real photo represents each setting × time of day */
  scenes: {
    desert: { dawn: 'awning-desert', noon: 'awning-desert', golden: 'desert-dusk', night: 'bags' },
    forest: { dawn: 'ranger-morning', noon: 'ranger', golden: 'mug', night: 'bags' },
    lake: { dawn: 'lake', noon: 'lake', golden: 'lake', night: 'bags' },
    range: { dawn: 'open-plain', noon: 'canyon-autumn', golden: 'ranch', night: 'bags' }
  },
  credits: {
    ranger: 'Springbar®', 'ranger-morning': 'Springbar®', 'awning-desert': 'Springbar®', 'canyon-autumn': 'Springbar®', 'open-plain': 'Springbar®', redrock: 'Springbar®',
    'desert-dusk': 'Springbar®', 'joshua-tree': 'Springbar®', 'forest-walk': 'Springbar®', snow: 'Springbar®', vintage: 'Springbar® archive',
    ranch: '@dellpickles', mug: '@jorduroy', river: '@jorduroy', bags: '@bloodknots', lantern: '@twora-camp', lake: '@twora-camp', pines: '@allaboutoutdoor_official'
  },
  items: {
    shelter: [
      { id: 'awning', name: 'Front Awning · Traveler', th: 'กันสาดหน้าเต้นท์ มาพร้อม Traveler', sku: [], included: true, img: 'assets/img/products/traveler-suntan.jpg', icon: 'M4 18 L20 8 L36 18 M8 18 V34 M32 18 V34' },
      { id: 'fly', name: 'Stormfly® Rain Fly', th: 'ฟลายชีทกันฝนหนัก สำหรับหน้ามรสุม', sku: [['stormfly', { compact: 'compact', outfitter: 'compact', vagabond: 'medium', traveler: 'medium' }]], icon: 'M2 20 L20 6 L38 20 M8 16 L8 32 M32 16 L32 32' },
      { id: 'tarp', name: 'Ground Tarp', th: 'ผ้าปูรองพื้นตามขนาดเต้นท์ ปกป้องพื้นไวนิล', sku: [['ground-tarp', { compact: '6x8', outfitter: '7x9', vagabond: '8x10', traveler: '10x10' }]], icon: 'M4 28 L14 20 H36 L26 28 Z' },
      { id: 'stove', name: 'Stove Jack + Wood Stove', th: 'ช่องปล่องควันแบบซิป + เตาฟืน อุ่นทั้งคืน', sku: [['stove-jack'], ['wood-stove']], icon: 'M10 34 V20 H28 V34 M24 20 V4 H28 V20 M14 26 H24' },
      { id: 'cot', name: 'Sleep Kit', th: 'เตียงสนาม + ถุงนอน 2 ที่', sku: [['sleep-kit']], icon: 'M4 20 H36 M8 20 L6 30 M32 20 L34 30 M8 16 H18' },
      { id: 'loft', name: 'Hanging Organizer', th: 'ที่แขวนเก็บของในเต้นท์', sku: [['organizer']], icon: 'M4 10 H36 L32 18 H8 Z M10 22 H30 V32 H10Z' }
    ],
    living: [
      { id: 'rug', name: 'Door Mat', th: 'พรมผ้าใบหน้าประตู Springbar®', sku: [['door-mat']], icon: 'M6 14 H34 L30 28 H2 Z M10 18 H28' },
      { id: 'chairs', name: 'Canvas Chairs ×2', th: 'เก้าอี้ผ้าใบ 2 ตัว', sku: [['chairs']], icon: 'M8 32 L12 14 H26 L30 32 M10 22 H28' },
      { id: 'table', name: 'Wood Camp Table', th: 'โต๊ะไม้พับได้', sku: [['table']], icon: 'M4 16 H36 M10 16 L8 32 M30 16 L32 32' },
      { id: 'lantern', name: 'Brass Lantern + Strap', th: 'ตะเกียงแขวน + สายแขวน Springbar®', sku: [['lantern'], ['lantern-strap']], icon: 'M14 10 H26 V30 H14 Z M18 4 H22 V10 M17 16 H23 V24 H17Z' },
      { id: 'lights', name: 'String Lights', th: 'ไฟสายวินเทจ 10 เมตร', sku: [['string-lights']], icon: 'M2 10 Q20 26 38 10 M10 16 v4 M20 18 v4 M30 16 v4' },
      { id: 'fire', name: 'Fire Pit', th: 'ลานก่อไฟพร้อมกระทะ', sku: [['fire-pit']], icon: 'M8 32 L32 24 M8 24 L32 32 M20 24 C12 16 18 10 20 4 C22 10 28 16 20 24' },
      { id: 'cooler', name: 'Hard Cooler', th: 'กระติกน้ำแข็ง 45 ลิตร', sku: [['cooler']], icon: 'M6 14 H34 V32 H6 Z M6 18 H34 M16 24 H24' }
    ]
  },
  presets: {
    weekend: { terrain: 'forest', model: 'vagabond', color: 'suntan', mood: 'dawn', items: ['tarp', 'chairs', 'table', 'fire', 'cooler'] },
    nomad: { terrain: 'desert', model: 'outfitter', color: 'pearl-gray', mood: 'golden', items: ['tarp', 'rug', 'chairs', 'lantern', 'fire'] },
    cabin: { terrain: 'lake', model: 'traveler', color: 'natural', mood: 'night', items: ['awning', 'tarp', 'stove', 'cot', 'rug', 'lantern', 'lights'] },
    rancher: { terrain: 'range', model: 'traveler', color: 'bison', mood: 'golden', items: ['awning', 'fly', 'tarp', 'cot', 'chairs', 'fire', 'cooler'] }
  }
};
