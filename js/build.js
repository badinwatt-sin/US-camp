/* US Camp — Build Your Camp (photo lookbook + Camp Card) */
(function () {
  'use strict';
  const D = window.USCampData;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const toast = (m) => window.USCampToast && window.USCampToast(m);
  const find = (list, id) => list.find((x) => x.id === id);
  const allItems = [...D.items.shelter, ...D.items.living];

  const DEFAULT = { terrain: 'desert', model: 'vagabond', color: 'suntan', mood: 'golden', items: ['tarp', 'chairs', 'fire'] };
  let state = JSON.parse(JSON.stringify(DEFAULT));

  /* ---------- lookbook photo stack (crossfade) ---------- */
  const photos = $('#lookPhotos');
  const used = new Set();
  Object.values(D.scenes).forEach((byMood) => Object.values(byMood).forEach((p) => used.add(p)));
  used.forEach((p) => {
    const f = document.createElement('figure');
    f.dataset.photo = p;
    f.innerHTML = `<img src="assets/img/real/${p}.jpg" alt="" loading="lazy" />`;
    photos.appendChild(f);
  });

  /* ---------- controls ---------- */
  const groups = {
    terrain: $('[data-group="terrain"]'), model: $('[data-group="model"]'),
    color: $('.build [data-group="color"]'), shelter: $('[data-group="shelter"]'),
    living: $('[data-group="living"]'), mood: $('[data-group="mood"]')
  };
  D.terrains.forEach((t) => groups.terrain.insertAdjacentHTML('beforeend',
    `<button class="card" data-id="${t.id}"><span class="card__img"><img src="${t.thumb}" alt="" loading="lazy"/></span><b>${t.name}</b><small>${t.th}</small></button>`));
  D.models.forEach((m) => groups.model.insertAdjacentHTML('beforeend',
    `<button class="card card--product" data-id="${m.id}"><span class="card__img card__img--white"><img src="assets/img/products/${m.id}-natural.jpg" alt="" loading="lazy"/></span><b>${m.name}</b><small>${m.ft} · นอน ${m.sleeps} คน</small></button>`));
  D.colors.forEach((c) => groups.color.insertAdjacentHTML('beforeend',
    `<button class="swatch" data-id="${c.id}" title="${c.name}" aria-label="${c.name}" style="--wall:${c.wall};--roof:${c.roof}"></button>`));
  groups.color.insertAdjacentHTML('afterend', '<p class="swatch-name" id="cfgColorName"></p>');
  ['shelter', 'living'].forEach((g) => D.items[g].forEach((i) => groups[g].insertAdjacentHTML('beforeend',
    `<button class="item" data-id="${i.id}" aria-pressed="false"><svg viewBox="0 0 40 40"><path d="${i.icon}"/></svg><span><b>${i.name}</b><small>${i.th}</small></span><i></i></button>`)));
  const moodThumb = { dawn: 'forest-walk', noon: 'pines', golden: 'desert-dusk', night: 'lantern' };
  D.moods.forEach((mo) => groups.mood.insertAdjacentHTML('beforeend',
    `<button class="card" data-id="${mo.id}"><span class="card__img"><img src="assets/img/real/${moodThumb[mo.id]}.jpg" alt="" loading="lazy"/></span><b>${mo.name}</b><small>${mo.th} · ${mo.time}</small></button>`));

  const pick = (key) => (e) => { const b = e.target.closest('[data-id]'); if (!b) return; state[key] = b.dataset.id; apply(); };
  groups.terrain.addEventListener('click', pick('terrain'));
  groups.model.addEventListener('click', pick('model'));
  groups.color.addEventListener('click', pick('color'));
  groups.mood.addEventListener('click', pick('mood'));
  [groups.shelter, groups.living].forEach((g) => g.addEventListener('click', (e) => {
    const b = e.target.closest('.item'); if (b) toggleItem(b.dataset.id);
  }));

  function toggleItem(id) {
    if (state.items.includes(id)) {
      state.items = state.items.filter((x) => x !== id);
    } else {
      state.items.push(id);
      if (id === 'stove' && state.mood !== 'night') toast('เตาฟืนจะได้ใช้เต็มที่ตอนกลางคืน ลองเลือกเวลา Lantern Light ดู');
      if (id === 'fly') toast('Stormfly® ช่วยได้มากช่วงหน้ามรสุมของไทย');
    }
    apply();
  }

  /* ---------- render ---------- */
  const grade = {
    dawn: 'linear-gradient(180deg, rgba(120,140,170,.28), rgba(240,190,160,.18))',
    noon: 'linear-gradient(180deg, rgba(255,255,255,0), rgba(255,255,255,0))',
    golden: 'linear-gradient(180deg, rgba(230,140,60,.18), rgba(180,83,42,.12))',
    night: 'linear-gradient(180deg, rgba(10,16,30,.25), rgba(10,16,30,0))'
  };

  function apply(opts = {}) {
    const m = find(D.models, state.model), c = find(D.colors, state.color);
    const t = find(D.terrains, state.terrain), mo = find(D.moods, state.mood);
    const photo = D.scenes[state.terrain][state.mood];

    $$('figure', photos).forEach((f) => f.classList.toggle('is-active', f.dataset.photo === photo));
    $('#lookGrade').style.background = grade[state.mood];
    $('#lookbook').dataset.mood = state.mood;
    const credit = D.credits[photo];
    $('#lookCredit').textContent = credit ? `photo: ${credit}` : '';

    const img = $('#lookTentImg');
    const src = `assets/img/products/${m.id}-${c.id}.jpg`;
    if (img.getAttribute('src') !== src) {
      const tent = $('#lookTent');
      tent.classList.add('is-swapping');
      const pre = new Image();
      pre.onload = () => { img.src = src; tent.classList.remove('is-swapping'); };
      pre.src = src;
    }
    img.alt = `Springbar ${m.name} สี ${c.name}`;
    $('#lookTentCap').textContent = `${m.name} · ${c.name}`;

    const chosen = allItems.filter((i) => state.items.includes(i.id));
    $('#lookKit').innerHTML = chosen.map((i) => `<li><svg viewBox="0 0 40 40"><path d="${i.icon}"/></svg>${i.name}</li>`).join('');

    const title = $('.lookbook__title');
    const name = `The ${mo.word} ${t.word} Camp`;
    if ($('#campName').textContent !== name) {
      $('#campName').textContent = name;
      title.classList.remove('is-swap'); void title.offsetWidth; title.classList.add('is-swap');
    }
    $('#campTagline').textContent = `${t.name} · ${mo.time}`;

    renderVibes(m, t, mo);
    renderCard(m, c, t, mo);
    syncControls();
    if (!opts.silent && window.USCampStudio && window.USCampStudio.set) window.USCampStudio.set(state.model, state.color);
  }

  function renderVibes(m, t, mo) {
    const has = (id) => state.items.includes(id);
    const v = [];
    if (has('stove') || (mo.id === 'night' && has('rug'))) v.push('Canvas Cabin');
    if (has('rug') && has('lantern')) v.push('Old-School Americana');
    v.push({ desert: 'Desert Nomad', forest: 'Pine & Canvas', lake: 'Lakeside Slow Life', range: 'Cowboy Country' }[t.id]);
    if (has('fire')) v.push('Fireside Stories');
    if (m.id === 'compact' || m.id === 'outfitter') v.push('Pack Light, Stand Tall');
    if (m.id === 'traveler') v.push('The Original');
    if (has('fly')) v.push('All-Weather');
    $('#vibes').innerHTML = v.slice(0, 4).map((x) => `<span class="vibe">★ ${x}</span>`).join('');
  }

  function renderCard(m, c, t, mo) {
    const rows = [`<li><span><b>Springbar® ${m.name}</b> · ${c.name}</span><span>${m.ft} · ${m.sleeps} คน</span></li>`];
    allItems.filter((i) => state.items.includes(i.id)).forEach((i) => {
      rows.push(`<li><span>${i.name}</span><span>${D.items.shelter.includes(i) ? 'Shelter' : 'Living'}</span></li>`);
    });
    rows.push(`<li><span>Setting</span><span>${t.name} · ${mo.name}</span></li>`);
    $('#gearList').innerHTML = rows.join('');
    $('#itemCount').textContent = `${state.items.length + 1} items`;
  }

  function syncControls() {
    const mark = (g, id) => $$('[data-id]', g).forEach((b) => b.classList.toggle('is-active', b.dataset.id === id));
    mark(groups.terrain, state.terrain); mark(groups.model, state.model);
    mark(groups.color, state.color); mark(groups.mood, state.mood);
    $$('.build .item').forEach((b) => {
      const on = state.items.includes(b.dataset.id);
      b.classList.toggle('is-active', on); b.setAttribute('aria-pressed', on);
    });
    // model thumbnails follow the chosen colour
    $$('.card--product img', groups.model).forEach((im) => {
      const id = im.closest('[data-id]').dataset.id;
      const src = `assets/img/products/${id}-${state.color}.jpg`;
      if (im.getAttribute('src') !== src) im.src = src;
    });
    const c = find(D.colors, state.color);
    $('#cfgColorName').innerHTML = `<b>${c.name}</b> · ${c.th}`;
  }

  /* ---------- steps ---------- */
  let step = 0;
  const stepBtns = $$('#steps button'), stepPanes = $$('.build .step');
  function goStep(i, opts) {
    step = Math.max(0, Math.min(stepPanes.length - 1, i));
    stepBtns.forEach((b, k) => { b.classList.toggle('is-active', k === step); b.classList.toggle('is-done', k < step); b.setAttribute('aria-selected', k === step); });
    stepPanes.forEach((p, k) => p.classList.toggle('is-active', k === step));
    $('#prevStep').style.visibility = step === 0 ? 'hidden' : 'visible';
    $('#nextStep').textContent = step === stepPanes.length - 1 ? 'ดู Camp Card ↓' : `ถัดไป: ${stepBtns[step + 1].querySelector('span').textContent} →`;
    $('#stepCount').textContent = `ขั้นที่ ${step + 1} จาก ${stepPanes.length}`;
    // on phones, bring the options back under the sticky preview when the step changes
    if (opts && opts.scroll && window.innerWidth < 1081) {
      const panel = $('.build__panel');
      const top = panel.getBoundingClientRect().top + window.scrollY - (document.querySelector('.build__scene').offsetHeight + 16);
      if (Math.abs(window.scrollY - top) > 40) window.scrollTo({ top, behavior: 'smooth' });
    }
  }
  stepBtns.forEach((b, i) => b.addEventListener("click", () => goStep(i, { scroll: true })));
  $('#prevStep').addEventListener("click", () => goStep(step - 1, { scroll: true }));
  $('#nextStep').addEventListener('click', () => {
    if (step === stepPanes.length - 1) { $('#campCard').scrollIntoView({ behavior: 'smooth', block: 'center' }); return; }
    goStep(step + 1, { scroll: true });
  });

  $('#presets').addEventListener('click', (e) => {
    const b = e.target.closest('[data-preset]'); if (!b) return;
    state = JSON.parse(JSON.stringify(D.presets[b.dataset.preset]));
    $$('#presets .chip').forEach((x) => x.classList.toggle('is-active', x === b));
    apply();
    toast(`โหลดชุด “${b.textContent}” แล้ว ปรับต่อได้เลย`);
  });

  /* ---------- share / reset / advisor ---------- */
  const encode = () => `camp=${[state.terrain, state.model, state.color, state.mood, state.items.join('+')].join(',')}`;
  function decode(hash) {
    const mm = /camp=([^&]+)/.exec(hash); if (!mm) return false;
    const [terrain, model, color, mood, items] = decodeURIComponent(mm[1]).split(',');
    if (!find(D.terrains, terrain) || !find(D.models, model) || !find(D.colors, color) || !find(D.moods, mood)) return false;
    state = { terrain, model, color, mood, items: (items || '').split('+').filter((x) => allItems.some((i) => i.id === x)) };
    return true;
  }
  $('#shareCamp').addEventListener('click', async () => {
    const url = `${location.origin}${location.pathname}#${encode()}`;
    try { history.replaceState(null, '', `#${encode()}`); } catch (e) { /* sandboxed */ }
    try { await navigator.clipboard.writeText(url); toast('คัดลอกลิงก์แคมป์แล้ว ส่งให้เพื่อนร่วมทริปได้เลย'); }
    catch (e) { toast('คัดลอกไม่ได้ ลองคัดลอกจากแถบที่อยู่ด้านบนแทน'); }
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
    const field = $('#campField');
    field.value = `${$('#campName').textContent}\nเต้นท์: Springbar® ${m.name} (${c.name})\nที่กาง: ${t.name} · ${mo.name}\nอุปกรณ์: ${items || '-'}`;
    field.classList.remove('is-filled'); void field.offsetWidth; field.classList.add('is-filled');
    $('#visit').scrollIntoView({ behavior: 'smooth' });
    setTimeout(() => { const n = $('#fName'); n && n.focus({ preventScroll: true }); }, 900);
    toast('แนบแคมป์ของคุณไว้ในฟอร์มแล้ว ★');
  });

  document.addEventListener('uscamp:usetent', (e) => {
    state.model = e.detail.model; state.color = e.detail.color;
    apply({ silent: true }); goStep(1);
  });

  if (decode(location.hash)) setTimeout(() => { const b = $('#build'); b && b.scrollIntoView(); }, 300);
  goStep(0);
  apply({ silent: true });
})();
