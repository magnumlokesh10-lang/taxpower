/* Light navigation behaviour for standalone landing pages (mobile menu, dropdowns, scroll-hide header). */
(() => {
  const header = document.querySelector('.header');
  const menu = document.getElementById('navbarMenu');
  const burger = document.getElementById('hamburgerBtn');
  const hint = document.getElementById('headerRevealHint');
  const dropdowns = Array.from(document.querySelectorAll('.nav-dropdown'));
  const mobile = () => window.innerWidth <= 1180 || window.matchMedia('(hover: none)').matches;

  function setMenu(open) {
    if (!menu || !burger) return;
    menu.classList.toggle('active', open);
    burger.classList.toggle('active', open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Close navigation menu' : 'Open navigation menu');
    document.body.classList.toggle('nav-menu-open', open && window.innerWidth <= 1100);
    header?.classList.remove('navbar-scroll-hidden');
  }
  burger?.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); setMenu(!menu.classList.contains('active')); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && menu?.classList.contains('active')) { setMenu(false); burger.focus(); } });
  document.addEventListener('click', (e) => {
    if (menu?.classList.contains('active') && !menu.contains(e.target) && !burger.contains(e.target)) setMenu(false);
  });

  dropdowns.forEach((dd) => {
    const toggle = dd.querySelector('.nav-dropdown-toggle');
    toggle?.addEventListener('click', (e) => {
      if (!mobile()) return;
      e.preventDefault();
      const wasOpen = dd.classList.contains('is-open');
      dropdowns.forEach((d) => d.classList.remove('is-open'));
      dd.classList.toggle('is-open', !wasOpen);
      toggle.setAttribute('aria-expanded', String(!wasOpen));
    });
  });

  let lastY = window.scrollY;
  window.addEventListener('scroll', () => {
    if (!header || menu?.classList.contains('active')) return;
    const y = window.scrollY;
    header.classList.toggle('navbar-scroll-hidden', y > 80 && y > lastY);
    lastY = y;
  }, { passive: true });
  hint?.addEventListener('click', () => { header?.classList.remove('navbar-scroll-hidden'); header?.classList.add('navbar-stay-visible'); });

  window.addEventListener('resize', () => { if (window.innerWidth > 1100) setMenu(false); });
})();

/* Due-date calendar: filters and hiding of dates that have passed. */
(() => {
  const cal = document.querySelector('.lp-calendar');
  if (!cal) return;
  const items = Array.from(cal.querySelectorAll('.lp-due-item'));
  const months = Array.from(cal.querySelectorAll('.lp-month'));
  const tabs = Array.from(document.querySelectorAll('[data-due-filter]'));
  const past = document.querySelector('[data-due-past]');
  const today = new Date().toISOString().slice(0, 10);
  let kind = 'all';
  function apply() {
    const showPast = past && past.checked;
    items.forEach((el) => {
      const hide = (kind !== 'all' && el.dataset.kind !== kind) || (!showPast && el.dataset.date < today);
      el.classList.toggle('is-hidden', hide);
    });
    months.forEach((m) => m.classList.toggle('is-hidden', !m.querySelector('.lp-due-item:not(.is-hidden)')));
  }
  tabs.forEach((t) => t.addEventListener('click', () => {
    kind = t.dataset.dueFilter;
    tabs.forEach((x) => x.classList.toggle('is-active', x === t));
    apply();
  }));
  past?.addEventListener('change', apply);
  apply();
})();

/* Carry the chosen purpose and product to the enquiry form, like the main site does. */
document.addEventListener('click', (e) => {
  const a = e.target.closest('a[data-demo-purpose]');
  if (!a) return;
  try {
    sessionStorage.setItem('taxpower_demo_context', JSON.stringify({ purpose: a.getAttribute('data-demo-purpose'), product: a.getAttribute('data-demo-product') }));
  } catch (err) { /* storage can be blocked */ }
});
