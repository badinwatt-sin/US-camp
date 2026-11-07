/* US Camp — Build Your Camp configurator (live SVG scene + Camp Card) */
(function () {
  'use strict';
  const D = window.USCampData;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const svg = $('#campScene');
  if (!svg) return;
  const toast = (m) => window.USCampToast && window.USCampToast(m);

  const DEFAULT = { terrain: 'desert', model: 'highline', color: 'tan', mood: 'golden', items: ['awning', 'tarp', 'chairs', 'fire'] };
  let state = JSON.parse(JSON.stringify(DEFAULT));

  const find = (list, id) => list.find((x) => x.id === id);
  const allItems = [...D.items.shelter, ...D.items.living];

  /* =========================================================
     SCENE
     ========================================================= */
  function pine(x, y, h, color) {
    const w = h * 0.42;
    let d = '';
    for (let i = 0; i < 4; i++) {
      const ty = y - h + i * h * 0.2;
      const bw = w * (0.45 + i * 0.2);
      d += `M${x} ${ty} L${x + bw} ${ty + h * 0.34} L${x - bw} ${ty + h * 0.34} Z `;
    }
    return `<path d="${d}" fill="${color}"/><rect x="${x - h * 0.03}" y="${y - h * 0.1}" width="${h * 0.06}" height="${h * 0.12}" fill="#3A2A1E"/>`;
  }
  function oak(x, y, s, c1, c2) {
    return `<rect x="${x - 4 * s}" y="${y - 40 * s}" width="${8 * s}" height="${40 * s}" fill="#4A3826"/>
      <circle cx="${x}" cy="${y - 62 * s}" r="${34 * s}" fill="${c1}"/><circle cx="${x - 26 * s}" cy="${y - 46 * s}" r="${24 * s}" fill="${c2}"/><circle cx="${x + 26 * s}" cy="${y - 48 * s}" r="${26 * s}" fill="${c2}"/>`;
  }
  const rand = (() => { let s = 7; return () => (s = (s * 9301 + 49297) % 233280) / 233280; })();

  function terrainDesert() {
    return `<g class="layer terrain" data-terrain="desert">
      <path d="M0 450 L90 420 L200 440 L330 400 L470 430 L620 395 L780 432 L900 405 L1060 430 L1200 410 V700 H0Z" fill="#CFA58A" opacity=".7"/>
      <path d="M0 470 L40 470 L70 340 L230 340 L250 410 L300 410 L318 380 L420 380 L445 470 Z" fill="#B4532A"/>
      <path d="M70 340 H230 L234 358 H74Z" fill="#8F3E1F"/>
      <path d="M820 470 L850 390 L890 386 L905 345 L1060 345 L1076 388 L1140 392 L1180 470Z" fill="#A9482A"/>
      <path d="M905 345 H1060 L1063 360 H908Z" fill="#8A3A1C"/>
      <path d="M0 470 Q300 450 600 465 T1200 460 V700 H0Z" fill="#CF8E5A"/>
      <path d="M0 600 Q400 575 800 600 T1200 590 V700 H0Z" fill="#B0633A"/>
      <g stroke="#3B2A1E" stroke-linecap="round" fill="none">
        <path d="M1110 610 C1100 560 1120 520 1090 480 M1100 550 C1130 520 1150 515 1165 485 M1095 520 C1070 505 1055 480 1050 450 M1092 492 C1085 470 1090 450 1078 430" stroke-width="6"/>
      </g>
      <g fill="#8C9479"><ellipse cx="70" cy="612" rx="44" ry="17"/><ellipse cx="1030" cy="625" rx="40" ry="15"/><ellipse cx="700" cy="480" rx="26" ry="9"/><ellipse cx="160" cy="490" rx="22" ry="8"/></g>
    </g>`;
  }
  function terrainForest() {
    let back = '', mid = '', fore = '';
    for (let x = -20; x < 1240; x += 34) back += pine(x + rand() * 10, 450, 90 + rand() * 50, '#5B6B52');
    for (let x = -30; x < 1240; x += 58) mid += pine(x + rand() * 20, 470, 130 + rand() * 60, '#3F5238');
    fore = pine(60, 690, 360, '#2B3826') + pine(1150, 690, 380, '#2B3826') + pine(1060, 640, 220, '#334430');
    return `<g class="layer terrain" data-terrain="forest">
      <path d="M0 400 Q200 330 420 380 T820 350 T1200 380 V700 H0Z" fill="#8D9C8C" opacity=".7"/>
      ${back}${mid}
      <path d="M0 470 Q300 455 600 468 T1200 462 V700 H0Z" fill="#7D7350"/>
      <path d="M0 610 Q400 590 800 612 T1200 600 V700 H0Z" fill="#5F5A3C"/>
      <g fill="#6F7D4C"><ellipse cx="200" cy="640" rx="50" ry="12"/><ellipse cx="980" cy="660" rx="60" ry="14"/></g>
      ${fore}
    </g>`;
  }
  function terrainLake() {
    let pines = '';
    for (let x = 0; x < 1200; x += 26) if (x < 300 || x > 860) pines += pine(x + rand() * 8, 455, 50 + rand() * 30, '#3E5040');
    return `<g class="layer terrain" data-terrain="lake">
      <path d="M0 440 L140 300 L230 370 L380 210 L520 360 L640 280 L780 400 L900 250 L1050 380 L1200 300 V460 H0Z" fill="#7E93A0"/>
      <path d="M380 210 L420 255 L400 250 L380 268 L362 250 L345 252Z M900 250 L940 292 L918 288 L900 304 L884 288 L862 290Z M140 300 L168 328 L140 336 L118 322Z" fill="#EEF1EE"/>
      <path d="M0 400 L200 360 L360 410 L560 370 L760 420 L1000 380 L1200 420 V460 H0Z" fill="#617784"/>
      ${pines}
      <rect x="0" y="455" width="1200" height="60" fill="#6E95A8"/>
      <g stroke="#DDEBEE" stroke-width="2" opacity=".6"><path d="M200 470 h80 M420 482 h120 M760 476 h90 M980 492 h60 M120 500 h50"/></g>
      <path d="M0 505 Q300 495 600 506 T1200 500 V700 H0Z" fill="#8D9466"/>
      <path d="M0 620 Q400 600 800 622 T1200 612 V700 H0Z" fill="#6F7A4E"/>
      ${pine(70, 690, 300, '#2E3B2C')}${pine(1140, 690, 330, '#2E3B2C')}
    </g>`;
  }
  function terrainMeadow() {
    return `<g class="layer terrain" data-terrain="meadow">
      <path d="M0 430 Q200 360 420 410 T860 380 T1200 400 V700 H0Z" fill="#A7B07A"/>
      <path d="M0 460 Q260 420 560 450 T1200 440 V700 H0Z" fill="#8E9A62"/>
      ${oak(160, 450, 1.1, '#6F7D4C', '#5E6B40')}${oak(980, 445, 1.3, '#6F7D4C', '#5E6B40')}${oak(1100, 455, .8, '#7C8A55', '#66744A')}
      <path d="M1200 470 C1000 480 900 500 760 498 C620 496 520 510 380 505 C250 500 120 520 0 515 V540 C140 545 260 530 390 535 C540 540 640 528 780 530 C920 532 1020 512 1200 500Z" fill="#7FA6B8"/>
      <path d="M200 522 h60 M560 520 h80 M900 512 h50" stroke="#DDEBEE" stroke-width="2" opacity=".7"/>
      <path d="M0 540 Q300 530 600 545 T1200 535 V700 H0Z" fill="#9AA36C"/>
      <path d="M0 630 Q400 610 800 632 T1200 622 V700 H0Z" fill="#7E8A54"/>
      <g stroke="#6E7A45" stroke-width="2" stroke-linecap="round">
        ${Array.from({ length: 40 }, (_, i) => { const x = i * 31 + 8; return `<path d="M${x} 690 l-4 -14 M${x + 4} 690 l3 -12"/>`; }).join('')}
      </g>
      <g fill="#E9C46A">${Array.from({ length: 18 }, (_, i) => `<circle cx="${(i * 67 + 30) % 1200}" cy="${600 + (i * 37) % 80}" r="3"/>`).join('')}</g>
    </g>`;
  }

  function chair(x, y, color) {
    return `<g transform="translate(${x} ${y})">
      <path d="M-24 0 L-16 -40 M24 0 L16 -40 M-20 -18 H22 M-24 0 L22 -40 M24 0 L-22 -40" stroke="#5A4128" stroke-width="3.5" stroke-linecap="round" opacity=".9"/>
      <path d="M-18 -42 Q0 -32 18 -42 L16 -70 Q0 -64 -16 -70Z" fill="${color}"/>
      <path d="M-20 -24 Q0 -16 20 -24 L18 -34 Q0 -28 -18 -34Z" fill="${color}"/>
    </g>`;
  }

  function buildScene() {
    const skies = {
      dawn: ['#7E93A8', '#E8C5A9', '#F3D5B5'],
      noon: ['#5F95BA', '#A9CBDD', '#E3EDE9'],
      golden: ['#C46B3C', '#EDA25C', '#F6D8A3'],
      night: ['#0A1018', '#16233A', '#2E3A55']
    };
    const defs = `<defs>
      ${Object.entries(skies).map(([k, c]) => `<linearGradient id="sky-${k}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c[0]}"/><stop offset=".6" stop-color="${c[1]}"/><stop offset="1" stop-color="${c[2]}"/></linearGradient>`).join('')}
      <filter id="blurGlow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="14"/></filter>
      <radialGradient id="fireGrad"><stop offset="0" stop-color="#FFD27A"/><stop offset="1" stop-color="#FF8A3D" stop-opacity="0"/></radialGradient>
    </defs>`;
    const skyRects = Object.keys(skies).map((k) => `<rect class="layer sky" data-mood="${k}" width="1200" height="700" fill="url(#sky-${k})"/>`).join('');
    let stars = '';
    for (let i = 0; i < 90; i++) stars += `<circle cx="${(rand() * 1200).toFixed(0)}" cy="${(rand() * 380).toFixed(0)}" r="${(rand() * 1.6 + .4).toFixed(1)}" fill="#F6F0E3" class="${i % 3 ? '' : 'twinkle'}" style="animation-delay:${(rand() * 3).toFixed(1)}s"/>`;

    svg.innerHTML = `${defs}
      ${skyRects}
      <g class="layer stars" data-mood="night">${stars}<path d="M180 120 Q 600 40 1100 150" stroke="#F6F0E3" stroke-width="40" opacity=".05" fill="none"/></g>
      <g class="sun" id="sceneSun"><circle r="58" fill="#FFF1C9" opacity=".95"/><circle r="90" fill="#FFF1C9" opacity=".18"/></g>
      <g class="layer moon" data-mood="night" transform="translate(960 120)"><circle r="34" fill="#F3EEDC"/><circle cx="12" cy="-8" r="30" fill="#16233A" opacity=".9"/></g>
      ${terrainDesert()}${terrainForest()}${terrainLake()}${terrainMeadow()}
      <g class="tent-g" id="sceneTent">${USCampTent.tentSVG({ id: 'cfg', door: 'open', extras: true })}</g>
      <g id="sceneProps">
        <g class="prop pop" data-item="table"><g transform="translate(300 668)">
          <rect x="-46" y="-34" width="92" height="9" rx="2" fill="#8A5A36"/><path d="M-38 -26 L-42 0 M38 -26 L42 0 M-36 -12 H36" stroke="#5A3B22" stroke-width="4"/>
          <rect x="-28" y="-46" width="12" height="12" rx="2" fill="#E2D6BE"/><path d="M10 -36 h20 v-12 h-20z" fill="#6A7F8A"/></g></g>
        <g class="prop pop" data-item="chairs">${chair(205, 672, '#8E3B2A')}${chair(395, 680, '#2F4A5C')}</g>
        <g class="prop pop" data-item="cooler"><g transform="translate(790 660)">
          <rect x="-36" y="-40" width="72" height="42" rx="5" fill="#F1EBDD"/><rect x="-36" y="-44" width="72" height="11" rx="3" fill="#DDD3BF"/><rect x="-10" y="-24" width="20" height="5" fill="#3B3631"/><rect x="-36" y="-6" width="72" height="8" fill="#C8BBA2"/></g></g>
        <g class="prop pop" data-item="fire"><g transform="translate(950 668)">
          <ellipse cx="0" cy="4" rx="46" ry="12" fill="#5A4B3A"/>
          ${Array.from({ length: 9 }, (_, i) => { const a = (i / 9) * Math.PI * 2; return `<ellipse cx="${(Math.cos(a) * 40).toFixed(1)}" cy="${(Math.sin(a) * 10 + 2).toFixed(1)}" rx="9" ry="6" fill="#8A8178"/>`; }).join('')}
          <path d="M-22 0 L22 -10 M-22 -10 L22 0" stroke="#4A3020" stroke-width="7" stroke-linecap="round"/>
          <path class="flame" d="M0 -4 C-16 -20 -6 -36 0 -56 C6 -36 18 -22 0 -4Z" fill="#F59A3B"/>
          <path class="flame f2" d="M0 -4 C-8 -12 -3 -24 0 -34 C3 -24 9 -14 0 -4Z" fill="#FFD27A"/>
          <g class="smoke"><circle cx="0" cy="-80" r="10"/><circle cx="8" cy="-110" r="14"/><circle cx="-4" cy="-146" r="18"/></g></g></g>
      </g>
      <rect class="tint" id="sceneTint" width="1200" height="700" fill="#000" opacity="0"/>
      <g class="tent-g" id="sceneTentGlow">${USCampTent.tentGlowSVG()}</g>
      <g><circle class="glow glow-fire" cx="950" cy="640" r="110"/></g>`;
  }

  /* =========================================================
     APPLY STATE
     ========================================================= */
  const sunPos = { dawn: [250, 420], noon: [860, 120], golden: [1010, 400], night: [1010, 800] };
  const tint = { dawn: ['#F2B8A0', .18], noon: ['#FFFFFF', 0], golden: ['#F0A050', .2], night: ['#1B2A4A', .66] };
  const moodGlow = { dawn: .25, noon: 0, golden: .45, night: 1 };

  function apply(opts = {}) {
    const m = find(D.models, state.model), c = find(D.colors, state.color);
    const t = find(D.terrains, state.terrain), mo = find(D.moods, state.mood);
    const has = (id) => state.items.includes(id);

    $$('.terrain', svg).forEach((g) => g.classList.toggle('on', g.dataset.terrain === state.terrain));
    $$('.sky, .stars, .moon', svg).forEach((g) => g.classList.toggle('on', g.dataset.mood === state.mood));
    const sp = sunPos[state.mood];
    $('#sceneSun', svg).style.transform = `translate(${sp[0]}px, ${sp[1]}px)`;
    $('#sceneSun', svg).style.opacity = state.mood === 'night' ? 0 : 1;
    const ti = $('#sceneTint', svg);
    ti.setAttribute('fill', tint[state.mood][0]);
    ti.setAttribute('opacity', tint[state.mood][1]);
    svg.classList.toggle('is-night', state.mood === 'night');
    svg.classList.toggle('is-golden', state.mood === 'golden');

    const s = 1.25 * m.scale;
    const tr = `translate(540px, 590px) scale(${s})`;
    const tg = $('#sceneTent', svg), gg = $('#sceneTentGlow', svg);
    tg.style.transform = tr; gg.style.transform = tr;
    tg.style.setProperty('--wall', c.wall); tg.style.setProperty('--wall-shade', c.shade);
    tg.style.setProperty('--roof', c.roof); tg.style.setProperty('--roof-shade', c.roofShade);

    ['tarp', 'stove', 'cot', 'awning', 'rug', 'lantern', 'lights'].forEach((id) => {
      const el = $(`.prop-${id}`, tg); if (el) el.classList.toggle('on', has(id));
    });
    $$('#sceneProps .prop', svg).forEach((p) => p.classList.toggle('on', has(p.dataset.item)));

    const gv = moodGlow[state.mood];
    const setGlow = (sel, on, k = 1) => { const el = $(sel, svg); if (el) el.style.opacity = on ? (gv * k).toFixed(2) : 0; };
    setGlow('.glow-door', true, has('stove') ? 0.5 : 0.35);
    setGlow('.glow-lantern', has('lantern') && has('awning'), 0.9);
    setGlow('.glow-lights', has('lights') && has('awning'), 0.8);
    setGlow('.glow-fire', has('fire'), 1);

    // title
    const title = $('.scene-title');
    const name = `The ${mo.word} ${t.word} Camp`;
    if ($('#campName').textContent !== name) {
      $('#campName').textContent = name;
      title.classList.remove('is-swap'); void title.offsetWidth; title.classList.add('is-swap');
    }
    $('#campTagline').textContent = `${m.name} in ${c.name} · ${mo.time}`;
    title.classList.toggle('is-night', state.mood === 'night');
    title.classList.toggle('is-golden', state.mood === 'golden');

    renderVibes(m, t, mo);
    renderCard(m, c, t, mo);
    syncControls();
    if (!opts.silent && window.USCampStudio && window.USCampStudio.set) window.USCampStudio.set(state.model, state.color);
  }

  function renderVibes(m, t, mo) {
    const has = (id) => state.items.includes(id);
    const v = [];
    if (has('stove') || (mo.id === 'night' && has('rug'))) v.push('Cozy Cabin');
    if (has('rug') && has('lantern')) v.push('Vintage Americana');
    if (t.id === 'desert') v.push('Desert Nomad');
    if (t.id === 'forest') v.push('Pine & Canvas');
    if (t.id === 'lake') v.push('Lakeside Retreat');
    if (t.id === 'meadow') v.push('Easy Sunday');
    if (has('fire')) v.push('Fireside Stories');
    if (m.id === 'traveler') v.push('Light & Free');
    if (m.id === 'vista' || m.id === 'outfitter') v.push('Basecamp Living');
    if (state.items.length >= 7) v.push('Glamp-ready');
    $('#vibes').innerHTML = v.slice(0, 4).map((x) => `<span class="vibe">★ ${x}</span>`).join('');
  }

  function renderCard(m, c, t, mo) {
    const rows = [`<li><span><b>Springbar® ${m.name}</b> · ${c.name}</span><span>Tent · sleeps ${m.sleeps}</span></li>`];
    allItems.filter((i) => state.items.includes(i.id)).forEach((i) => {
      rows.push(`<li><span>${i.name}</span><span>${D.items.shelter.includes(i) ? 'Shelter' : 'Living'}</span></li>`);
    });
    rows.push(`<li><span>Setting</span><span>${t.name} · ${mo.name}</span></li>`);
    $('#gearList').innerHTML = rows.join('');
    $('#itemCount').textContent = `${state.items.length + 1} items`;
  }

  /* =========================================================
     CONTROLS
     ========================================================= */
  const groups = {
    terrain: $('[data-group="terrain"]'),
    model: $('[data-group="model"]'),
    color: $('.build [data-group="color"]'),
    shelter: $('[data-group="shelter"]'),
    living: $('[data-group="living"]'),
    mood: $('[data-group="mood"]')
  };
  const terrainSwatch = {
    desert: ['#E9C9A0', '#B4532A', '#CF8E5A'], forest: ['#B9C4B5', '#3F5238', '#7D7350'],
    lake: ['#B9CAD3', '#7E93A0', '#6E95A8'], meadow: ['#D7E0C0', '#8E9A62', '#7FA6B8']
  };
  D.terrains.forEach((t) => {
    const s = terrainSwatch[t.id];
    groups.terrain.insertAdjacentHTML('beforeend', `<button class="card" data-id="${t.id}">
      <svg viewBox="0 0 120 54" preserveAspectRatio="none"><rect width="120" height="54" fill="${s[0]}"/><path d="M0 34 L20 22 L40 30 L64 14 L86 28 L120 18 V54 H0Z" fill="${s[1]}"/><path d="M0 42 Q60 34 120 42 V54 H0Z" fill="${s[2]}"/></svg>
      <b>${t.name}</b><small>${t.th}</small></button>`);
  });
  D.models.forEach((m) => {
    const k = m.scale;
    groups.model.insertAdjacentHTML('beforeend', `<button class="card" data-id="${m.id}">
      <svg viewBox="0 0 120 54"><g transform="translate(${50 - 10 * k} 50) scale(${0.2 * k})" style="--wall:currentColor;--wall-shade:currentColor;--roof:currentColor;--roof-shade:currentColor" opacity=".85">
      <polygon points="-100,0 100,0 80,-110 0,-170 -80,-110"/><polygon points="100,0 250,-25 230,-130 80,-110" opacity=".6"/><polygon points="80,-110 230,-130 150,-188 0,-170" opacity=".4"/></g></svg>
      <b>${m.name}</b><small>นอนได้ ${m.sleeps} คน</small></button>`);
  });
  D.colors.forEach((c) => {
    groups.color.insertAdjacentHTML('beforeend', `<button class="swatch" data-id="${c.id}" title="${c.name}" aria-label="${c.name}" style="--wall:${c.wall};--roof:${c.roof}"></button>`);
  });
  groups.color.insertAdjacentHTML('afterend', '<p class="swatch-name" id="cfgColorName"></p>');
  ['shelter', 'living'].forEach((g) => {
    D.items[g].forEach((i) => {
      groups[g].insertAdjacentHTML('beforeend', `<button class="item" data-id="${i.id}" aria-pressed="false">
        <svg viewBox="0 0 40 40"><path d="${i.icon}"/></svg><span><b>${i.name}</b><small>${i.th}</small></span><i></i></button>`);
    });
  });
  const moodSw = { dawn: ['#7E93A8', '#F3D5B5'], noon: ['#5F95BA', '#E3EDE9'], golden: ['#C46B3C', '#F6D8A3'], night: ['#0A1018', '#2E3A55'] };
  D.moods.forEach((mo) => {
    const s = moodSw[mo.id];
    groups.mood.insertAdjacentHTML('beforeend', `<button class="card" data-id="${mo.id}">
      <svg viewBox="0 0 120 54" preserveAspectRatio="none"><defs><linearGradient id="mg-${mo.id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${s[0]}"/><stop offset="1" stop-color="${s[1]}"/></linearGradient></defs><rect width="120" height="54" fill="url(#mg-${mo.id})"/>
      ${mo.id === 'night' ? '<circle cx="92" cy="16" r="7" fill="#F3EEDC"/><circle cx="20" cy="12" r="1" fill="#fff"/><circle cx="50" cy="20" r="1" fill="#fff"/><circle cx="70" cy="8" r="1" fill="#fff"/>' : `<circle cx="${mo.id === 'dawn' ? 26 : mo.id === 'noon' ? 70 : 96}" cy="${mo.id === 'noon' ? 14 : 40}" r="9" fill="#FFF1C9"/>`}
      <path d="M0 46 Q60 40 120 46 V54 H0Z" fill="#00000033"/></svg>
      <b>${mo.name}</b><small>${mo.th} · ${mo.time}</small></button>`);
  });

  groups.terrain.addEventListener('click', (e) => { const b = e.target.closest('.card'); if (!b) return; state.terrain = b.dataset.id; apply(); });
  groups.model.addEventListener('click', (e) => { const b = e.target.closest('.card'); if (!b) return; state.model = b.dataset.id; apply(); });
  groups.color.addEventListener('click', (e) => { const b = e.target.closest('.swatch'); if (!b) return; state.color = b.dataset.id; apply(); });
  groups.mood.addEventListener('click', (e) => { const b = e.target.closest('.card'); if (!b) return; state.mood = b.dataset.id; apply(); });
  [groups.shelter, groups.living].forEach((g) => g.addEventListener('click', (e) => {
    const b = e.target.closest('.item'); if (!b) return;
    toggleItem(b.dataset.id);
  }));

  function toggleItem(id) {
    const on = state.items.includes(id);
    if (on) {
      state.items = state.items.filter((x) => x !== id);
      if (id === 'awning') {
        const dep = state.items.filter((x) => x === 'lantern' || x === 'lights');
        if (dep.length) {
          state.items = state.items.filter((x) => !dep.includes(x));
          toast('นำตะเกียง/ไฟสายออกด้วย เพราะแขวนอยู่กับเสา Awning');
        }
      }
    } else {
      state.items.push(id);
      if ((id === 'lantern' || id === 'lights') && !state.items.includes('awning')) {
        state.items.push('awning');
        toast('เพิ่ม Canvas Awning ให้ด้วย — ใช้เป็นเสาแขวนไฟ ★');
      }
      if (id === 'stove' && state.mood !== 'night') toast('เตาฟืนจะสวยที่สุดตอนกลางคืน — ลองเลือก Mood: Fireside');
    }
    apply();
  }

  function syncControls() {
    const mark = (g, id) => $$('[data-id]', g).forEach((b) => b.classList.toggle('is-active', b.dataset.id === id));
    mark(groups.terrain, state.terrain); mark(groups.model, state.model);
    mark(groups.color, state.color); mark(groups.mood, state.mood);
    $$('.item', $('.build')).forEach((b) => {
      const on = state.items.includes(b.dataset.id);
      b.classList.toggle('is-active', on); b.setAttribute('aria-pressed', on);
    });
    const c = find(D.colors, state.color);
    $('#cfgColorName').innerHTML = `<b>${c.name}</b> · ${c.th}`;
  }

  /* steps */
  let step = 0;
  const stepBtns = $$('#steps button');
  const stepPanes = $$('.build .step');
  function goStep(i) {
    step = Math.max(0, Math.min(stepPanes.length - 1, i));
    stepBtns.forEach((b, k) => { b.classList.toggle('is-active', k === step); b.classList.toggle('is-done', k < step); });
    stepPanes.forEach((p, k) => p.classList.toggle('is-active', k === step));
    $('#prevStep').style.visibility = step === 0 ? 'hidden' : 'visible';
    $('#nextStep').textContent = step === stepPanes.length - 1 ? 'ดู Camp Card ↓' : 'ถัดไป →';
  }
  stepBtns.forEach((b, i) => b.addEventListener('click', () => goStep(i)));
  $('#prevStep').addEventListener('click', () => goStep(step - 1));
  $('#nextStep').addEventListener('click', () => {
    if (step === stepPanes.length - 1) { $('#campCard').scrollIntoView({ behavior: 'smooth', block: 'center' }); return; }
    goStep(step + 1);
  });

  /* presets */
  $('#presets').addEventListener('click', (e) => {
    const b = e.target.closest('[data-preset]'); if (!b) return;
    state = JSON.parse(JSON.stringify(D.presets[b.dataset.preset]));
    $$('#presets .chip').forEach((x) => x.classList.toggle('is-active', x === b));
    apply();
    toast(`โหลดชุด “${b.textContent}” แล้ว — ปรับแต่งต่อได้เลย`);
  });

  /* share / reset / advisor */
  const encode = () => `camp=${[state.terrain, state.model, state.color, state.mood, state.items.join('+')].join(',')}`;
  function decode(hash) {
    const m = /camp=([^&]+)/.exec(hash); if (!m) return false;
    const [terrain, model, color, mood, items] = decodeURIComponent(m[1]).split(',');
    if (!find(D.terrains, terrain) || !find(D.models, model) || !find(D.colors, color) || !find(D.moods, mood)) return false;
    state = { terrain, model, color, mood, items: (items || '').split('+').filter((x) => allItems.some((i) => i.id === x)) };
    return true;
  }
  $('#shareCamp').addEventListener('click', async () => {
    const url = `${location.origin}${location.pathname}#${encode()}`;
    history.replaceState(null, '', `#${encode()}`);
    try { await navigator.clipboard.writeText(url); toast('คัดลอกลิงก์แคมป์แล้ว — ส่งให้เพื่อนร่วมทริปได้เลย'); }
    catch (e) { toast('ลิงก์แคมป์อยู่ในแถบที่อยู่ด้านบนแล้ว'); }
  });
  $('#resetCamp').addEventListener('click', () => {
    state = JSON.parse(JSON.stringify(DEFAULT));
    $$('#presets .chip').forEach((x) => x.classList.remove('is-active'));
    goStep(0); apply();
  });
  $('#sendAdvisor').addEventListener('click', () => {
    const m = find(D.models, state.model), c = find(D.colors, state.color);
    const t = find(D.terrains, state.terrain), mo = find(D.moods, state.mood);
    const items = allItems.filter((i) => state.items.includes(i.id)).map((i) => i.name).join(', ');
    const text = `${$('#campName').textContent}\nTent: Springbar® ${m.name} (${c.name})\nSetting: ${t.name} · ${mo.name}\nGear: ${items || '-'}\nLink: ${location.origin}${location.pathname}#${encode()}`;
    const field = $('#campField');
    field.value = text;
    field.classList.remove('is-filled'); void field.offsetWidth; field.classList.add('is-filled');
    $('#visit').scrollIntoView({ behavior: 'smooth' });
    setTimeout(() => { const n = $('#visitForm [name="name"]'); n && n.focus({ preventScroll: true }); }, 900);
    toast('แนบแคมป์ของคุณในฟอร์มแล้ว ★');
  });

  /* from 360 studio */
  document.addEventListener('uscamp:usetent', (e) => {
    state.model = e.detail.model; state.color = e.detail.color;
    apply({ silent: true }); goStep(1);
  });

  /* init */
  buildScene();
  if (decode(location.hash)) {
    setTimeout(() => { const b = $('#build'); b && b.scrollIntoView(); }, 300);
  }
  goStep(0);
  apply({ silent: true });
})();
