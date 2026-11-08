/* US Camp — floating "browse the shop" button.
   One pill button fixed at the bottom-right of the homepage and the tracking page, always visible.
   It hides only while the cart drawer or a dialog is open, and is not shown on the shop itself. */
(function () {
  'use strict';
  if (/shop\.html/.test(location.pathname)) return;
  const a = document.createElement('a');
  a.className = 'qshop';
  a.href = 'shop.html';
  a.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8h16l-1.5 11a2 2 0 0 1-2 1.7H7.5a2 2 0 0 1-2-1.7Z M8.5 8V6.5a3.5 3.5 0 0 1 7 0V8"/></svg><span>เลือกดูสินค้า</span><i aria-hidden="true">→</i>';
  document.body.appendChild(a);
  requestAnimationFrame(() => a.classList.add('is-on'));
  // a gentle nudge a few seconds after arriving, once per session
  let nudged = false;
  try { nudged = sessionStorage.getItem('uscamp-qshop') === '1'; } catch (e) { /* ignore */ }
  if (!nudged && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    setTimeout(() => { a.classList.add('is-nudge'); try { sessionStorage.setItem('uscamp-qshop', '1'); } catch (e) { /* ignore */ } }, 4000);
  }
  // on the homepage, step aside while the hero's own buttons are on screen so they are never covered
  let ctaVisible = false;
  const cta = document.querySelector('.hero__cta');
  const sync = () => a.classList.toggle('is-off', ctaVisible || document.body.classList.contains('no-scroll') || !!document.querySelector('dialog[open]'));
  if (cta) new IntersectionObserver((e) => { ctaVisible = e[0].isIntersecting; sync(); }).observe(cta);
  new MutationObserver(sync).observe(document.body, { attributes: true, attributeFilter: ['class'] });
})();
