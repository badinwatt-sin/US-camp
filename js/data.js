/* US Camp — shared catalogue data (illustrative; confirm specs with supplier) */
window.USCampData = {
  models: [
    { id: 'traveler', name: 'Traveler', sleeps: '2–3', w: 2.4, d: 2.4, h: 1.85, scale: 0.82,
      desc: 'เต้นท์ขนาดกะทัดรัดสำหรับคู่รักหรือทริปเดี่ยว กางเร็ว ขนย้ายง่าย แต่ยังได้ความโปร่งแบบ Springbar เต็มๆ' },
    { id: 'highline', name: 'Highline', sleeps: '4', w: 3.0, d: 3.0, h: 2.0, scale: 1,
      desc: 'รุ่นยอดนิยมที่สมดุลที่สุด ผนังสูงยืนเดินได้สบาย พอดีสำหรับครอบครัวเล็กหรือคนที่ชอบพื้นที่' },
    { id: 'vista', name: 'Vista', sleeps: '6', w: 3.0, d: 4.2, h: 2.05, scale: 1.12,
      desc: 'ห้องนั่งเล่นกลางป่า ยาวขึ้นสำหรับวางเตียงสนามและโต๊ะ เหมาะกับการตั้งแคมป์หลายคืน' },
    { id: 'outfitter', name: 'Outfitter', sleeps: '8', w: 3.6, d: 4.8, h: 2.3, scale: 1.25,
      desc: 'เบสแคมป์ขนาดใหญ่สำหรับกลุ่มเพื่อนหรือครอบครัวใหญ่ ติดเตาฟืนแล้วยังเหลือพื้นที่อีกเพียบ' }
  ],
  colors: [
    { id: 'tan', name: 'Classic Tan', th: 'สีแทนคลาสสิก', wall: '#C9A06A', shade: '#A98250', roof: '#F1EBDD', roofShade: '#D9D1BF' },
    { id: 'sage', name: 'Sage', th: 'เขียวเสจ', wall: '#9AA386', shade: '#7D8669', roof: '#EFEDE2', roofShade: '#D5D3C5' },
    { id: 'saddle', name: 'Saddle Brown', th: 'น้ำตาลอานม้า', wall: '#8E6142', shade: '#6F4A31', roof: '#ECE4D3', roofShade: '#D2C8B4' },
    { id: 'natural', name: 'Natural Canvas', th: 'ผ้าดิบธรรมชาติ', wall: '#E6DCC6', shade: '#C9BEA6', roof: '#F6F2E8', roofShade: '#DCD5C6' }
  ],
  terrains: [
    { id: 'desert', name: 'Desert Mesa', th: 'ทะเลทรายผาแดง', word: 'Mesa' },
    { id: 'forest', name: 'Pine Forest', th: 'ป่าสนบนดอย', word: 'Pines' },
    { id: 'lake', name: 'Mountain Lake', th: 'ทะเลสาบหุบเขา', word: 'Lake' },
    { id: 'meadow', name: 'River Meadow', th: 'ทุ่งหญ้าริมลำธาร', word: 'Meadow' }
  ],
  moods: [
    { id: 'dawn', name: 'Dawn', th: 'รุ่งเช้า', word: 'Early Light', time: '05:48' },
    { id: 'noon', name: 'High Noon', th: 'เที่ยงวัน', word: 'High Sun', time: '12:30' },
    { id: 'golden', name: 'Golden Hour', th: 'แสงเย็น', word: 'Golden', time: '17:52' },
    { id: 'night', name: 'Fireside', th: 'กลางคืน', word: 'Starlight', time: '21:15' }
  ],
  items: {
    shelter: [
      { id: 'awning', name: 'Canvas Awning', th: 'กันสาดหน้าเต้นท์ ร่มเงาสำหรับนั่งเล่น', icon: 'M4 18 L20 8 L36 18 M8 18 V34 M32 18 V34' },
      { id: 'tarp', name: 'Ground Tarp', th: 'ผ้าปูรองพื้น ปกป้องพื้นเต้นท์', icon: 'M4 28 L14 20 H36 L26 28 Z' },
      { id: 'stove', name: 'Wood Stove + Jack', th: 'เตาฟืนพร้อมช่องปล่องควัน อุ่นทั้งคืน', icon: 'M10 34 V20 H28 V34 M24 20 V4 H28 V20 M14 26 H24' },
      { id: 'cot', name: 'Canvas Cot', th: 'เตียงสนามผ้าแคนวาส นอนสบายเหนือพื้น', icon: 'M4 20 H36 M8 20 L6 30 M32 20 L34 30 M8 16 H18' }
    ],
    living: [
      { id: 'rug', name: 'Wool Camp Rug', th: 'พรมลายอเมริกันหน้าประตู', icon: 'M6 14 H34 L30 28 H2 Z M10 18 H28' },
      { id: 'chairs', name: 'Canvas Chairs ×2', th: 'เก้าอี้ผ้าใบโครงไม้', icon: 'M8 32 L12 14 H26 L30 32 M10 22 H28' },
      { id: 'table', name: 'Wood Camp Table', th: 'โต๊ะไม้พับได้', icon: 'M4 16 H36 M10 16 L8 32 M30 16 L32 32' },
      { id: 'lantern', name: 'Brass Lanterns', th: 'ตะเกียงแขวนเสา Awning', icon: 'M14 10 H26 V30 H14 Z M18 4 H22 V10 M17 16 H23 V24 H17Z' },
      { id: 'lights', name: 'String Lights', th: 'ไฟสายแบบวินเทจ', icon: 'M2 10 Q20 26 38 10 M10 16 v4 M20 18 v4 M30 16 v4' },
      { id: 'fire', name: 'Fire Pit', th: 'ลานก่อไฟ', icon: 'M8 32 L32 24 M8 24 L32 32 M20 24 C12 16 18 10 20 4 C22 10 28 16 20 24' },
      { id: 'cooler', name: 'Classic Cooler', th: 'กระติกน้ำแข็งสีครีม', icon: 'M6 14 H34 V32 H6 Z M6 18 H34 M16 24 H24' }
    ]
  },
  presets: {
    weekend: { terrain: 'forest', model: 'highline', color: 'tan', mood: 'golden', items: ['awning', 'tarp', 'chairs', 'table', 'fire', 'cooler'] },
    nomad: { terrain: 'desert', model: 'traveler', color: 'saddle', mood: 'golden', items: ['awning', 'tarp', 'rug', 'chairs', 'lantern', 'fire'] },
    cabin: { terrain: 'lake', model: 'vista', color: 'natural', mood: 'night', items: ['tarp', 'stove', 'cot', 'rug', 'lantern', 'lights', 'chairs'] },
    family: { terrain: 'meadow', model: 'outfitter', color: 'sage', mood: 'noon', items: ['awning', 'tarp', 'cot', 'chairs', 'table', 'lights', 'cooler', 'fire'] }
  }
};
