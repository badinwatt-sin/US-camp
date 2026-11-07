/* US Camp — 360° Tent Studio (Three.js r128, procedural Springbar-style tent) */
(function () {
  'use strict';
  const D = window.USCampData;
  const $ = (s) => document.querySelector(s);
  const canvas = $('#tentCanvas');
  const viewer = $('#viewer');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const state = { model: 'highline', color: 'tan', awning: true, door: true, labels: true, auto: !reduced };
  window.USCampStudio = { state }; // read by the configurator

  /* ---------- UI (built even if WebGL fails) ---------- */
  const chips = $('#modelChips');
  D.models.forEach((m) => {
    const b = document.createElement('button');
    b.className = 'chip'; b.textContent = m.name; b.dataset.id = m.id;
    b.addEventListener('click', () => { state.model = m.id; updateUI(); rebuild(); });
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
  function updateUI() {
    const m = D.models.find((x) => x.id === state.model);
    const c = D.colors.find((x) => x.id === state.color);
    chips.querySelectorAll('.chip').forEach((b) => b.classList.toggle('is-active', b.dataset.id === m.id));
    sw.querySelectorAll('.swatch').forEach((b) => b.classList.toggle('is-active', b.dataset.id === c.id));
    $('#modelName').textContent = m.name;
    $('#modelDesc').textContent = m.desc;
    $('#modelSpecs').innerHTML =
      `<div><dt>Sleeps</dt><dd>${m.sleeps}</dd></div>` +
      `<div><dt>Floor*</dt><dd>${m.w}×${m.d} m</dd></div>` +
      `<div><dt>Peak*</dt><dd>${m.h} m</dd></div>`;
    $('#colorName').innerHTML = `<b>${c.name}</b> · ${c.th}`;
  }
  updateUI();

  $('#studioToBuild').addEventListener('click', () => {
    document.dispatchEvent(new CustomEvent('uscamp:usetent', { detail: { model: state.model, color: state.color } }));
  });

  /* ---------- WebGL ---------- */
  if (!window.THREE || !canvas) return fail();
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  } catch (e) { return fail(); }

  function fail() {
    const fb = $('#viewerFallback');
    if (fb) fb.hidden = false;
    const hint = $('#dragHint'); if (hint) hint.style.display = 'none';
    window.USCampStudio.recolor = function () {};
  }

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(new THREE.Color(0xE5D6BA).convertSRGBToLinear(), 16, 34);
  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
  camera.position.set(7.6, 3.6, 9.4);

  const controls = new THREE.OrbitControls(camera, canvas);
  controls.target.set(0, 0.8, 0.4);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.enablePan = false;
  controls.minDistance = 5;
  controls.maxDistance = 16;
  controls.minPolarAngle = 0.35;
  controls.maxPolarAngle = Math.PI / 2 - 0.04;
  controls.autoRotate = state.auto;
  controls.autoRotateSpeed = 0.9;
  controls.enableZoom = true;

  // lights
  scene.add(new THREE.HemisphereLight(0xFFF4E0, 0x8A6A4A, 0.75));
  const sun = new THREE.DirectionalLight(0xFFE6C0, 1.05);
  sun.position.set(6, 10, 4);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -8, right: 8, top: 8, bottom: -8, near: 1, far: 30 });
  sun.shadow.radius = 4;
  scene.add(sun);
  const warm = new THREE.PointLight(0xFFB26B, 0.0, 6);
  scene.add(warm);

  // ground
  const ground = new THREE.Mesh(
    new THREE.CircleGeometry(14, 64),
    new THREE.MeshStandardMaterial({ color: new THREE.Color(0xC9AE85).convertSRGBToLinear(), roughness: 1 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);
  // subtle compass ring
  const ring = new THREE.Mesh(new THREE.RingGeometry(4.6, 4.63, 128), new THREE.MeshBasicMaterial({ color: 0x8E6142, transparent: true, opacity: 0.35 }));
  ring.rotation.x = -Math.PI / 2; ring.position.y = 0.005; scene.add(ring);

  /* canvas weave texture */
  function weaveTexture() {
    const c = document.createElement('canvas'); c.width = c.height = 256;
    const g = c.getContext('2d');
    g.fillStyle = '#ffffff'; g.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 256; i += 2) {
      g.fillStyle = `rgba(0,0,0,${0.025 + Math.random() * 0.03})`; g.fillRect(0, i, 256, 1);
      g.fillStyle = `rgba(0,0,0,${0.02 + Math.random() * 0.025})`; g.fillRect(i, 0, 1, 256);
    }
    for (let k = 0; k < 1400; k++) { g.fillStyle = `rgba(80,60,30,${Math.random() * 0.05})`; g.fillRect(Math.random() * 256, Math.random() * 256, 2, 1); }
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(3, 3);
    t.encoding = THREE.sRGBEncoding;
    return t;
  }
  const weave = weaveTexture();

  const mats = {
    wall: new THREE.MeshStandardMaterial({ map: weave, roughness: 0.95, side: THREE.DoubleSide }),
    roof: new THREE.MeshStandardMaterial({ map: weave, roughness: 0.9, side: THREE.DoubleSide }),
    mesh: new THREE.MeshStandardMaterial({ color: 0x2A241D, roughness: 1, side: THREE.DoubleSide }),
    floor: new THREE.MeshStandardMaterial({ color: 0x3C3A33, roughness: 0.8 }),
    steel: new THREE.MeshStandardMaterial({ color: 0xC9C5BC, metalness: 0.6, roughness: 0.35 }),
    rope: new THREE.LineBasicMaterial({ color: 0xF1EBDD, transparent: true, opacity: 0.7 }),
    glow: new THREE.MeshBasicMaterial({ color: 0xFFB862, side: THREE.DoubleSide, transparent: true, opacity: 0.85 })
  };

  function recolor() {
    const c = D.colors.find((x) => x.id === state.color);
    mats.wall.color.set(c.wall).convertSRGBToLinear();
    mats.roof.color.set(c.roof).convertSRGBToLinear();
  }

  /* geometry helpers */
  function polyMesh(points, mat) {
    // points: array of THREE.Vector3 (convex, ordered) -> triangle fan
    const pos = [];
    const uv = [];
    for (let i = 1; i < points.length - 1; i++) {
      [points[0], points[i], points[i + 1]].forEach((p) => { pos.push(p.x, p.y, p.z); uv.push(p.x + p.z, p.y); });
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    g.computeVertexNormals();
    const m = new THREE.Mesh(g, mat);
    m.castShadow = true; m.receiveShadow = true;
    return m;
  }
  function rod(a, b, r, mat) {
    const dir = new THREE.Vector3().subVectors(b, a);
    const len = dir.length();
    const g = new THREE.CylinderGeometry(r, r, len, 10);
    const m = new THREE.Mesh(g, mat);
    m.position.copy(a).add(dir.multiplyScalar(0.5));
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3().subVectors(b, a).normalize());
    m.castShadow = true;
    return m;
  }
  function line(a, b) {
    const g = new THREE.BufferGeometry().setFromPoints([a, b]);
    return new THREE.Line(g, mats.rope);
  }
  const V = (x, y, z) => new THREE.Vector3(x, y, z);

  let tent = null;
  const hotspotDefs = [];

  function buildTent() {
    const m = D.models.find((x) => x.id === state.model);
    const W = m.w, Dp = m.d, RH = m.h, EH = 1.3, IN = 0.28;
    const zf = Dp / 2, zb = -Dp / 2;
    const g = new THREE.Group();

    const A = (z) => V(-W / 2, 0, z), B = (z) => V(W / 2, 0, z);
    const C = (z) => V(W / 2 - IN, EH, z), E = (z) => V(-W / 2 + IN, EH, z), R = (z) => V(0, RH, z);

    // gables
    g.add(polyMesh([A(zf), B(zf), C(zf), R(zf), E(zf)], mats.wall));
    g.add(polyMesh([A(zb), E(zb), R(zb), C(zb), B(zb)], mats.wall));
    // side walls
    g.add(polyMesh([B(zf), B(zb), C(zb), C(zf)], mats.wall));
    g.add(polyMesh([A(zb), A(zf), E(zf), E(zb)], mats.wall));
    // roof
    g.add(polyMesh([C(zf), C(zb), R(zb), R(zf)], mats.roof));
    g.add(polyMesh([E(zb), E(zf), R(zf), R(zb)], mats.roof));
    // floor
    const fl = new THREE.Mesh(new THREE.PlaneGeometry(W + 0.04, Dp + 0.04), mats.floor);
    fl.rotation.x = -Math.PI / 2; fl.position.y = 0.01; fl.receiveShadow = true; g.add(fl);

    // door
    const dz = zf + 0.006, dw = 0.5, dt = 0.28, dh = RH - 0.32;
    if (state.door) {
      g.add(polyMesh([V(-dw, 0.02, dz), V(dw, 0.02, dz), V(dt, dh, dz), V(-dt, dh, dz)], mats.mesh));
      const glowPanel = polyMesh([V(-dw + 0.08, 0.04, dz - 0.3), V(dw - 0.08, 0.04, dz - 0.3), V(dt - 0.06, dh - 0.2, dz - 0.3), V(-dt + 0.06, dh - 0.2, dz - 0.3)], mats.glow);
      glowPanel.castShadow = false; glowPanel.material = mats.glow; g.add(glowPanel);
      // rolled flaps
      [-1, 1].forEach((s) => {
        const roll = rod(V(s * (dw + 0.08), 0.15, dz + 0.03), V(s * (dt + 0.1), dh - 0.05, dz + 0.03), 0.06, mats.wall);
        g.add(roll);
      });
    } else {
      const zip = rod(V(0, 0.02, dz + 0.004), V(0, dh, dz + 0.004), 0.008, mats.mesh);
      g.add(zip);
    }
    // back window
    const wz = zb - 0.006;
    g.add(polyMesh([V(-0.5, EH + 0.1, wz), V(0, RH - 0.25, wz), V(0.5, EH + 0.1, wz)], mats.mesh));
    // side windows
    [-1, 1].forEach((s) => {
      const x0 = s * (W / 2 - 0.05), x1 = s * (W / 2 - IN + 0.07);
      const off = s * 0.012;
      g.add(polyMesh([V(x0 + off, 0.45, -0.45), V(x0 + off, 0.45, 0.45), V(x1 + off, EH - 0.12, 0.45), V(x1 + off, EH - 0.12, -0.45)], mats.mesh));
    });

    // poles
    const pr = 0.022;
    g.add(rod(V(0, 0, zf + 0.02), V(0, RH + 0.06, zf + 0.02), pr, mats.steel));
    g.add(rod(V(0, 0, zb - 0.02), V(0, RH + 0.06, zb - 0.02), pr, mats.steel));
    g.add(rod(V(0, RH + 0.04, zb - 0.02), V(0, RH + 0.04, zf + 0.02), pr * 0.9, mats.steel));
    [[1, zf], [-1, zf], [1, zb], [-1, zb]].forEach(([s, z]) => {
      const zz = z + Math.sign(z) * 0.04;
      g.add(rod(V(s * (W / 2 + 0.02), 0, zz), V(s * (W / 2 - IN), EH + 0.02, zz), pr, mats.steel));
    });
    // spring bars (bowed along eaves)
    [1, -1].forEach((s) => {
      const x = s * (W / 2 - IN + 0.01);
      const curve = new THREE.QuadraticBezierCurve3(V(x, EH + 0.05, zb - 0.12), V(x + s * 0.06, EH + 0.18, 0), V(x, EH + 0.05, zf + 0.12));
      const bar = new THREE.Mesh(new THREE.TubeGeometry(curve, 30, 0.026, 8, false), mats.steel);
      bar.castShadow = true; g.add(bar);
    });
    // guy lines + stakes
    [[1, zf], [-1, zf], [1, zb], [-1, zb]].forEach(([s, z]) => {
      const top = V(s * (W / 2 - IN), EH, z);
      const stake = V(s * (W / 2 + 0.9), 0, z + Math.sign(z) * 0.9);
      g.add(line(top, stake));
      g.add(rod(stake, V(stake.x, 0.12, stake.z), 0.015, mats.steel));
    });
    [zf, zb].forEach((z) => {
      const top = V(0, RH + 0.05, z), stake = V(0, 0, z + Math.sign(z) * 1.4);
      g.add(line(top, stake));
    });

    // awning
    if (state.awning) {
      const L = 1.7;
      const fz = zf + L;
      g.add(polyMesh([R(zf + 0.02), V(0, RH - 0.18, fz), V(W / 2 - IN + 0.15, EH - 0.05, fz), C(zf + 0.02)], mats.roof));
      g.add(polyMesh([E(zf + 0.02), V(-W / 2 + IN - 0.15, EH - 0.05, fz), V(0, RH - 0.18, fz), R(zf + 0.02)], mats.roof));
      [1, -1].forEach((s) => {
        const top = V(s * (W / 2 - IN + 0.15), EH - 0.05, fz);
        g.add(rod(V(top.x, 0, top.z), top, pr, mats.steel));
        g.add(line(top, V(top.x + s * 0.6, 0, top.z + 0.9)));
      });
    }

    // hotspots (local positions)
    hotspotDefs.length = 0;
    hotspotDefs.push(
      { key: 'bar', pos: V(W / 2 - IN + 0.05, EH + 0.16, -Dp * 0.15), title: 'Spring Bar', text: 'เหล็กสปริงสองเส้นดึงผ้าให้ตึงจากมุมถึงมุม คือที่มาของชื่อ Springbar' },
      { key: 'canvas', pos: V(W / 2 - 0.12, 0.7, Dp * 0.25), title: 'Cotton Duck Canvas', text: 'ผ้าฝ้ายหนา หายใจได้ เย็นกลางวัน อุ่นกลางคืน ไอน้ำเกาะน้อย' },
      { key: 'door', pos: V(0, 1.1, zf + 0.05), title: 'Big Front Door', text: 'ประตูกว้างพร้อมมุ้ง พับเก็บผูกด้านข้างได้ เปิดรับลมเต็มที่' },
      { key: 'roof', pos: V(-W / 4, (EH + RH) / 2 + 0.05, -Dp * 0.2), title: 'Light Roof Panel', text: 'หลังคาสีอ่อนสะท้อนแดด ช่วยลดความร้อนภายในเต้นท์' },
      { key: 'window', pos: V(0, EH + 0.3, zb - 0.05), title: 'Vent Windows', text: 'หน้าต่างมุ้งรอบตัว สร้างลมไหลผ่านแบบ cross-ventilation' }
    );
    if (state.awning) hotspotDefs.push({ key: 'awning', pos: V(0, RH - 0.15, zf + 1.4), title: 'Awning', text: 'กันสาดผ้าแคนวาส ต่อพื้นที่นั่งเล่นหน้าเต้นท์อีกหนึ่งห้อง' });

    warm.position.set(0, 0.9, 0);
    warm.intensity = state.door ? 0.6 : 0.2;
    return g;
  }

  let rebuildT = 0;
  function rebuild() {
    if (tent) {
      scene.remove(tent);
      tent.traverse((o) => { if (o.geometry) o.geometry.dispose(); });
    }
    tent = buildTent();
    recolor();
    scene.add(tent);
    tent.scale.setScalar(0.92);
    rebuildT = performance.now();
    buildHotspots();
  }

  /* ---------- hotspots (DOM) ---------- */
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
    hsWrap.style.display = state.labels ? '' : 'none';
  }
  const tmp = new THREE.Vector3(), camDir = new THREE.Vector3();
  function updateHotspots() {
    if (!state.labels) return;
    const w = viewer.clientWidth, h = viewer.clientHeight;
    camera.getWorldDirection(camDir);
    hotspotDefs.forEach((d, i) => {
      const el = hsEls[i]; if (!el) return;
      tmp.copy(d.pos).project(camera);
      const x = (tmp.x * 0.5 + 0.5) * w, y = (-tmp.y * 0.5 + 0.5) * h;
      el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
      // hide if facing away: compare vector from target to point with camera direction
      const toPt = d.pos.clone().sub(controls.target).setY(0);
      const toCam = camera.position.clone().sub(controls.target).setY(0);
      const facing = toPt.length() < 0.2 || toPt.normalize().dot(toCam.normalize()) > -0.15;
      el.classList.toggle('is-hidden', !facing);
      // flip card when near right edge
      const card = el.querySelector('.hotspot__card');
      card.style.left = x > w - 240 ? '-230px' : '18px';
    });
  }

  /* ---------- controls UI ---------- */
  const angle = $('#angle'), angleOut = $('#angleOut'), autoBtn = $('#autoRotate'), hint = $('#dragHint');
  const setAuto = (on) => { state.auto = on; controls.autoRotate = on; autoBtn.setAttribute('aria-pressed', on); };
  autoBtn.addEventListener('click', () => setAuto(!state.auto));
  angle.addEventListener('input', () => {
    setAuto(false);
    const az = (+angle.value) * Math.PI / 180;
    const off = camera.position.clone().sub(controls.target);
    const sph = new THREE.Spherical().setFromVector3(off);
    sph.theta = az;
    off.setFromSpherical(sph);
    camera.position.copy(controls.target).add(off);
  });
  controls.addEventListener('start', () => { hint.classList.add('is-gone'); setAuto(false); hsEls.forEach((x) => x.classList.remove('is-open')); });
  $('#tAwning').addEventListener('change', (e) => { state.awning = e.target.checked; rebuild(); });
  $('#tDoor').addEventListener('change', (e) => { state.door = e.target.checked; rebuild(); });
  $('#tLabels').addEventListener('change', (e) => { state.labels = e.target.checked; hsWrap.style.display = state.labels ? '' : 'none'; });

  function resize() {
    const w = viewer.clientWidth, h = viewer.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.fov = w < 600 ? 44 : 34;
    camera.updateProjectionMatrix();
  }
  new ResizeObserver(resize).observe(viewer);
  resize();

  // render only when visible
  let visible = false, raf = null;
  function loop(now) {
    raf = requestAnimationFrame(loop);
    if (tent) {
      const t = Math.min((now - rebuildT) / 600, 1);
      tent.scale.setScalar(0.92 + 0.08 * (1 - Math.pow(1 - t, 3)));
    }
    controls.update();
    const off = camera.position.clone().sub(controls.target);
    let deg = Math.round((Math.atan2(off.x, off.z) * 180 / Math.PI + 360) % 360);
    if (document.activeElement !== angle) angle.value = deg;
    angleOut.textContent = String(deg).padStart(3, '0') + '°';
    renderer.render(scene, camera);
    updateHotspots();
  }
  new IntersectionObserver((entries) => {
    visible = entries[0].isIntersecting;
    if (visible && !raf) raf = requestAnimationFrame(loop);
    if (!visible && raf) { cancelAnimationFrame(raf); raf = null; }
  }, { threshold: 0.05 }).observe(viewer);

  rebuild();
  renderer.render(scene, camera);

  // keep studio in sync when configurator changes model/colour
  window.USCampStudio.set = function (model, color) {
    let changed = false;
    if (model && model !== state.model) { state.model = model; changed = true; }
    if (color && color !== state.color) { state.color = color; recolor(); }
    updateUI();
    if (changed) rebuild();
  };
})();
