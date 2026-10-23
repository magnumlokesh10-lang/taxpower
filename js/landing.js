/* Light navigation behaviour for standalone landing pages (mobile menu, dropdowns, scroll-hide header). */
(() => {
  const header = document.querySelector('.header');
  const menu = document.getElementById('navbarMenu');
  const burger = document.getElementById('hamburgerBtn');
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

  window.addEventListener('resize', () => { if (window.innerWidth > 1100) setMenu(false); });
})();

/* Due dates: Income-Tax-style calendar (month grid + day table) and the month list. */
(() => {
  const dataEl = document.getElementById('lp-due-data');
  const list = document.querySelector('[data-due-list]');
  if (!dataEl || !list) return;
  const events = JSON.parse(dataEl.textContent);
  const cal = document.querySelector('[data-taxcal]');
  const grid = cal.querySelector('[data-tc-grid]');
  const monthLabel = cal.querySelector('[data-tc-month]');
  const title = cal.querySelector('[data-tc-title]');
  const rows = cal.querySelector('[data-tc-rows]');
  const prev = cal.querySelector('[data-tc-prev]');
  const next = cal.querySelector('[data-tc-next]');
  const items = Array.from(list.querySelectorAll('.lp-due-item'));
  const months = Array.from(list.querySelectorAll('.lp-month'));
  const filters = Array.from(document.querySelectorAll('[data-due-filter]'));
  const views = Array.from(document.querySelectorAll('[data-due-view]'));
  const past = document.querySelector('[data-due-past]');
  const pastWrap = document.querySelector('[data-due-pastwrap]');
  const search = document.querySelector('[data-due-search]');
  const pad = (n) => String(n).padStart(2, '0');
  const iso = (y, m, d) => `${y}-${pad(m + 1)}-${pad(d)}`;
  const t = new Date();
  const today = iso(t.getFullYear(), t.getMonth(), t.getDate());
  const MN = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const first = events[0].d, last = events[events.length - 1].d;
  const firstM = [+first.slice(0, 4), +first.slice(5, 7) - 1], lastM = [+last.slice(0, 4), +last.slice(5, 7) - 1];
  let kind = 'all', view = 'cal', q = '';
  let sel = events.find((e) => e.d >= today)?.d || last;
  let cur = [+sel.slice(0, 4), +sel.slice(5, 7) - 1];
  const match = (e) => (kind === 'all' || e.k === kind) && (!q || (e.t + ' ' + e.x + ' ' + e.k).toLowerCase().includes(q));
  const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const nice = (d) => `${+d.slice(8)} ${MN[+d.slice(5, 7) - 1].slice(0, 3)} ${d.slice(0, 4)}`;
  const tag = (k) => `<span class="lp-due-tag lp-due-tag--${k.toLowerCase()}">${k}</span>`;

  function drawGrid() {
    const [y, m] = cur;
    monthLabel.textContent = `${MN[m]} ${y}`;
    prev.disabled = y === firstM[0] && m === firstM[1];
    next.disabled = y === lastM[0] && m === lastM[1];
    const marks = {};
    events.filter(match).forEach((e) => { (marks[e.d] = marks[e.d] || new Set()).add(e.k); });
    let h = ['Su','Mo','Tu','We','Th','Fr','Sa'].map((d) => `<span class="lp-tc-dow">${d}</span>`).join('');
    const offset = new Date(y, m, 1).getDay();
    for (let i = 0; i < offset; i++) h += '<span></span>';
    const days = new Date(y, m + 1, 0).getDate();
    for (let d = 1; d <= days; d++) {
      const id = iso(y, m, d), mk = marks[id];
      const cls = ['lp-tc-day', mk?.has('GST') ? 'has-gst' : '', mk?.has('TDS') ? 'has-tds' : '', id === today ? 'is-today' : '', id === sel && !q ? 'is-selected' : ''].filter(Boolean).join(' ');
      h += `<button type="button" class="${cls}" data-d="${id}" aria-label="${d} ${MN[m]} ${y}${mk ? ', ' + [...mk].join(' and ') + ' due' : ''}"${id === sel && !q ? ' aria-pressed="true"' : ''}>${d}</button>`;
    }
    grid.innerHTML = h;
  }
  function drawRows() {
    let evs, head;
    if (q) { evs = events.filter(match); head = `Search results for "${esc(q)}" (${evs.length})`; }
    else { evs = events.filter((e) => e.d === sel && match(e)); head = nice(sel); }
    title.innerHTML = head;
    rows.innerHTML = evs.length
      ? evs.map((e) => `<tr><td>${esc(e.t)}${q ? `<br><small>${nice(e.d)}</small>` : ''}</td><td>${tag(e.k)}</td><td>${esc(e.x)}</td></tr>`).join('')
      : '<tr><td colspan="3" class="lp-tc-empty">No GST or TDS due date on this day. Dates highlighted in the calendar have something due.</td></tr>';
  }
  function drawList() {
    const showPast = past && past.checked;
    items.forEach((el) => {
      const e = { k: el.dataset.kind, t: el.textContent, x: '' };
      el.classList.toggle('is-hidden', !(kind === 'all' || e.k === kind) || (q && !el.textContent.toLowerCase().includes(q)) || (!showPast && !q && el.dataset.date < today));
    });
    months.forEach((m) => m.classList.toggle('is-hidden', !m.querySelector('.lp-due-item:not(.is-hidden)')));
  }
  function render() {
    cal.hidden = view !== 'cal';
    list.hidden = view !== 'list';
    if (pastWrap) pastWrap.hidden = view !== 'list';
    views.forEach((v) => { const on = v.dataset.dueView === view; v.classList.toggle('is-active', on); v.setAttribute('aria-selected', String(on)); });
    if (view === 'cal') { drawGrid(); drawRows(); } else drawList();
  }
  grid.addEventListener('click', (e) => {
    const b = e.target.closest('.lp-tc-day'); if (!b) return;
    sel = b.dataset.d; if (search) search.value = ''; q = ''; render();
  });
  prev.addEventListener('click', () => { cur = cur[1] === 0 ? [cur[0] - 1, 11] : [cur[0], cur[1] - 1]; drawGrid(); });
  next.addEventListener('click', () => { cur = cur[1] === 11 ? [cur[0] + 1, 0] : [cur[0], cur[1] + 1]; drawGrid(); });
  filters.forEach((f) => f.addEventListener('click', () => { kind = f.dataset.dueFilter; filters.forEach((x) => x.classList.toggle('is-active', x === f)); render(); }));
  views.forEach((v) => v.addEventListener('click', () => { view = v.dataset.dueView; render(); }));
  past?.addEventListener('change', render);
  search?.addEventListener('input', () => { q = search.value.trim().toLowerCase(); render(); });
  render();
})();

