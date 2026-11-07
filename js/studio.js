/* US Camp — 360° Tent Studio with real photography
   A product "photo spin": drag / swipe / arrow keys / slider rotate between real photographs.

   Today Springbar publishes two real angles per model (front-left 3/4 per colour, back-right 3/4 in
   Pearl Gray). Symmetric models also use mirrored copies to fill the opposite corners; the Traveler
   front is NOT mirrored because its door and window are asymmetric.
   When a full turntable set exists, add it to USCampData.spin[model] = { count: 36, path: 'assets/img/spin/{model}/{color}/{i}.jpg' }
   and the viewer uses every frame instead (no other change needed). */
(function () {
  'use strict';
  const D = window.USCampData;
  const $ = (s, c = document) => c.querySelector(s);
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const state = { model: 'traveler', color: 'suntan', auto: !reduced, angle: 325 };
  Object.defineProperty(state, 'awning', { get: () => state.model === 'traveler', enumerable: true });
  window.USCampStudio = { state };

  const SYMMETRIC = { compact: true, outfitter: true, vagabond: true, traveler: false };
  // hotspot positions on the real front photo (percent of a 1000 × 567 frame)
  const HOTSPOTS = {
    compact: { bar: [54, 27], door: [59, 58], wall: [30, 66] },
    outfitter: { bar: [55, 13], door: [60, 50], wall: [31, 56] },
    vagabond: { bar: [52, 12], door: [55, 55], wall: [26, 60] },
    traveler: { bar: [44, 12], door: [52, 58], wall: [20, 62], awning: [84, 20] }
  };

  /* ---------- frames for the current model/colour ---------- */
  function framesFor(model, color) {
    const seq = D.spin && D.spin[model];
    if (seq && seq.count) {
      return Array.from({ length: seq.count }, (_, i) => ({
        angle: (i * 360) / seq.count,
        src: seq.path.replace('{model}', model).replace('{color}', color).replace('{i}', String(i + 1).padStart(2, '0')),
        kind: 'seq'
      }));
    }
    const front = `assets/img/products/${model}-${color}.jpg`;
    const back = `assets/img/spin/${model}-back.jpg`;
    const f = [
      { angle: 325, src: front, kind: 'front' },
      { angle: 135, src: back, kind: 'back' },
      { angle: 225, src: back, mirror: true, kind: 'back' }
    ];
    if (SYMMETRIC[model]) f.push({ angle: 35, src: front, mirror: true, kind: 'front' });
    return f.sort((a, b) => a.angle - b.angle);
  }

  /* ---------- DOM ---------- */
  const stage = $('#spinStage'), spinEl = $('#spin'), hs = $('#hotspots'), note = $('#spinNote');
  const angleIn = $('#angle'), angleOut = $('#angleOut'), autoBtn = $('#autoRotate'), hint = $('#dragHint');
  let frames = [], imgs = [];

  function build() {
    frames = framesFor(state.model, state.color);
    stage.innerHTML = '';
    imgs = frames.map((fr) => {
      const im = new Image();
      im.className = 'spin__frame';
      im.alt = '';
      im.decoding = 'async';
      im.src = fr.src;
      im.draggable = false;
      if (fr.mirror) im.dataset.mirror = '1';
      stage.appendChild(im);
      return im;
    });
    stage.setAttribute('aria-label', `ภาพจริง Springbar ${D.models.find((m) => m.id === state.model).name} สี ${D.colors.find((c) => c.id === state.color).name} หมุนดูได้รอบตัว`);
    buildHotspots();
    render();
  }

  /* ---------- rendering: crossfade + slide between neighbouring real photos ---------- */
  const norm = (a) => ((a % 360) + 360) % 360;
  const smooth = (x) => x * x * (3 - 2 * x);
  let dominant = null;
  function render() {
    const a = norm(state.angle);
    // find the two frames around the current angle
    let i = frames.length - 1;
    for (let k = 0; k < frames.length; k++) if (frames[k].angle <= a) i = k;
    const A = frames[i], j = (i + 1) % frames.length, B = frames[j];
    const span = norm(B.angle - A.angle) || 360;
    const t = norm(a - A.angle) / span;
    // the photo holds for most of the arc, then hands over quickly: reads as turning, not blending
    const w = frames.length > 8 ? t : smooth(Math.min(1, Math.max(0, (t - 0.32) / 0.36)));
    const drift = frames.length > 8 ? 0 : 7; // % slide while turning
    imgs.forEach((im, k) => {
      let op = 0, x = 0, s = 1;
      if (k === i) { op = 1 - w; x = -t * drift; s = 1 - t * 0.04; }
      if (k === j) { op = Math.max(op, w); x = (1 - t) * drift; s = 0.96 + t * 0.04; }
      if (k === i && k === j) op = 1;
      im.style.opacity = op.toFixed(3);
      im.style.transform = `translateX(${x.toFixed(2)}%) scale(${(im.dataset.mirror ? -s : s).toFixed(4)}, ${s.toFixed(4)})`;
      im.style.zIndex = op > 0.5 ? 2 : 1;
    });
    const dom = w < 0.5 ? A : B;
    if (dom !== dominant) { dominant = dom; updateNotes(); }
    const deg = Math.round(norm(a));
    if (document.activeElement !== angleIn) angleIn.value = deg;
    angleOut.textContent = String(deg).padStart(3, '0') + '°';
    const atFront = dom.kind === 'front' && Math.abs(norm(a - dom.angle + 180) - 180) < 22;
    hs.classList.toggle('is-off', !atFront || dragging || state.auto);
    hs.dataset.mirror = dom.mirror ? '1' : '';
  }

  function updateNotes() {
    const backColorDiffers = dominant.kind === 'back' && state.color !== 'pearl-gray';
    note.textContent = dominant.kind === 'seq' ? '' : backColorDiffers ? 'ภาพด้านหลังเป็นสี Pearl Gray (ภาพตัวอย่าง)' : dominant.mirror ? 'มุมฝั่งตรงข้าม (ทรงสมมาตร)' : dominant.kind === 'front' ? 'ภาพจริงจาก Springbar®' : '';
    note.hidden = !note.textContent;
  }

  /* ---------- hotspots on the real front photo ---------- */
  function buildHotspots() {
    const m = D.models.find((x) => x.id === state.model);
    const p = HOTSPOTS[state.model];
    const defs = [
      { pos: p.bar, title: 'Spring Bar', text: 'เหล็กสปริงชุบแข็งด้านหน้าและหลัง ดึงหลังคาให้ตึงตลอดเวลา หัวใจที่ทำให้ Springbar กางง่ายและนิ่งกลางลม' },
      { pos: p.door, title: m.door === 'rollup' ? 'Roll-up Door' : '26" Door', text: m.door === 'rollup' ? 'ประตูม้วนเก็บด้านบน พร้อมมุ้งกันแมลงเต็มบาน' : 'ประตูกว้าง 26 นิ้วพร้อมมุ้ง พับผูกเก็บด้านข้างได้' },
      { pos: p.wall, title: 'Cotton Duck Canvas', text: 'ผ้าฝ้ายแคนวาสหนา ระบายอากาศได้ ผนังบานออกทุกด้าน ลมปะทะแล้วไหลผ่าน' }
    ];
    if (p.awning) defs.push({ pos: p.awning, title: 'Awning · เฉพาะ Traveler', text: 'กันสาดผ้าแคนวาสต่อจากสปริงบาร์ด้านหน้า มีให้เฉพาะรุ่น Traveler' });
    hs.innerHTML = defs.map((d) => `<div class="hotspot" style="--x:${d.pos[0]}%;--y:${d.pos[1]}%"><button class="hotspot__dot" aria-label="${d.title}"></button><div class="hotspot__card"><b>${d.title}</b>${d.text}</div></div>`).join('');
  }
  hs.addEventListener('click', (e) => {
    const b = e.target.closest('.hotspot__dot'); if (!b) return;
    const h = b.parentElement, open = !h.classList.contains('is-open');
    hs.querySelectorAll('.hotspot').forEach((x) => x.classList.remove('is-open'));
    h.classList.toggle('is-open', open);
  });

  /* ---------- interaction: drag with inertia, keys, slider, buttons, auto ---------- */
  let dragging = false, lastX = 0, vel = 0, raf = null, lastT = 0, tween = null;
  const setAuto = (on) => { state.auto = on; autoBtn.setAttribute('aria-pressed', on); };
  function stopTween() { tween = null; }
  spinEl.addEventListener('pointerdown', (e) => {
    if (e.target.closest('.hotspot')) return;
    dragging = true; lastX = e.clientX; vel = 0; stopTween(); setAuto(false);
    spinEl.setPointerCapture(e.pointerId); spinEl.classList.add('is-dragging');
    hint.classList.add('is-gone');
    hs.querySelectorAll('.hotspot').forEach((x) => x.classList.remove('is-open'));
  });
  spinEl.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const dx = e.clientX - lastX; lastX = e.clientX;
    const k = 360 / Math.max(320, spinEl.clientWidth * 1.4); // one full turn ≈ 1.4 widths
    state.angle -= dx * k; vel = -dx * k;
    render();
  });
  const end = () => { if (!dragging) return; dragging = false; spinEl.classList.remove('is-dragging'); };
  spinEl.addEventListener('pointerup', end);
  spinEl.addEventListener('pointercancel', end);
  spinEl.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); step(e.key === 'ArrowRight' ? 1 : -1); }
  });
  function step(dir) {
    setAuto(false); hint.classList.add('is-gone');
    // jump to the next real photo in that direction
    const a = norm(state.angle);
    const sorted = frames.map((f) => f.angle);
    let target = dir > 0 ? sorted.find((x) => x > a + 1) : [...sorted].reverse().find((x) => x < a - 1);
    if (target == null) target = dir > 0 ? sorted[0] + 360 : sorted[sorted.length - 1] - 360;
    let delta = target - a;
    if (dir > 0 && delta <= 0) delta += 360;
    if (dir < 0 && delta >= 0) delta -= 360;
    tween = { from: state.angle, to: state.angle + delta, start: performance.now(), dur: 700 };
  }
  $('#spinPrev').addEventListener('click', () => step(-1));
  $('#spinNext').addEventListener('click', () => step(1));
  angleIn.addEventListener('input', () => { setAuto(false); stopTween(); state.angle = +angleIn.value; render(); });
  autoBtn.addEventListener('click', () => setAuto(!state.auto));

  function loop(now) {
    raf = requestAnimationFrame(loop);
    const dt = Math.min(64, now - (lastT || now)); lastT = now;
    if (tween) {
      const p = Math.min(1, (now - tween.start) / tween.dur);
      state.angle = tween.from + (tween.to - tween.from) * (1 - Math.pow(1 - p, 3));
      if (p >= 1) tween = null;
      render();
    } else if (!dragging && Math.abs(vel) > 0.02) {
      state.angle += vel; vel *= 0.92; render();
    } else if (state.auto && !dragging) {
      state.angle += dt * 0.018; render();
    }
  }
  new IntersectionObserver((entries) => {
    const vis = entries[0].isIntersecting;
    if (vis && !raf) { lastT = 0; raf = requestAnimationFrame(loop); }
    if (!vis && raf) { cancelAnimationFrame(raf); raf = null; }
  }, { threshold: 0.05 }).observe(spinEl);

  /* ---------- side panel (model, colour, specs) ---------- */
  const chips = $('#modelChips'), sw = $('#colorSwatches');
  D.models.forEach((m) => {
    const b = document.createElement('button');
    b.className = 'chip'; b.textContent = m.name; b.dataset.id = m.id;
    b.addEventListener('click', () => { state.model = m.id; updateUI(); build(); });
    chips.appendChild(b);
  });
  D.colors.forEach((c) => {
    const b = document.createElement('button');
    b.className = 'swatch'; b.dataset.id = c.id; b.title = c.name; b.setAttribute('aria-label', c.name);
    b.style.setProperty('--wall', c.wall); b.style.setProperty('--roof', c.roof);
    b.addEventListener('click', () => { state.color = c.id; updateUI(); build(); });
    sw.appendChild(b);
  });
  function updateUI() {
    const m = D.models.find((x) => x.id === state.model), c = D.colors.find((x) => x.id === state.color);
    chips.querySelectorAll('.chip').forEach((b) => b.classList.toggle('is-active', b.dataset.id === m.id));
    sw.querySelectorAll('.swatch').forEach((b) => b.classList.toggle('is-active', b.dataset.id === c.id));
    $('#modelName').textContent = m.name;
    $('#modelTag').textContent = m.tag;
    $('#modelDesc').textContent = m.desc;
    $('#modelSpecs').innerHTML = `<div><dt>Footprint</dt><dd>${m.ft}</dd></div><div><dt>Height</dt><dd>${m.ftH}</dd></div><div><dt>Sleeps</dt><dd>${m.sleeps}</dd></div><div><dt>Weight</dt><dd>${m.weight}</dd></div>`;
    $('#modelOpenings').textContent = m.openings;
    $('#modelAwning').innerHTML = m.id === 'traveler'
      ? '<b>Awning:</b> มาพร้อมกันสาดด้านหน้า (มีเฉพาะรุ่น Traveler)'
      : '<b>Awning:</b> ไม่มีในรุ่นนี้ · กันสาดมีเฉพาะรุ่น Traveler';
    $('#colorName').innerHTML = `<b>${c.name}</b> · ${c.th}`;
  }
  $('#studioToBuild').addEventListener('click', () => {
    document.dispatchEvent(new CustomEvent('uscamp:usetent', { detail: { model: state.model, color: state.color } }));
  });

  window.USCampStudio.set = function (model, color) {
    let changed = false;
    if (model && model !== state.model) { state.model = model; changed = true; }
    if (color && color !== state.color) { state.color = color; changed = true; }
    updateUI();
    if (changed) build();
  };

  // preload every colour of the current model in the background for instant swatch changes
  const preload = () => D.colors.forEach((c) => { const im = new Image(); im.src = `assets/img/products/${state.model}-${c.id}.jpg`; });
  updateUI(); build();
  if ('requestIdleCallback' in window) requestIdleCallback(preload); else setTimeout(preload, 1500);
})();
