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
  const endIntro = () => {
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
    window.addEventListener('load', () => setTimeout(endIntro, 1900));
    setTimeout(() => { if (document.body.contains(intro)) endIntro(); }, 4500); // safety
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
  let lastY = 0;
  const onScroll = () => {
    const y = window.scrollY;
    nav.classList.toggle('is-solid', y > 40);
    nav.classList.toggle('is-hidden', y > lastY && y > 500 && !nav.classList.contains('is-open'));
    lastY = y;
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

  /* ---------- story chapters ---------- */
  const frames = $$('#storyVisual .frame');
  const chapters = $$('.chapter');
  const storyNum = $('#storyNum');
  let current = 0;
  const showChapter = (i) => {
    if (i === current) return;
    const prev = frames[current];
    prev.classList.remove('is-active');
    prev.classList.add('is-leaving');
    setTimeout(() => prev.classList.remove('is-leaving'), 1100);
    frames[i].classList.add('is-active');
    current = i;
    storyNum.textContent = String(i + 1).padStart(2, '0');
  };
  const chapIO = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        chapters.forEach((c) => c.classList.remove('is-active'));
        e.target.classList.add('is-active');
        showChapter(+e.target.dataset.chapter);
      }
    });
  }, { rootMargin: '-45% 0px -45% 0px' });
  chapters.forEach((c) => chapIO.observe(c));
  chapters[0].classList.add('is-active');

  /* ---------- a day at camp ---------- */
  const day = $('#day');
  const tabs = $$('.day__tab');
  const progress = $('#dayProgress');
  const times = tabs.map((t) => t.dataset.time);
  let dayIdx = 0, dayTimer = null, dayStart = 0, dayRAF = null, dayVisible = false, userPicked = false;
  const DUR = 7000;

  const setTime = (i) => {
    dayIdx = i;
    const t = times[i];
    day.dataset.time = t;
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
    const p = Math.min((now - dayStart) / DUR, 1);
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
    let ok = true;
    $$('[required]', form).forEach((f) => {
      const bad = !f.value.trim();
      f.classList.toggle('is-invalid', bad);
      if (bad) ok = false;
    });
    const msg = $('#formMsg');
    if (!ok) { msg.textContent = 'กรุณากรอกชื่อและช่องทางติดต่อ'; return; }
    msg.textContent = `ขอบคุณครับคุณ ${form.name.value.trim()} — Camp Advisor ของเราจะติดต่อกลับภายใน 1 วันทำการ ★`;
    form.reset();
  });

  $('#year').textContent = new Date().getFullYear();
})();
