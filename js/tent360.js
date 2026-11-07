/* US Camp — 360° Tent Studio
   Procedural Springbar® tents (Three.js r128) modelled from the official
   front/rear product photos and field-guide outlines:
   flat tensioned roof between two spring bars, curled roof ends,
   near-upright end walls and strongly flared side walls. */
(function () {
  'use strict';
  const D = window.USCampData;
  const $ = (s) => document.querySelector(s);
  const canvas = $('#tentCanvas');
  const viewer = $('#viewer');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const state = { model: 'traveler', color: 'suntan', awning: true, door: true, labels: true, auto: !reduced, view: '3d' };
  window.USCampStudio = { state };

  /* ---------- panel UI ---------- */
  const chips = $('#modelChips');
  D.models.forEach((m) => {
    const b = document.createElement('button');
    b.className = 'chip'; b.textContent = m.name; b.dataset.id = m.id;
    b.addEventListener('click', () => { setModel(m.id); });
    chips.appendChild(b);
  });
  const sw = $('#colorSwatches');
  D.colors.forEach((c) => {
    const b = document.createElement('button');
    b.className = 'swatch'; b.dataset.id = c.id; b.title = c.name; b.setAttribute('aria-label', c.name);
    b.style.setProperty('--wall', c.wall); b.style.setProperty('--roof', c.roof);
    b.addEventListener('click', () => { state.color = c.id; updateUI(); recolor(); });
    sw.appendChild(b);
  });

  function setModel(id) {
    const m = D.models.find((x) => x.id === id);
    state.model = id;
    state.awning = m.awning;
    $('#tAwning').checked = state.awning;
    updateUI(); rebuild(true);
  }

  function updateUI() {
    const m = D.models.find((x) => x.id === state.model);
    const c = D.colors.find((x) => x.id === state.color);
    chips.querySelectorAll('.chip').forEach((b) => b.classList.toggle('is-active', b.dataset.id === m.id));
    sw.querySelectorAll('.swatch').forEach((b) => b.classList.toggle('is-active', b.dataset.id === c.id));
    $('#modelName').textContent = m.name;
    $('#modelTag').textContent = m.tag;
    $('#modelDesc').textContent = m.desc;
    $('#modelSpecs').innerHTML =
      `<div><dt>Footprint</dt><dd>${m.ft}</dd></div>` +
      `<div><dt>Height</dt><dd>${m.ftH}</dd></div>` +
      `<div><dt>Sleeps</dt><dd>${m.sleeps}</dd></div>` +
      `<div><dt>Weight</dt><dd>${m.weight}</dd></div>`;
    $('#modelOpenings').textContent = m.openings;
    $('#colorName').innerHTML = `<b>${c.name}</b> · ${c.th}`;
    const front = `assets/img/products/${m.id}-${c.id}.jpg`;
    const back = `assets/img/products/${m.id}-back.jpg`;
    const img = $('#studioPhoto img');
    const src = state.view === 'back' ? back : front;
    if (img.getAttribute('src') !== src) {
      img.classList.add('is-swapping');
      const pre = new Image();
      pre.onload = () => { img.src = src; img.alt = `Springbar ${m.name} ${state.view === 'back' ? '(ด้านหลัง)' : c.name}`; img.classList.remove('is-swapping'); };
      pre.src = src;
    }
    $('#studioPhotoNote').textContent = state.view === 'back'
      ? `ด้านหลัง ${m.name} · ภาพสินค้าจริงจาก Springbar® (สีในภาพอาจต่างจากที่เลือก)`
      : `${m.name} · ${c.name} · ภาพสินค้าจริงจาก Springbar®`;
  }

  /* view tabs: 3D / front photo / back photo */
  document.querySelectorAll('.view-tab').forEach((b) => b.addEventListener('click', () => {
    state.view = b.dataset.view;
    document.querySelectorAll('.view-tab').forEach((x) => x.setAttribute('aria-selected', x === b));
    viewer.dataset.view = state.view;
    updateUI();
  }));

  $('#studioToBuild').addEventListener('click', () => {
    document.dispatchEvent(new CustomEvent('uscamp:usetent', { detail: { model: state.model, color: state.color } }));
  });

  updateUI();

  /* ---------- WebGL ---------- */
  function fail() {
    const fb = $('#viewerFallback'); if (fb) fb.hidden = false;
    const hint = $('#dragHint'); if (hint) hint.hidden = true;
    window.USCampStudio.set = function (model, color) { if (model) state.model = model; if (color) state.color = color; updateUI(); };
  }
  if (!window.THREE || !canvas) return fail();
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true }); } catch (e) { return fail(); }

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const lin = (hex) => new THREE.Color(hex).convertSRGBToLinear();
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(lin(0xE6DDCB), 14, 34);
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
  camera.position.set(-4.8, 3.0, 7.8);

  const controls = new THREE.OrbitControls(camera, canvas);
  controls.enableDamping = true; controls.dampingFactor = 0.08;
  controls.enablePan = false;
  controls.minPolarAngle = 0.3; controls.maxPolarAngle = Math.PI / 2 - 0.05;
  controls.autoRotate = state.auto; controls.autoRotateSpeed = 0.8;

  scene.add(new THREE.HemisphereLight(0xFFF6E6, 0x7A6A55, 0.7));
  const sun = new THREE.DirectionalLight(0xFFEBD0, 0.95);
  sun.position.set(5, 9, 6);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -7, right: 7, top: 7, bottom: -7, near: 1, far: 30 });
  sun.shadow.radius = 5; sun.shadow.bias = -0.0005;
  scene.add(sun);
  const fill = new THREE.DirectionalLight(0xDDE6F0, 0.25); fill.position.set(-6, 4, -5); scene.add(fill);

  const ground = new THREE.Mesh(new THREE.CircleGeometry(16, 72), new THREE.MeshStandardMaterial({ color: lin(0xD6CCB9), roughness: 1 }));
  ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);

  /* canvas weave texture (also used as bump) */
  function weave() {
    const c = document.createElement('canvas'); c.width = c.height = 512;
    const g = c.getContext('2d');
    g.fillStyle = '#fff'; g.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 512; i += 2) {
      g.fillStyle = `rgba(0,0,0,${0.03 + Math.random() * 0.035})`; g.fillRect(0, i, 512, 1);
      g.fillStyle = `rgba(0,0,0,${0.025 + Math.random() * 0.03})`; g.fillRect(i, 0, 1, 512);
    }
    for (let k = 0; k < 3000; k++) { g.fillStyle = `rgba(70,50,30,${Math.random() * 0.05})`; g.fillRect(Math.random() * 512, Math.random() * 512, 2 + Math.random() * 3, 1); }
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(2, 2); t.anisotropy = 4;
    return t;
  }
  const wtex = weave();
  const mats = {
    wall: new THREE.MeshStandardMaterial({ map: wtex, bumpMap: wtex, bumpScale: 0.004, roughness: 0.96, side: THREE.DoubleSide }),
    roof: new THREE.MeshStandardMaterial({ map: wtex, bumpMap: wtex, bumpScale: 0.003, roughness: 0.9, side: THREE.DoubleSide }),
    trim: new THREE.MeshStandardMaterial({ map: wtex, roughness: 0.9, side: THREE.DoubleSide }),
    mesh: new THREE.MeshStandardMaterial({ color: lin(0x2E2A22), roughness: 1, side: THREE.DoubleSide, transparent: true, opacity: 0.93 }),
    inside: new THREE.MeshBasicMaterial({ color: lin(0x3A2C1E), side: THREE.DoubleSide }),
    floor: new THREE.MeshStandardMaterial({ color: lin(0x3B3A35), roughness: 0.7 }),
    steel: new THREE.MeshStandardMaterial({ color: lin(0xC8C6C0), metalness: 0.7, roughness: 0.3 }),
    rope: new THREE.LineBasicMaterial({ color: 0xEDE6D8, transparent: true, opacity: 0.75 }),
    label: new THREE.MeshStandardMaterial({ color: lin(0xEFE9DC), roughness: 0.8, side: THREE.DoubleSide }),
    curl: new THREE.MeshStandardMaterial({ map: wtex, color: lin(0xCFC6B4), roughness: 0.9, side: THREE.DoubleSide }),
    seam: new THREE.MeshStandardMaterial({ roughness: 1, side: THREE.DoubleSide })
  };
  mats.trim.color = lin(0xE6E1D6);

  function recolor() {
    const c = D.colors.find((x) => x.id === state.color);
    mats.wall.color = lin(c.wall);
    mats.roof.color = lin(c.roof);
    mats.seam.color = lin(c.shade);
  }

  const V = (x, y, z) => new THREE.Vector3(x, y, z);

  /* ---------- tent geometry ---------- */
  let G = null; // current geometry params

  // point on a wall: s = 0..1 across (viewer's left → right), t = 0 (top) .. 1 (ground)
  function wallPoint(face, s, t) {
    const { W, Dp, H, Wr, Dr, P } = G;
    let T, B;
    if (face === 'front') { T = [-Wr / 2 + s * Wr, Dr / 2]; B = [-W / 2 + s * W, Dp / 2]; }
    else if (face === 'back') { T = [Wr / 2 - s * Wr, -Dr / 2]; B = [W / 2 - s * W, -Dp / 2]; }
    else if (face === 'right') { T = [Wr / 2, Dr / 2 - s * Dr]; B = [W / 2, Dp / 2 - s * Dp]; }
    else { T = [-Wr / 2, -Dr / 2 + s * Dr]; B = [-W / 2, -Dp / 2 + s * Dp]; }
    const f = 0.55 * t + 0.45 * Math.pow(t, P);
    const p = V(T[0] + (B[0] - T[0]) * f, G.H * (1 - t), T[1] + (B[1] - T[1]) * f);
    // corners pulled out to the stakes, hem lifts between stake points
    const corner = Math.pow(t, 5) * 0.07 * Math.pow(Math.abs(2 * s - 1), 10);
    if (corner > 0) p.add(V(p.x, 0, p.z).normalize().multiplyScalar(corner));
    if (t > 0.9) p.y += 0.06 * Math.pow(Math.sin(Math.PI * ((s * 2) % 1)), 1.5) * (t - 0.9) / 0.1;
    return p;
  }
  const OUT = { front: V(0, 0, 1), back: V(0, 0, -1), right: V(1, 0, 0), left: V(-1, 0, 0) };

  function gridMesh(fn, nu, nv, mat, uvScale) {
    const pos = [], uv = [], idx = [];
    for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) {
      const p = fn(i / nu, j / nv);
      pos.push(p.x, p.y, p.z); uv.push((i / nu) * (uvScale ? uvScale[0] : 1), (j / nv) * (uvScale ? uvScale[1] : 1));
    }
    for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) {
      const a = j * (nu + 1) + i, b = a + 1, c = a + nu + 1, d = c + 1;
      idx.push(a, c, b, b, c, d);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    g.setIndex(idx); g.computeVertexNormals();
    const m = new THREE.Mesh(g, mat); m.castShadow = true; m.receiveShadow = true;
    return m;
  }
  // panel that follows the curved wall: range(t) returns [s0, s1]
  function wallPanel(face, t0, t1, range, mat, lift) {
    const off = OUT[face].clone().multiplyScalar(lift || 0.006);
    return gridMesh((u, v) => {
      const t = t0 + (t1 - t0) * v;
      const [s0, s1] = range(t);
      return wallPoint(face, s0 + (s1 - s0) * u, t).add(off);
    }, 10, 14, mat);
  }
  function rod(a, b, r, mat) {
    const dir = new THREE.Vector3().subVectors(b, a);
    const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, dir.length(), 10), mat);
    m.position.copy(a).addScaledVector(dir, 0.5);
    m.quaternion.setFromUnitVectors(V(0, 1, 0), dir.clone().normalize());
    m.castShadow = true; return m;
  }
  const line = (a, b) => new THREE.Line(new THREE.BufferGeometry().setFromPoints([a, b]), mats.rope);

  let tent = null;
  const hotspotDefs = [];

  function buildTent() {
    const m = D.models.find((x) => x.id === state.model);
    G = { W: m.w, Dp: m.d, H: m.h, Wr: m.w * m.rw, Dr: m.d * m.rd, P: 3.2 };
    const { W, Dp, H, Wr, Dr } = G;
    const g = new THREE.Group();

    // walls (side walls get more texture repeats)
    ['front', 'back', 'left', 'right'].forEach((f) => {
      g.add(gridMesh((u, v) => wallPoint(f, u, v), 18, 18, mats.wall, [W * 0.8, H * 0.8]));
    });
    // vertical seams on the side walls
    ['left', 'right'].forEach((f) => [0.33, 0.66].forEach((s) => {
      g.add(wallPanel(f, 0.02, 1, () => [s - 0.0025, s + 0.0025], mats.seam, 0.004));
    }));
    // floor
    const fl = new THREE.Mesh(new THREE.PlaneGeometry(W, Dp), mats.floor);
    fl.rotation.x = -Math.PI / 2; fl.position.y = 0.004; fl.receiveShadow = true; g.add(fl);

    // roof: tensioned panel with a slight crown, ends curling over the spring bars
    const ext = 0.1;
    g.add(gridMesh((u, v) => {
      const x = -Wr / 2 - ext + u * (Wr + 2 * ext);
      const z = -Dr / 2 + v * Dr;
      const crown = 0.035 * (1 - Math.pow((2 * u - 1), 2));
      const edge = Math.max(0, Math.abs(2 * u - 1) - 0.86) / 0.14; // 0..1 near the ends
      return V(x, H + 0.03 + crown - edge * edge * 0.06, z);
    }, 24, 8, mats.roof, [Wr, Dr]));
    // curled roof ends (rolled over the bar ends)
    [-1, 1].forEach((sgn) => {
      const curve = new THREE.LineCurve3(V(sgn * (Wr / 2 + ext - 0.03), H - 0.04, -Dr / 2 - 0.06), V(sgn * (Wr / 2 + ext - 0.03), H - 0.04, Dr / 2 + 0.06));
      const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 4, 0.085, 14, false), mats.curl);
      tube.castShadow = true; g.add(tube);
    });
    // roof skirt binding along front/back top edge
    ['front', 'back'].forEach((f) => g.add(wallPanel(f, 0, 0.035, () => [0, 1], mats.trim, 0.005)));

    // spring bars (front & back, slightly bowed by tension)
    [1, -1].forEach((sz) => {
      const z = sz * (Dr / 2 + 0.015);
      const curve = new THREE.QuadraticBezierCurve3(V(-Wr / 2 - 0.1, H + 0.03, z), V(0, H + 0.075, z), V(Wr / 2 + 0.1, H + 0.03, z));
      const bar = new THREE.Mesh(new THREE.TubeGeometry(curve, 30, 0.014, 8, false), mats.steel);
      bar.castShadow = true; g.add(bar);
    });
    // corner poles follow the wall corners
    const pr = 0.017;
    [['front', 0], ['front', 1], ['back', 0], ['back', 1]].forEach(([f, s]) => {
      const top = wallPoint(f, s, 0).add(V(0, 0.03, 0)), bot = wallPoint(f, s, 1);
      const out = V(top.x, 0, top.z).normalize().multiplyScalar(0.02);
      g.add(rod(top.add(out), bot.clone().add(out), pr, mats.steel));
    });
    if (m.centerPole) [1, -1].forEach((sz) => g.add(rod(V(0, 0, sz * (Dr / 2 - 0.02)), V(0, H + 0.05, sz * (Dr / 2 - 0.02)), pr, mats.steel)));

    // openings
    const open = state.door;
    const addDoor = (face, type) => {
      if (type === 'rollup') {
        const s0 = m.id === 'compact' ? 0.34 : 0.33, s1 = 1 - s0, t0 = 0.12;
        if (open) {
          g.add(wallPanel(face, t0, 1, () => [s0, s1], mats.mesh, 0.008));
          g.add(wallPanel(face, t0, 1, () => [0.497, 0.503], mats.trim, 0.011));
          // rolled-up door at the top
          const a = wallPoint(face, s0 - 0.01, t0 - 0.03).add(OUT[face].clone().multiplyScalar(0.05));
          const b = wallPoint(face, s1 + 0.01, t0 - 0.03).add(OUT[face].clone().multiplyScalar(0.05));
          g.add(rod(a, b, 0.045, mats.wall));
        } else {
          g.add(wallPanel(face, t0, 1, () => [0.497, 0.503], mats.mesh, 0.008));
        }
        g.add(wallPanel(face, t0 - 0.02, t0, () => [s0 - 0.01, s1 + 0.01], mats.trim, 0.009));
      } else {
        const c = type === 'a-left' ? 0.37 : 0.5;
        const t0 = 0.08;
        const hw = (t) => 0.012 + 0.105 * Math.pow((t - t0) / (1 - t0), 0.9);
        if (open) {
          g.add(wallPanel(face, t0, 1, (t) => [c - hw(t), c + hw(t)], mats.mesh, 0.008));
          // tied-back flaps
          [-1, 1].forEach((sg) => g.add(wallPanel(face, 0.32, 1, (t) => {
            const e = c + sg * hw(t);
            return sg < 0 ? [e - 0.055, e] : [e, e + 0.055];
          }, mats.wall, 0.016)));
        } else {
          g.add(wallPanel(face, t0, 1, () => [c - 0.003, c + 0.003], mats.mesh, 0.008));
        }
      }
    };
    const addWindow = (face, s0, s1, t0, t1) => {
      g.add(wallPanel(face, t0 - 0.025, t1 + 0.025, () => [s0 - 0.02, s1 + 0.02], mats.trim, 0.006));
      g.add(wallPanel(face, t0, t1, () => [s0, s1], mats.mesh, 0.009));
    };
    addDoor('front', m.door);
    if (m.id === 'traveler') addWindow('front', 0.55, 0.8, 0.12, 0.9);
    if (m.back === 'rollup') addDoor('back', 'rollup');
    if (m.back === 'window-center') addWindow('back', 0.36, 0.64, 0.14, 0.62);
    if (m.back === 'window-wide') { addWindow('back', 0.2, 0.8, 0.1, 0.56); g.add(wallPanel('back', 0.1, 0.56, () => [0.497, 0.503], mats.trim, 0.012)); }
    if (m.back === 'window-pair') { addWindow('back', 0.2, 0.47, 0.1, 0.86); addWindow('back', 0.53, 0.8, 0.1, 0.86); }

    // Springbar triangle label
    const lab = m.door === 'a-left' ? 0.13 : (m.door === 'a-center' ? 0.24 : 0.2);
    g.add(wallPanel('front', 0.62, 0.8, (t) => { const k = (t - 0.62) / 0.18; const hw = 0.05 * (1 - k) * (W > 2.5 ? 0.8 : 1); return [lab - hw, lab + hw]; }, mats.label, 0.012));

    // stakes + guy lines
    const stakes = [];
    ['front', 'back', 'left', 'right'].forEach((f) => [0, 0.5, 1].forEach((s) => stakes.push(wallPoint(f, s, 1))));
    stakes.forEach((p) => {
      const o = V(p.x, 0, p.z).normalize().multiplyScalar(0.08);
      g.add(rod(p.clone().add(o), p.clone().add(o).add(V(0, 0.07, 0)), 0.008, mats.steel));
    });
    [[1, 1], [-1, 1], [1, -1], [-1, -1]].forEach(([sx, sz]) => {
      const top = V(sx * (Wr / 2 + 0.1), H + 0.03, sz * (Dr / 2 + 0.015));
      g.add(line(top, V(sx * (W / 2 + 0.7), 0, sz * (Dp / 2 + 0.9))));
    });

    // awning off the front spring bar
    if (state.awning) {
      const L = Math.min(2.0, Dp * 0.7), AW = Wr + 0.25;
      g.add(gridMesh((u, v) => {
        const x = -AW / 2 + u * AW, z = Dr / 2 + 0.02 + v * L;
        const y = H + 0.03 + v * 0.12 - Math.sin(Math.PI * v) * 0.05 - Math.pow(2 * u - 1, 2) * 0.04 * v;
        return V(x, y, z);
      }, 12, 10, mats.wall, [AW, L]));
      [-1, 1].forEach((sx) => {
        const top = V(sx * (AW / 2 - 0.02), H + 0.11, Dr / 2 + L);
        g.add(rod(V(top.x, 0, top.z), top.clone().add(V(0, 0.08, 0)), pr, mats.steel));
        g.add(line(top, V(top.x + sx * 0.5, 0, top.z + 0.9)));
      });
    }

    /* hotspots */
    hotspotDefs.length = 0;
    hotspotDefs.push(
      { pos: V(Wr * 0.18, H + 0.08, Dr / 2 + 0.02), title: 'Spring Bar', text: 'เหล็กสปริงชุบแข็งด้านหน้าและหลัง ดึงหลังคาให้ตึงตลอดเวลา หัวใจที่ทำให้ Springbar กางง่ายและนิ่งกลางลม' },
      { pos: wallPoint('right', 0.5, 0.55).add(V(0.02, 0, 0)), title: 'Cotton Duck Canvas', text: 'ผ้าฝ้ายแคนวาสหนา ระบายอากาศได้ กันน้ำด้วยการเคลือบ อยู่ได้นานเป็นสิบปีถ้าดูแลดี' },
      { pos: wallPoint('front', m.door === 'a-left' ? 0.37 : 0.5, 0.45).add(V(0, 0, 0.03)), title: m.door === 'rollup' ? 'Roll-up Door' : '26" Door', text: m.door === 'rollup' ? 'ประตูม้วนเก็บด้านบน พร้อมมุ้งกันแมลงเต็มบาน' : 'ประตูกว้าง 26 นิ้วพร้อมมุ้ง พับผูกเก็บด้านข้างได้' },
      { pos: V(-Wr * 0.2, H + 0.06, 0), title: 'Standing Height', text: `สูงภายใน ${m.ftH} — ${m.h > 1.8 ? 'ยืนเปลี่ยนเสื้อผ้าได้สบาย' : 'นั่งสบาย นอนอุ่น ทรงเตี้ยต้านลมได้ดี'}` },
      { pos: wallPoint('left', 0.25, 0.92).add(V(-0.03, 0, 0)), title: 'Flared Walls', text: 'ผนังบานออกทุกด้านแบบ Springbar พื้นที่ใช้สอยเต็มถึงขอบ ลมปะทะแล้วไหลผ่าน' },
      { pos: wallPoint('back', 0.5, 0.35).add(V(0, 0, -0.03)), title: 'Views & Airflow', text: m.openings }
    );
    if (state.awning) hotspotDefs.push({ pos: V(0, H + 0.1, Dr / 2 + Math.min(2.0, Dp * 0.7) * 0.6), title: 'Awning', text: 'กันสาดผ้าแคนวาสต่อจากสปริงบาร์ด้านหน้า ได้ระเบียงร่มเงาเพิ่มอีกหนึ่งห้อง' });

    return g;
  }

  let rebuildT = 0;
  function rebuild(reframe) {
    if (tent) { scene.remove(tent); tent.traverse((o) => { if (o.geometry) o.geometry.dispose(); }); }
    tent = buildTent();
    recolor();
    scene.add(tent);
    rebuildT = performance.now();
    buildHotspots();
    if (reframe) frame();
  }
  function frame() {
    const size = Math.max(G.W, G.Dp + (state.awning ? 1.6 : 0));
    controls.target.set(0, G.H * 0.45, state.awning ? 0.5 : 0);
    const dir = camera.position.clone().sub(controls.target).normalize();
    const dist = size * 2.3 + 2.2;
    camera.position.copy(controls.target).addScaledVector(dir, dist);
    controls.minDistance = dist * 0.55; controls.maxDistance = dist * 1.8;
  }

  /* ---------- hotspots ---------- */
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
        hsEls.forEach((x) => x.classList.remove('is-open'));
        el.classList.toggle('is-open', open);
      });
      hsWrap.appendChild(el);
      return el;
    });
    hsWrap.hidden = !state.labels;
  }
  const tmp = new THREE.Vector3();
  function updateHotspots() {
    if (!state.labels) return;
    const w = viewer.clientWidth, h = viewer.clientHeight;
    const toCam = camera.position.clone().sub(controls.target).setY(0).normalize();
    hotspotDefs.forEach((d, i) => {
      const el = hsEls[i]; if (!el) return;
      tmp.copy(d.pos).project(camera);
      const x = (tmp.x * 0.5 + 0.5) * w, y = (-tmp.y * 0.5 + 0.5) * h;
      el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
      const toPt = d.pos.clone().sub(controls.target).setY(0);
      const facing = toPt.length() < 0.35 || toPt.normalize().dot(toCam) > -0.1;
      el.classList.toggle('is-hidden', !facing);
      el.querySelector('.hotspot__card').style.left = x > w - 240 ? '-232px' : '18px';
    });
  }

  /* ---------- controls ---------- */
  const angle = $('#angle'), angleOut = $('#angleOut'), autoBtn = $('#autoRotate'), hint = $('#dragHint');
  const setAuto = (on) => { state.auto = on; controls.autoRotate = on; autoBtn.setAttribute('aria-pressed', on); };
  autoBtn.addEventListener('click', () => setAuto(!state.auto));
  angle.addEventListener('input', () => {
    setAuto(false);
    const off = camera.position.clone().sub(controls.target);
    const sph = new THREE.Spherical().setFromVector3(off);
    sph.theta = (+angle.value) * Math.PI / 180;
    off.setFromSpherical(sph);
    camera.position.copy(controls.target).add(off);
  });
  controls.addEventListener('start', () => { hint.classList.add('is-gone'); setAuto(false); hsEls.forEach((x) => x.classList.remove('is-open')); });
  $('#tAwning').addEventListener('change', (e) => { state.awning = e.target.checked; rebuild(true); });
  $('#tDoor').addEventListener('change', (e) => { state.door = e.target.checked; rebuild(false); });
  $('#tLabels').addEventListener('change', (e) => { state.labels = e.target.checked; hsWrap.hidden = !state.labels; });

  function resize() {
    const w = viewer.clientWidth, h = viewer.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.fov = w < 600 ? 42 : 32;
    camera.updateProjectionMatrix();
  }
  new ResizeObserver(resize).observe(viewer);
  resize();

  let raf = null;
  function loop(now) {
    raf = requestAnimationFrame(loop);
    if (tent) {
      const t = Math.min((now - rebuildT) / 700, 1);
      tent.scale.setScalar(0.94 + 0.06 * (1 - Math.pow(1 - t, 3)));
    }
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

  rebuild(true);
  renderer.render(scene, camera);

  window.USCampStudio.set = function (model, color) {
    if (color && color !== state.color) { state.color = color; recolor(); }
    if (model && model !== state.model) { setModel(model); return; }
    updateUI();
  };
})();
