/* US Camp — 360° Tent Studio
   "3D vector" mode: a stylised Three.js model of each Springbar tent, drawn like a vector
   illustration (flat toon shading + ink outlines), modelled on the official product photos:
   flat tensioned roof between front/back spring bars, curled roof ends, bell-flared walls,
   corner poles, per-model doors and windows, triangle label, and the awning on the Traveler only.
   "Real photo" modes show the official Springbar front and back photographs. */
(function () {
  'use strict';
  const D = window.USCampData;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const state = { model: 'traveler', color: 'suntan', door: true, labels: true, auto: !reduced, view: '3d' };
  Object.defineProperty(state, 'awning', { get: () => state.model === 'traveler', enumerable: true });
  window.USCampStudio = { state };

  const viewer = $('#viewer'), canvas = $('#tentCanvas');

  /* =========================================================
     Side panel + view tabs (work even without WebGL)
     ========================================================= */
  const chips = $('#modelChips'), sw = $('#colorSwatches');
  D.models.forEach((m) => {
    const b = document.createElement('button');
    b.className = 'chip'; b.textContent = m.name; b.dataset.id = m.id;
    b.addEventListener('click', () => { state.model = m.id; updateUI(); rebuild(true); });
    chips.appendChild(b);
  });
  D.colors.forEach((c) => {
    const b = document.createElement('button');
    b.className = 'swatch'; b.dataset.id = c.id; b.title = c.name; b.setAttribute('aria-label', c.name);
    b.style.setProperty('--wall', c.wall); b.style.setProperty('--roof', c.roof);
    b.addEventListener('click', () => { state.color = c.id; updateUI(); recolor(); });
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
    renderPhoto();
  }

  /* real photos: front per colour, back (Pearl Gray only) */
  function renderPhoto() {
    const img = $('#studioPhoto img');
    const back = state.view === 'back';
    const src = back ? `assets/img/spin/${state.model}-back.jpg` : `assets/img/products/${state.model}-${state.color}.jpg`;
    const m = D.models.find((x) => x.id === state.model), c = D.colors.find((x) => x.id === state.color);
    if (img.getAttribute('src') !== src) {
      img.classList.add('is-swapping');
      const pre = new Image();
      pre.onload = () => { img.src = src; img.classList.remove('is-swapping'); };
      pre.src = src;
    }
    img.alt = `ภาพจริง Springbar ${m.name} ${back ? 'ด้านหลัง' : 'ด้านหน้า สี ' + c.name}`;
    $('#studioPhotoNote').textContent = back
      ? (state.color === 'pearl-gray' ? `${m.name} · ด้านหลัง · ภาพจริงจาก Springbar®` : `${m.name} · ด้านหลัง · ภาพจริงมีเฉพาะสี Pearl Gray`)
      : `${m.name} · ${c.name} · ด้านหน้า · ภาพจริงจาก Springbar®`;
  }
  $$('.view-tab').forEach((b) => b.addEventListener('click', () => {
    state.view = b.dataset.view;
    $$('.view-tab').forEach((x) => x.setAttribute('aria-selected', x === b));
    viewer.dataset.view = state.view;
    renderPhoto();
  }));
  $('#studioToBuild').addEventListener('click', () => {
    document.dispatchEvent(new CustomEvent('uscamp:usetent', { detail: { model: state.model, color: state.color } }));
  });
  window.USCampStudio.set = function (model, color) {
    let reb = false;
    if (model && model !== state.model) { state.model = model; reb = true; }
    if (color && color !== state.color) { state.color = color; recolor(); }
    updateUI();
    if (reb) rebuild(true);
  };

  /* =========================================================
     3D vector model
     ========================================================= */
  let rebuild = () => {}, recolor = () => {};
  updateUI();
  function fail() {
    const fb = $('#viewerFallback'); if (fb) fb.hidden = false;
    const h = $('#dragHint'); if (h) h.hidden = true;
  }
  if (!window.THREE || !canvas) { fail(); return; }
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true }); } catch (e) { fail(); return; }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const lin = (hex) => new THREE.Color(hex).convertSRGBToLinear();
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
  camera.position.set(-4.8, 1.9, 7.4);
  const controls = new THREE.OrbitControls(camera, canvas);
  controls.enableDamping = true; controls.dampingFactor = 0.08; controls.enablePan = false;
  controls.minPolarAngle = 0.35; controls.maxPolarAngle = Math.PI / 2 - 0.08;
  controls.autoRotate = state.auto; controls.autoRotateSpeed = 0.9;

  scene.add(new THREE.AmbientLight(0xffffff, 0.55));
  const sun = new THREE.DirectionalLight(0xffffff, 0.75);
  sun.position.set(-4, 8, 6);
  sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); sun.shadow.radius = 6; sun.shadow.bias = -0.0006;
  Object.assign(sun.shadow.camera, { left: -6, right: 6, top: 6, bottom: -6, near: 1, far: 30 });
  scene.add(sun);

  // shadow-only ground + soft contact shadow, on a clean white studio background
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.ShadowMaterial({ opacity: 0.16 }));
  ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
  const blob = (() => {
    const c = document.createElement('canvas'); c.width = c.height = 256;
    const g = c.getContext('2d'); const r = g.createRadialGradient(128, 128, 10, 128, 128, 128);
    r.addColorStop(0, 'rgba(40,30,20,.35)'); r.addColorStop(1, 'rgba(40,30,20,0)');
    g.fillStyle = r; g.fillRect(0, 0, 256, 256);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false }));
    m.rotation.x = -Math.PI / 2; m.position.y = 0.002; scene.add(m); return m;
  })();

  // toon ramp: three flat tones like a vector illustration
  const ramp = (() => {
    const d = new Uint8Array([120, 120, 120, 255, 200, 200, 200, 255, 255, 255, 255, 255]);
    const t = new THREE.DataTexture(d, 3, 1, THREE.RGBAFormat);
    t.minFilter = t.magFilter = THREE.NearestFilter; t.generateMipmaps = false; t.needsUpdate = true;
    return t;
  })();
  const toon = (hex, extra) => new THREE.MeshToonMaterial(Object.assign({ color: lin(hex), gradientMap: ramp, side: THREE.DoubleSide }, extra || {}));
  const INK = 0x2A231C;
  const mats = {
    wall: toon(0xB08852), flap: toon(0x987447), roof: toon(0xE4DDCE), curl: toon(0xCFC4B0),
    trim: toon(0xEDE7DA), mesh: toon(0x3A3127), floor: toon(0x2E2C28), label: toon(0xF3EEE3),
    steel: toon(0xC9C7C1), ink: new THREE.MeshBasicMaterial({ color: lin(INK) }),
    rope: new THREE.LineBasicMaterial({ color: lin(0x6B5E50), transparent: true, opacity: 0.6 })
  };
  recolor = function () {
    const c = D.colors.find((x) => x.id === state.color);
    mats.wall.color = lin(c.wall); mats.flap.color = lin(c.shade);
  };

  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  let G = null;
  function wallPoint(face, s, t) {
    const { W, Dp, Wr, Dr, P } = G;
    let T, B;
    if (face === 'front') { T = [-Wr / 2 + s * Wr, Dr / 2]; B = [-W / 2 + s * W, Dp / 2]; }
    else if (face === 'back') { T = [Wr / 2 - s * Wr, -Dr / 2]; B = [W / 2 - s * W, -Dp / 2]; }
    else if (face === 'right') { T = [Wr / 2, Dr / 2 - s * Dr]; B = [W / 2, Dp / 2 - s * Dp]; }
    else { T = [-Wr / 2, -Dr / 2 + s * Dr]; B = [-W / 2, -Dp / 2 + s * Dp]; }
    const f = 0.78 * t + 0.22 * Math.pow(t, P);
    const p = V(T[0] + (B[0] - T[0]) * f, G.H * (1 - t), T[1] + (B[1] - T[1]) * f);
    const corner = Math.pow(t, 5) * 0.07 * Math.pow(Math.abs(2 * s - 1), 10);
    if (corner > 0) p.add(V(p.x, 0, p.z).normalize().multiplyScalar(corner));
    if (t > 0.9) p.y += 0.05 * Math.pow(Math.sin(Math.PI * ((s * 2) % 1)), 1.5) * (t - 0.9) / 0.1;
    return p;
  }
  const OUT = { front: V(0, 0, 1), back: V(0, 0, -1), right: V(1, 0, 0), left: V(-1, 0, 0) };
  function gridMesh(fn, nu, nv, mat) {
    const pos = [], idx = [];
    for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) { const p = fn(i / nu, j / nv); pos.push(p.x, p.y, p.z); }
    for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) { const a = j * (nu + 1) + i, b = a + 1, c = a + nu + 1, d = c + 1; idx.push(a, c, b, b, c, d); }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
    const m = new THREE.Mesh(g, mat); m.castShadow = true; m.receiveShadow = true; return m;
  }
  function wallPanel(face, t0, t1, range, mat, lift) {
    const off = OUT[face].clone().multiplyScalar(lift || 0.006);
    return gridMesh((u, v) => { const t = t0 + (t1 - t0) * v; const [s0, s1] = range(t); return wallPoint(face, s0 + (s1 - s0) * u, t).add(off); }, 10, 16, mat);
  }
  function rod(a, b, r, mat) {
    const dir = new THREE.Vector3().subVectors(b, a);
    const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, dir.length(), 8), mat);
    m.position.copy(a).addScaledVector(dir, 0.5); m.quaternion.setFromUnitVectors(V(0, 1, 0), dir.clone().normalize());
    m.castShadow = true; return m;
  }
  // ink outline: a thin tube along a list of points
  function ink(points, r = 0.009) {
    if (points.length < 2) return new THREE.Group();
    const curve = new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.1);
    const m = new THREE.Mesh(new THREE.TubeGeometry(curve, Math.max(8, points.length * 3), r, 6, false), mats.ink);
    return m;
  }
  const sample = (fn, n = 14) => Array.from({ length: n + 1 }, (_, i) => fn(i / n));
  const line = (a, b) => new THREE.Line(new THREE.BufferGeometry().setFromPoints([a, b]), mats.rope);

  let tent = null;
  const hotspotDefs = [];

  function buildTent() {
    const m = D.models.find((x) => x.id === state.model);
    G = { W: m.w, Dp: m.d, H: m.h, Wr: m.w * m.rw, Dr: m.d * m.rd, P: 3.2 };
    const { W, Dp, H, Wr, Dr } = G;
    const g = new THREE.Group();
    const lift = (f, k) => OUT[f].clone().multiplyScalar(k);

    // canvas walls
    ['front', 'back', 'left', 'right'].forEach((f) => g.add(gridMesh((u, v) => wallPoint(f, u, v), 20, 22, mats.wall)));
    // side-wall seams (ink)
    ['left', 'right'].forEach((f) => [0.34, 0.66].forEach((s) => g.add(ink(sample((t) => wallPoint(f, s, 0.03 + t * 0.95).add(lift(f, 0.006)), 12), 0.004))));
    const fl = new THREE.Mesh(new THREE.PlaneGeometry(W * 0.98, Dp * 0.98), mats.floor);
    fl.rotation.x = -Math.PI / 2; fl.position.y = 0.006; g.add(fl);

    // roof + curled ends
    const ext = 0.1;
    g.add(gridMesh((u, v) => {
      const x = -Wr / 2 - ext + u * (Wr + 2 * ext), z = -Dr / 2 + v * Dr;
      const crown = 0.035 * (1 - Math.pow(2 * u - 1, 2)), edge = Math.max(0, Math.abs(2 * u - 1) - 0.86) / 0.14;
      return V(x, H + 0.03 + crown - edge * edge * 0.06, z);
    }, 24, 8, mats.roof));
    [-1, 1].forEach((sg) => {
      const x = sg * (Wr / 2 + ext - 0.03);
      const tube = new THREE.Mesh(new THREE.TubeGeometry(new THREE.LineCurve3(V(x, H - 0.04, -Dr / 2 - 0.06), V(x, H - 0.04, Dr / 2 + 0.06)), 4, 0.085, 16, false), mats.curl);
      tube.castShadow = true; g.add(tube);
      [-1, 1].forEach((sz) => { const ring = new THREE.Mesh(new THREE.TorusGeometry(0.085, 0.006, 6, 24), mats.ink); ring.position.set(x, H - 0.04, sz * (Dr / 2 + 0.06)); g.add(ring); });
    });
    ['front', 'back'].forEach((f) => g.add(wallPanel(f, 0, 0.04, () => [0, 1], mats.trim, 0.005)));

    // spring bars
    [1, -1].forEach((sz) => {
      const z = sz * (Dr / 2 + 0.015);
      const bar = new THREE.Mesh(new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(V(-Wr / 2 - 0.1, H + 0.03, z), V(0, H + 0.075, z), V(Wr / 2 + 0.1, H + 0.03, z)), 30, 0.016, 8, false), mats.steel);
      bar.castShadow = true; g.add(bar);
    });
    // corner poles
    const pr = 0.018;
    [['front', 0], ['front', 1], ['back', 0], ['back', 1]].forEach(([f, s]) => {
      const top = wallPoint(f, s, 0).add(V(0, 0.03, 0)), bot = wallPoint(f, s, 1);
      const out = V(top.x, 0, top.z).normalize().multiplyScalar(0.022);
      g.add(rod(top.clone().add(out), bot.clone().add(out), pr, mats.steel));
    });
    if (m.centerPole) [1, -1].forEach((sz) => g.add(rod(V(0, 0, sz * (Dr / 2 - 0.02)), V(0, H + 0.05, sz * (Dr / 2 - 0.02)), pr, mats.steel)));

    // ink silhouette: wall corners, hem, top edges
    ['front', 'back'].forEach((f) => [0, 1].forEach((s) => g.add(ink(sample((t) => wallPoint(f, s, t).add(lift(f, 0.004)))))));
    ['front', 'back', 'left', 'right'].forEach((f) => g.add(ink(sample((s) => wallPoint(f, s, 0.995), 24), 0.008)));
    ['front', 'back'].forEach((f) => g.add(ink(sample((s) => wallPoint(f, s, 0.04).add(lift(f, 0.007)), 12), 0.006)));

    // openings
    const open = state.door;
    const outlineRange = (face, t0, t1, range, k = 0.012) => {
      g.add(ink(sample((t) => { const tt = t0 + (t1 - t0) * t; return wallPoint(face, range(tt)[0], tt).add(lift(face, k)); }), 0.006));
      g.add(ink(sample((t) => { const tt = t0 + (t1 - t0) * t; return wallPoint(face, range(tt)[1], tt).add(lift(face, k)); }), 0.006));
      g.add(ink([wallPoint(face, range(t0)[0], t0).add(lift(face, k)), wallPoint(face, range(t0)[1], t0).add(lift(face, k))], 0.006));
    };
    const addDoor = (face, type) => {
      if (type === 'rollup') {
        const s0 = m.id === 'compact' ? 0.34 : 0.33, s1 = 1 - s0, t0 = 0.12;
        g.add(wallPanel(face, t0, 1, () => [s0, s1], open ? mats.mesh : mats.flap, 0.008));
        g.add(wallPanel(face, t0, 1, () => [0.496, 0.504], mats.trim, 0.011));
        if (open) {
          const a = wallPoint(face, s0 - 0.01, t0 - 0.03).add(lift(face, 0.05)), b = wallPoint(face, s1 + 0.01, t0 - 0.03).add(lift(face, 0.05));
          g.add(rod(a, b, 0.045, mats.flap));
        }
        g.add(wallPanel(face, t0 - 0.02, t0, () => [s0 - 0.01, s1 + 0.01], mats.trim, 0.009));
        outlineRange(face, t0, 1, () => [s0, s1]);
      } else {
        const c = type === 'a-left' ? 0.37 : 0.5, t0 = 0.08;
        const hw = (t) => 0.012 + 0.105 * Math.pow((t - t0) / (1 - t0), 0.9);
        g.add(wallPanel(face, t0, 1, (t) => [c - hw(t), c + hw(t)], open ? mats.mesh : mats.flap, 0.008));
        if (open) {
          [-1, 1].forEach((sg) => {
            g.add(wallPanel(face, 0.3, 1, (t) => { const e = c + sg * hw(t); return sg < 0 ? [e - 0.06, e] : [e, e + 0.06]; }, mats.flap, 0.018));
            // cream tie-back ties
            const tie = wallPoint(face, c + sg * (hw(0.5) + 0.03), 0.5).add(lift(face, 0.03));
            const tm = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.018, 0.018), mats.trim); tm.position.copy(tie); tm.rotation.z = sg * 0.4; g.add(tm);
          });
        }
        outlineRange(face, t0, 1, (t) => [c - hw(t), c + hw(t)]);
      }
    };
    const addWindow = (face, s0, s1, t0, t1) => {
      g.add(wallPanel(face, t0 - 0.03, t1 + 0.03, () => [s0 - 0.025, s1 + 0.025], mats.trim, 0.006));
      g.add(wallPanel(face, t0, t1, () => [s0, s1], mats.mesh, 0.009));
      outlineRange(face, t0 - 0.03, t1 + 0.03, () => [s0 - 0.025, s1 + 0.025], 0.01);
      g.add(ink([wallPoint(face, s0 - 0.025, t1 + 0.03).add(lift(face, 0.01)), wallPoint(face, s1 + 0.025, t1 + 0.03).add(lift(face, 0.01))], 0.006));
    };
    addDoor('front', m.door);
    if (m.id === 'traveler') addWindow('front', 0.55, 0.8, 0.12, 0.9);
    if (m.back === 'rollup') addDoor('back', 'rollup');
    if (m.back === 'window-center') addWindow('back', 0.36, 0.64, 0.14, 0.62);
    if (m.back === 'window-wide') { addWindow('back', 0.2, 0.8, 0.1, 0.56); g.add(wallPanel('back', 0.1, 0.56, () => [0.496, 0.504], mats.trim, 0.012)); }
    if (m.back === 'window-pair') { addWindow('back', 0.2, 0.47, 0.1, 0.86); addWindow('back', 0.53, 0.8, 0.1, 0.86); }

    // Springbar triangle label
    const lab = m.door === 'a-left' ? 0.14 : (m.door === 'a-center' ? 0.24 : 0.2);
    const lw = (t) => { const k = (t - 0.62) / 0.18; return 0.05 * (1 - k) * (W > 2.5 ? 0.8 : 1); };
    g.add(wallPanel('front', 0.62, 0.8, (t) => [lab - lw(t), lab + lw(t)], mats.label, 0.014));
    outlineRange('front', 0.62, 0.8, (t) => [lab - lw(t), lab + lw(t)], 0.016);

    // stakes + guy lines
    ['front', 'back', 'left', 'right'].forEach((f) => [0, 0.5, 1].forEach((s) => {
      const p = wallPoint(f, s, 1), o = V(p.x, 0, p.z).normalize().multiplyScalar(0.08);
      g.add(rod(p.clone().add(o), p.clone().add(o).add(V(0, 0.07, 0)), 0.009, mats.ink));
    }));
    [[1, 1], [-1, 1], [1, -1], [-1, -1]].forEach(([sx, sz]) => g.add(line(V(sx * (Wr / 2 + 0.1), H + 0.03, sz * (Dr / 2 + 0.015)), V(sx * (W / 2 + 0.7), 0, sz * (Dp / 2 + 0.9)))));

    // awning — Traveler only
    if (state.awning) {
      const L = Math.min(2.0, Dp * 0.7), AW = Wr + 0.25;
      const aw = (u, v) => V(-AW / 2 + u * AW, H + 0.03 + v * 0.12 - Math.sin(Math.PI * v) * 0.05 - Math.pow(2 * u - 1, 2) * 0.04 * v, Dr / 2 + 0.02 + v * L);
      g.add(gridMesh(aw, 14, 10, mats.wall));
      g.add(ink(sample((u) => aw(u, 1), 16), 0.008));
      [0, 1].forEach((u) => g.add(ink(sample((v) => aw(u, v), 10), 0.007)));
      [-1, 1].forEach((sx) => {
        const top = V(sx * (AW / 2 - 0.02), H + 0.11, Dr / 2 + L);
        g.add(rod(V(top.x, 0, top.z), top.clone().add(V(0, 0.08, 0)), pr, mats.steel));
        g.add(line(top, V(top.x + sx * 0.5, 0, top.z + 0.9)));
      });
    }

    blob.scale.set(W * 1.9, Dp * 1.9 + (state.awning ? 1.2 : 0), 1);
    blob.position.z = state.awning ? 0.5 : 0;

    hotspotDefs.length = 0;
    hotspotDefs.push(
      { pos: V(Wr * 0.18, H + 0.09, Dr / 2 + 0.02), title: 'Spring Bar', text: 'เหล็กสปริงชุบแข็งด้านหน้าและหลัง ดึงหลังคาให้ตึงตลอดเวลา หัวใจที่ทำให้ Springbar กางง่ายและนิ่งกลางลม' },
      { pos: wallPoint('right', 0.5, 0.55).add(V(0.02, 0, 0)), title: 'Cotton Duck Canvas', text: 'ผ้าฝ้ายแคนวาสหนา ระบายอากาศได้ ผนังบานออกทุกด้าน ลมปะทะแล้วไหลผ่าน' },
      { pos: wallPoint('front', m.door === 'a-left' ? 0.37 : 0.5, 0.45).add(V(0, 0, 0.03)), title: m.door === 'rollup' ? 'Roll-up Door' : '26" Door', text: m.door === 'rollup' ? 'ประตูม้วนเก็บด้านบน พร้อมมุ้งกันแมลงเต็มบาน' : 'ประตูกว้าง 26 นิ้วพร้อมมุ้ง พับผูกเก็บด้านข้างได้' },
      { pos: wallPoint('back', 0.5, 0.35).add(V(0, 0, -0.03)), title: 'Views & Airflow', text: m.openings }
    );
    if (state.awning) hotspotDefs.push({ pos: V(0, H + 0.12, Dr / 2 + Math.min(2.0, Dp * 0.7) * 0.6), title: 'Awning · Traveler', text: 'กันสาดผ้าแคนวาสต่อจากสปริงบาร์ด้านหน้า มีให้เฉพาะรุ่น Traveler' });
    return g;
  }

  let rebuildT = 0;
  rebuild = function (reframe) {
    if (tent) { scene.remove(tent); tent.traverse((o) => { if (o.geometry) o.geometry.dispose(); }); }
    tent = buildTent(); recolor(); scene.add(tent);
    rebuildT = performance.now();
    buildHotspots();
    if (reframe) frame();
  };
  function frame() {
    const size = Math.max(G.W, G.Dp + (state.awning ? 1.6 : 0));
    controls.target.set(0, G.H * 0.5, state.awning ? 0.45 : 0);
    const dir = camera.position.clone().sub(controls.target).normalize();
    const dist = (size * 1.85 + 1.9) * (canvas.clientWidth < 600 ? 0.86 : 1);
    camera.position.copy(controls.target).addScaledVector(dir, dist);
    controls.minDistance = dist * 0.55; controls.maxDistance = dist * 1.7;
  }

  /* hotspots */
  const hsWrap = $('#hotspots');
  let hsEls = [];
  function buildHotspots() {
    hsWrap.innerHTML = '';
    hsEls = hotspotDefs.map((h) => {
      const el = document.createElement('div');
      el.className = 'hotspot';
      el.innerHTML = `<button class="hotspot__dot" aria-label="${h.title}"></button><div class="hotspot__card"><b>${h.title}</b>${h.text}</div>`;
      el.querySelector('button').addEventListener('click', (e) => {
        e.stopPropagation();
        const open = !el.classList.contains('is-open');
        hsEls.forEach((x) => x.classList.remove('is-open')); el.classList.toggle('is-open', open);
      });
      hsWrap.appendChild(el); return el;
    });
    hsWrap.hidden = !state.labels;
  }
  const tmp = new THREE.Vector3();
  function updateHotspots() {
    if (!state.labels) return;
    const w = canvas.clientWidth, h = canvas.clientHeight;
    const toCam = camera.position.clone().sub(controls.target).setY(0).normalize();
    hotspotDefs.forEach((d, i) => {
      const el = hsEls[i]; if (!el) return;
      tmp.copy(d.pos).project(camera);
      const x = (tmp.x * 0.5 + 0.5) * w, y = (-tmp.y * 0.5 + 0.5) * h;
      el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
      const toPt = d.pos.clone().sub(controls.target).setY(0);
      el.classList.toggle('is-hidden', !(toPt.length() < 0.35 || toPt.normalize().dot(toCam) > -0.1));
      el.querySelector('.hotspot__card').style.left = x > w - 240 ? '-232px' : '18px';
    });
  }

  /* controls */
  const angle = $('#angle'), angleOut = $('#angleOut'), autoBtn = $('#autoRotate'), hint = $('#dragHint');
  const setAuto = (on) => { state.auto = on; controls.autoRotate = on; autoBtn.setAttribute('aria-pressed', on); };
  autoBtn.addEventListener('click', () => setAuto(!state.auto));
  angle.addEventListener('input', () => {
    setAuto(false);
    const off = camera.position.clone().sub(controls.target);
    const sph = new THREE.Spherical().setFromVector3(off);
    sph.theta = (+angle.value) * Math.PI / 180;
    off.setFromSpherical(sph); camera.position.copy(controls.target).add(off);
  });
  controls.addEventListener('start', () => { hint.classList.add('is-gone'); setAuto(false); hsEls.forEach((x) => x.classList.remove('is-open')); });
  const tDoor = $('#tDoor'), tLabels = $('#tLabels');
  if (tDoor) tDoor.addEventListener('change', (e) => { state.door = e.target.checked; rebuild(false); });
  if (tLabels) tLabels.addEventListener('change', (e) => { state.labels = e.target.checked; hsWrap.hidden = !state.labels; });

  const box = $('#stage3d') || viewer;
  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.fov = w < 600 ? 40 : 30; camera.updateProjectionMatrix();
  }
  new ResizeObserver(resize).observe(box);

  let raf = null;
  function loop(now) {
    raf = requestAnimationFrame(loop);
    if (state.view !== '3d') return;
    if (tent) { const t = Math.min((now - rebuildT) / 600, 1); tent.scale.setScalar(0.95 + 0.05 * (1 - Math.pow(1 - t, 3))); }
    controls.update();
    const off = camera.position.clone().sub(controls.target);
    const deg = Math.round((Math.atan2(off.x, off.z) * 180 / Math.PI + 360) % 360);
    if (document.activeElement !== angle) angle.value = deg;
    angleOut.textContent = String(deg).padStart(3, '0') + '°';
    renderer.render(scene, camera);
    updateHotspots();
  }
  new IntersectionObserver((entries) => {
    const vis = entries[0].isIntersecting;
    if (vis && !raf) raf = requestAnimationFrame(loop);
    if (!vis && raf) { cancelAnimationFrame(raf); raf = null; }
  }, { threshold: 0.05 }).observe(viewer);

  resize();
  rebuild(true);
  renderer.render(scene, camera);
})();
