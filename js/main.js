/* US Camp — page interactions: intro, nav, reveals, parallax, story, day-at-camp */
(function () {
  'use strict';
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- toast (shared) ---------- */
  let toastTimer;
  window.USCampToast = function (msg) {
    const t = $('#toast');
    t.textContent = msg;
    t.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('is-on'), 2800);
  };

  /* ---------- hero photo slideshow (slow Ken Burns crossfade) ---------- */
  const slides = $$('#heroSlides .hero__slide');
  const dots = $('#heroDots'), cap = $('#heroCaption');
  let slideIdx = 0, slideTimer = null;
  slides.forEach((s, i) => {
    const b = document.createElement('button');
    b.setAttribute('aria-label', 'ภาพที่ ' + (i + 1));
    b.addEventListener('click', () => { if (i !== slideIdx) showSlide(i); restartSlides(); });
    dots.appendChild(b);
  });
  function showSlide(i) {
    const prev = slides[slideIdx];
    prev.classList.remove('is-active');
    prev.classList.add('was-active');
    setTimeout(() => prev.classList.remove('was-active'), 1800);
    slideIdx = i;
    const s = slides[i];
    const img = s.querySelector('img');
    if (img.loading === 'lazy') img.loading = 'eager';
    s.classList.add('is-active');
    cap.classList.remove('is-in'); void cap.offsetWidth;
    cap.textContent = s.dataset.caption; cap.classList.add('is-in');
    Array.from(dots.children).forEach((d, k) => d.classList.toggle('is-active', k === i));
  }
  function restartSlides() {
    clearInterval(slideTimer);
    if (!reduced) slideTimer = setInterval(() => showSlide((slideIdx + 1) % slides.length), 6500);
  }
  dots.children[0].classList.add('is-active');
  // warm the next slides after first paint
  window.addEventListener('load', () => slides.forEach((s) => { const im = s.querySelector('img'); im.loading = 'eager'; }));
  restartSlides();

  /* ---------- intro ---------- */
  const intro = $('#intro');
  document.body.classList.add('is-loading');
  let introDone = false;
  const endIntro = () => {
    if (introDone) return;
    introDone = true;
    intro.classList.add('is-done');
    document.body.classList.remove('is-loading');
    setTimeout(() => {
      intro.remove();
      $$('.hero .split, .hero .reveal').forEach((el) => el.classList.add('is-in'));
    }, reduced ? 0 : 450);
  };
  const seen = (() => { try { return sessionStorage.getItem('uscamp-intro'); } catch (e) { return null; } })();
  if (seen || reduced) {
    intro.style.transition = 'none';
    endIntro();
  } else {
    try { sessionStorage.setItem('uscamp-intro', '1'); } catch (e) { /* ignore */ }
    // short title card; any tap, click or key skips it
    window.addEventListener('load', () => setTimeout(endIntro, 1200));
    intro.addEventListener('pointerdown', endIntro);
    window.addEventListener('keydown', endIntro, { once: true });
    setTimeout(endIntro, 3200); // never block a slow connection for long
  }

  /* ---------- split headlines into words ---------- */
  $$('.split').forEach((el) => {
    let i = 0;
    const walk = (node) => {
      Array.from(node.childNodes).forEach((n) => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
            const w = document.createElement('span');
            w.className = 'w';
            const inner = document.createElement('span');
            inner.textContent = part;
            inner.style.setProperty('--i', i++);
            w.appendChild(inner);
            frag.appendChild(w);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1 && n.tagName !== 'BR') {
          walk(n);
        }
      });
    };
    walk(el);
  });

  /* ---------- reveal on scroll ---------- */
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
    });
  }, { threshold: 0.18, rootMargin: '0px 0px -6% 0px' });
  $$('.split, .reveal').forEach((el) => { if (!el.closest('.hero')) io.observe(el); });

  /* ---------- nav ---------- */
  const nav = $('#nav');
  const burger = $('#burger');
  // real nav height (strip + bar) so the hero always starts below it
  const setNavH = () => document.documentElement.style.setProperty('--nav-h', nav.offsetHeight + 'px');
  setNavH();
  window.addEventListener('resize', setNavH);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(setNavH);
  let lastY = 0;
  const progressBar = $('#scrollProgress');
  const dock = $('#dock');
  const build = $('#build'), visit = $('#visit');
  const onScroll = () => {
    const y = window.scrollY;
    nav.classList.toggle('is-solid', y > 40);
    nav.classList.toggle('is-hidden', y > lastY && y > 500 && !nav.classList.contains('is-open'));
    lastY = y;
    const max = document.documentElement.scrollHeight - innerHeight;
    if (progressBar) progressBar.style.transform = `scaleX(${max > 0 ? (y / max).toFixed(4) : 0})`;
    // mobile action dock: after the hero, hidden while the visitor is already building or booking
    if (dock) {
      const inBuild = build.getBoundingClientRect().top < innerHeight * 0.6 && build.getBoundingClientRect().bottom > innerHeight * 0.4;
      const inVisit = visit.getBoundingClientRect().top < innerHeight * 0.8;
      dock.classList.toggle('is-on', y > innerHeight * 0.85 && !inBuild && !inVisit);
    }
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  burger.addEventListener('click', () => {
    const open = nav.classList.toggle('is-open');
    burger.setAttribute('aria-expanded', open);
    document.body.style.overflow = open ? 'hidden' : '';
  });
  $$('#navLinks a').forEach((a) => a.addEventListener('click', () => {
    nav.classList.remove('is-open');
    burger.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }));
  // current section highlight
  const sectionIO = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      $$('#navLinks a').forEach((a) => a.classList.toggle('is-current', a.getAttribute('href') === '#' + e.target.id));
    });
  }, { threshold: 0.35 });
  ['story', 'day', 'studio', 'build', 'visit'].forEach((id) => { const s = document.getElementById(id); if (s) sectionIO.observe(s); });

  /* ---------- hero parallax ---------- */
  const heroSlides = $('#heroSlides');
  if (!reduced) {
    let ticking = false;
    window.addEventListener('scroll', () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        const y = Math.min(window.scrollY, window.innerHeight);
        heroSlides.style.transform = `translateY(${(y * 0.3).toFixed(1)}px)`;
      });
    }, { passive: true });
  }

  /* ---------- story spreads: image wipes in, text follows ---------- */
  const spreadIO = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-in'); spreadIO.unobserve(e.target); } });
  }, { threshold: 0.2 });
  $$('.spread').forEach((el) => spreadIO.observe(el));

  /* ---------- a day at camp ---------- */
  const day = $('#day');
  const tabs = $$('.day__tab');
  const progress = $('#dayProgress');
  const times = tabs.map((t) => t.dataset.time);
  let dayIdx = 0, dayStart = 0, dayRAF = null, dayVisible = false, userPicked = false, paused = false, pausedAt = 0;
  const DUR = 7000;

  // ambient backdrop: a blurred copy of each moment's photo
  const sky = $('.day__sky', day);
  $$('.postcard', day).forEach((p) => {
    const bg = document.createElement('div');
    bg.className = 'day__bg';
    bg.dataset.time = p.dataset.time;
    bg.style.backgroundImage = `url("${p.querySelector('img').getAttribute('src')}")`;
    sky.appendChild(bg);
  });
  // pause auto-play while the visitor is reading or touching the stage
  const stage = $('.day__stage', day);
  const pause = () => { if (!paused) { paused = true; pausedAt = performance.now(); } };
  const resume = () => { if (paused) { paused = false; dayStart += performance.now() - pausedAt; } };
  stage.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') pause(); });
  stage.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') resume(); });
  stage.addEventListener('touchstart', () => { userPicked = true; }, { passive: true });

  const setTime = (i) => {
    dayIdx = i;
    const t = times[i];
    day.dataset.time = t;
    $$('.day__bg', day).forEach((b) => b.classList.toggle('is-active', b.dataset.time === t));
    tabs.forEach((b, k) => { b.classList.toggle('is-active', k === i); b.setAttribute('aria-selected', k === i); });
    $$('.postcard', day).forEach((p) => p.classList.toggle('is-active', p.dataset.time === t));
    $$('.moment', day).forEach((m) => m.classList.toggle('is-active', m.dataset.time === t));
    const tab = tabs[i];
    progress.style.left = tab.offsetLeft + 'px';
    progress.style.top = (tab.offsetTop - 1) + 'px';
    dayStart = performance.now();
  };
  const tick = (now) => {
    const tab = tabs[dayIdx];
    const p = Math.min(((paused ? pausedAt : now) - dayStart) / DUR, 1);
    progress.style.width = (userPicked ? tab.offsetWidth : tab.offsetWidth * p) + 'px';
    if (!userPicked && p >= 1 && dayVisible) setTime((dayIdx + 1) % times.length);
    dayRAF = requestAnimationFrame(tick);
  };
  tabs.forEach((b, i) => b.addEventListener('click', () => { userPicked = true; setTime(i); }));
  new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      dayVisible = e.isIntersecting;
      if (dayVisible && !dayRAF) { dayStart = performance.now(); dayRAF = requestAnimationFrame(tick); }
      if (!dayVisible && dayRAF) { cancelAnimationFrame(dayRAF); dayRAF = null; }
    });
  }, { threshold: 0.3 }).observe(day);
  if (reduced) userPicked = true;
  setTime(0);
  window.addEventListener('resize', () => setTime(dayIdx));

  /* ---------- visit form ---------- */
  const form = $('#visitForm');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    let first = null;
    $$('[required]', form).forEach((f) => {
      const bad = !f.value.trim();
      f.classList.toggle('is-invalid', bad);
      f.setAttribute('aria-invalid', bad);
      const hint = f.parentElement.querySelector('.field-err');
      if (hint) hint.hidden = !bad;
      if (bad && !first) first = f;
    });
    const msg = $('#formMsg');
    if (first) { msg.textContent = ''; first.focus(); return; }
    const name = form.name.value.trim();
    form.classList.add('is-sent');
    $('#formDone').hidden = false;
    $('#formDoneName').textContent = name;
    form.reset();
  });
  $$('[required]', form).forEach((f) => f.addEventListener('input', () => {
    if (f.value.trim()) { f.classList.remove('is-invalid'); f.removeAttribute('aria-invalid'); const h = f.parentElement.querySelector('.field-err'); if (h) h.hidden = true; }
  }));
  const again = $('#formAgain');
  if (again) again.addEventListener('click', () => { form.classList.remove('is-sent'); $('#formDone').hidden = true; });

  $('#year').textContent = new Date().getFullYear();
})();
