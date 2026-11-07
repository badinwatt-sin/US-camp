/* US Camp — Thai line-breaking
   Browsers break Thai with a dictionary that does not know many loanwords
   (แคนวาส, แคมป์, สปริงบาร์ …), so words get cut mid-word ("แคน|วาส").
   This keeps words whole and keeps short phrases together:
   - text is split into space-separated chunks (Thai writers put spaces between phrases)
   - a chunk of up to SHORT characters never breaks inside
   - longer chunks may break only between whole words (Intl.Segmenter),
     never inside a protected word, and never leaving a fragment of 1–2 characters
   - multi-word English names inside Thai text are joined with no-break spaces
   Each unbreakable piece becomes <span class="nw">; break points become <wbr>.
   If a piece is ever wider than its container, it falls back to normal wrapping. */
(function () {
  'use strict';
  const THAI = /[฀-๿]/;
  const SHORT = 13;
  const ZWSP = '​';
  const KEEP = [
    'แคนวาส', 'เต้นท์', 'เต็นท์', 'แคมป์', 'แคมเปอร์', 'เวิร์กช็อป', 'ลิงก์', 'ยูทาห์', 'ไบซัน', 'ไวนิล', 'คลาสสิก', 'วินเทจ',
    'ฟลายชีท', 'พึ่บพั่บ', 'สปริงบาร์', 'สปริง', 'ตารางฟุต', 'ตัดเย็บ', 'ยืนเดิน', 'ลงพื้น', 'ไนลอน', 'โชว์รูม', 'คาวบอย',
    'อะลูมิเนียม', 'กระติกน้ำแข็ง', 'ถุงนอน', 'เตียงสนาม', 'ผ้าใบ', 'ทะเลสาบ', 'ทะเลทราย', 'ที่ราบสูง', 'หุบเขา', 'ป่าสน',
    'เกรดทหาร', 'ไอคอน', 'โลโก้', 'ดริป', 'ซิป', 'ทริป', 'ไกด์', 'สเปก', 'โมเดล', 'สไตล์', 'มุ้ง', 'กันสาด', 'กันน้ำ',
    'ขนสัตว์', 'ทองเหลือง', 'กองทัพเรือ', 'อู่ต่อเรือ', 'ช่างเขียนแบบ', 'เต้นท์ไนลอน', 'อเมริกัน', 'ตะเกียง', 'เก้าอี้ผ้าใบ',
    'จิตวิญญาณ', 'ต้นแบบ', 'การเดินทาง', 'หลายรุ่น', 'ทุกหลัง', 'ทั้งหลัง', 'ยืนตัวตรง', 'ตกบรรทัด', 'ร้อนชื้น', 'หน้ามรสุม',
    'ผ้าแคนวาส', 'ยังคง', 'ไออุ่น', 'ส่งต่อ', 'พักผ่อน', 'สักครั้ง', 'ผ้าฝ้าย', 'ผ้าห่ม', 'ผ้าคลุม', 'ผ้าดิบ', 'แดดเย็น', 'แสงเย็น', 'รุ่งเช้า', 'กลางคืน', 'เที่ยงวัน'
  ].sort((a, b) => b.length - a.length);
  const LATIN_KEEP = /\b(Salt Lake City|Pitch Day|Camp Advisor|Camp Card|Build Your Camp|Leave No Trace|West Temple|Jack Kirkham(?: Sr\.| Jr\.)?|Jack Jr\.|AAA Tent &amp; Awning|AAA Tent & Awning|Kirkham’s Outdoor Products|Lantern Light|Golden Hour|High Noon|First Light|Field Guide|Est\. 1961)\b/g;

  const seg = (typeof Intl !== 'undefined' && Intl.Segmenter) ? new Intl.Segmenter('th', { granularity: 'word' }) : null;

  function protectedRanges(s) {
    const r = [];
    KEEP.forEach((w) => {
      let i = s.indexOf(w);
      while (i !== -1) { r.push([i, i + w.length]); i = s.indexOf(w, i + 1); }
    });
    return r;
  }

  // split one space-free chunk into unbreakable pieces
  function pieces(chunk) {
    if (!THAI.test(chunk) || chunk.length <= SHORT || !seg) return [chunk];
    const prot = protectedRanges(chunk);
    let cuts = [];
    for (const s of seg.segment(chunk)) if (s.index > 0) cuts.push(s.index);
    // no cut inside a protected word, before a mark/ๆ, or between digits/Latin
    cuts = cuts.filter((c) => !prot.some(([a, b]) => c > a && c < b)
      && !/^[ะ-ฺๅ-๎]/.test(chunk[c])
      && !(/[\w.,%°]/.test(chunk[c - 1]) && /[\w.,%°]/.test(chunk[c])));
    // group words into phrases of at least MIN characters, so compounds such as
    // ส่ง|ต่อ or พัก|ผ่อน stay together and no line starts with a 1–2 letter fragment
    const MIN = 6;
    const out = [];
    let start = 0;
    cuts.forEach((c) => {
      if (c - start >= MIN && chunk.length - c >= 3) { out.push(chunk.slice(start, c)); start = c; }
    });
    out.push(chunk.slice(start));
    // never leave a short tail on its own
    if (out.length > 1 && out[out.length - 1].length < 4) {
      const tail = out.pop();
      out.push(out.pop() + tail);
    }
    return out;
  }

  function processText(node) {
    const text = node.data;
    if (!THAI.test(text)) return;
    // one inline wrapper per text node, so flex/grid parents (buttons, chips)
    // still see a single item that can wrap across lines
    const frag = document.createElement('span');
    frag.className = 'th';
    const joined = text.replace(LATIN_KEEP, (m) => m.replace(/ /g, ' '));
    joined.split(/(\s+)/).forEach((part) => {
      if (!part) return;
      if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
      const ps = pieces(part);
      ps.forEach((p, i) => {
        // a zero-width space marks the break point (plain text works the same in every engine,
        // unlike <wbr> between no-wrap spans, which some WebKit builds lay out incorrectly)
        if (i > 0) frag.appendChild(document.createTextNode(ZWSP));
        const span = document.createElement('span');
        span.className = 'nw';
        span.textContent = p;
        frag.appendChild(span);
      });
    });
    // never change the words themselves: if the rebuilt text differs from the source, leave it alone
    if (frag.textContent.split(ZWSP).join('').replace(/ /g, ' ') !== text.replace(/ /g, ' ')) return;
    node.replaceWith(frag);
  }

  const SKIP = 'script,style,textarea,input,select,option,svg,canvas,.nw,[data-no-wrap]';
  function run(root) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: (n) => (!n.parentElement || n.parentElement.closest(SKIP) || !THAI.test(n.data))
        ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT
    });
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(processText);
    guard(root);
  }

  // a piece wider than its line box (very narrow cards) falls back to normal wrapping
  function guard(root) {
    const boxes = new Map();
    const blockOf = (el) => {
      let b = el.parentElement;
      while (b && b.parentElement && getComputedStyle(b).display.startsWith('inline') && !/flex|grid/.test(getComputedStyle(b).display)) b = b.parentElement;
      return b;
    };
    (root.querySelectorAll ? root : document).querySelectorAll('.nw').forEach((el) => {
      el.classList.remove('nw--free');
      const p = el.parentElement;
      if (!boxes.has(p)) boxes.set(p, blockOf(el));
      const box = boxes.get(p);
      if (box && box.clientWidth > 0 && el.offsetWidth > box.clientWidth + 1) el.classList.add('nw--free');
    });
  }

  let pending = false, busy = false;
  const queue = new Set();
  const mo = new MutationObserver((muts) => {
    if (busy) return;
    muts.forEach((m) => m.addedNodes.forEach((n) => {
      if (n.nodeType === 1 && !n.closest(SKIP)) queue.add(n);
      else if (n.nodeType === 3 && n.parentElement && !n.parentElement.closest(SKIP)) queue.add(n.parentElement);
    }));
    if (queue.size && !pending) {
      pending = true;
      requestAnimationFrame(() => {
        busy = true;
        queue.forEach((n) => { if (n.isConnected) run(n); });
        queue.clear(); pending = false;
        mo.takeRecords(); busy = false;
      });
    }
  });

  function start() {
    busy = true; run(document.body); mo.takeRecords(); busy = false;
    mo.observe(document.body, { childList: true, subtree: true });
    let t;
    window.addEventListener('resize', () => { clearTimeout(t); t = setTimeout(() => guard(document.body), 200); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => guard(document.body));
  }
  window.USCampThaiWrap = { run, pieces };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