/* Carry the chosen purpose and product to the enquiry form, like the main site does. */
document.addEventListener('click', (e) => {
  const a = e.target.closest('a[data-demo-purpose]');
  if (!a) return;
  try {
    sessionStorage.setItem('taxpower_demo_context', JSON.stringify({ purpose: a.getAttribute('data-demo-purpose'), product: a.getAttribute('data-demo-product') }));
  } catch (err) { /* storage can be blocked */ }
});

/* The tab you click stays open until you click another tab. */
(() => {
  const links = () => document.querySelector('.navbar-links');
  function pin(target) {
    document.querySelectorAll('.navbar-links .nav-item.is-pinned-open').forEach((el) => el.classList.remove('is-pinned-open'));
    if (target && !target.classList.contains('nav-item-always')) target.classList.add('is-pinned-open');
  }
  document.addEventListener('click', (event) => {
    const hit = event.target.closest('.navbar-links .nav-item, .navbar-links .nav-dropdown-link');
    if (!hit || !links()) return;
    pin(hit.matches('.nav-item') ? hit : hit.closest('.nav-dropdown')?.querySelector('.nav-item'));
  }, true);
  const start = () => {
    const cur = document.querySelector('.navbar-links .nav-item.h-current');
    if (cur && !document.querySelector('.navbar-links .is-pinned-open')) pin(cur);
  };
  start();
  const resourcePages = /\/(blog|gst-tds-due-dates|free-trial|system-requirements)(\/|\.html)?/;
  if (resourcePages.test(location.pathname)) pin(document.querySelector('.resources-nav-dropdown > .nav-item'));
})();

/* Back-to-top arrow. */
(() => {
  const btn = document.getElementById('backToTop');
  if (!btn) return;
  const lift = () => { if (document.getElementById('quickEnquiryRoot')) btn.classList.add('is-lifted'); };
  const update = () => { btn.hidden = window.scrollY < 480; lift(); };
  window.addEventListener('scroll', update, { passive: true });
  btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }));
  update();
})();

