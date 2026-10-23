/* Clean section URLs; real directory entry pages keep refreshes working on Pages. */
(() => {
  const base = new URL('../', document.currentScript.src);
  let baseElement = document.querySelector('base');
  if (!baseElement) { baseElement = document.createElement('base'); document.head.prepend(baseElement); }
  baseElement.href = base.href;
  const routes = {
    home: 'home', taxpowergst: 'taxpowergst', dashboard_bg: 'gst-return',
    'gst-return': 'gst-return', 'gst-billing-intro': 'gst-billing', 'gst-einvoice': 'gst-billing',
    taxpowertds: 'taxpowertds', pricing: 'pricing', 'pricing-banner': 'pricing',
    downloads: 'downloads', 'downloads-banner': 'downloads', aboutus: 'aboutus',
    support: 'support', 'technical-support': 'technical-support', 'demo-enquiry': 'demo-enquiry'
  };
  const sections = {'': 'home', home: 'home', taxpowergst: 'taxpowergst', 'gst-return': 'dashboard_bg',
    'gst-billing': 'gst-billing-intro', taxpowertds: 'taxpowertds', pricing: 'pricing-banner',
    downloads: 'downloads', aboutus: 'aboutus', support: 'support',
    'technical-support': 'technical-support', 'demo-enquiry': 'demo-enquiry'};
  const titles = {
  "home": "TaxPower GST & TDS Software for CAs & Businesses in India",
  "taxpowergst": "TaxPower GST | GST Return Filing & ITC Reconciliation Software",
  "gst-return": "GST Return Filing Dashboard & Status Tracker | TaxPower GST",
  "gst-billing": "E-Invoice & E-Way Bill Software with GST Billing | TaxPower",
  "taxpowertds": "TDS Return Filing Software: 24Q, 26Q, 27Q, 27EQ | TaxPower TDS",
  "pricing": "TaxPower GST & TDS Software Price | Installation & Renewal",
  "downloads": "Download TaxPower GST, TDS & MVAT Software Setup",
  "aboutus": "TaxPower Dealer in Nagpur, Maharashtra | Siddharth Enterprises",
  "support": "TaxPower Support & Demo Booking | Siddharth Enterprises",
  "technical-support": "TaxPower Technical Support | Installation, Updates & Licensing",
  "demo-enquiry": "Book a TaxPower Demo | GST, Billing & TDS Software"
};
  const routeMetadata = {
  "home": {
    "section": "home",
    "title": "TaxPower GST & TDS Software for CAs & Businesses in India",
    "description": "GST return filing, e-invoice, e-way bill and TDS software for CAs and businesses across India. Authorized TaxPower dealer in Nagpur, Maharashtra. Book a demo."
  },
  "taxpowergst": {
    "section": "taxpowergst",
    "title": "TaxPower GST | GST Return Filing & ITC Reconciliation Software",
    "description": "Prepare and upload GST returns, reconcile GSTR-2A/2B ITC and track filing status for multiple GSTINs. Desktop GST software sold across India. Book a free demo."
  },
  "gst-return": {
    "section": "taxpowergst",
    "canonical": "taxpowergst",
    "title": "GST Return Filing Dashboard & Status Tracker | TaxPower GST",
    "description": "Track GST return status, ARN and filing dates for all dealers in one dashboard. Download GSTR-1, 2A and 2B data in one click. Request a guided demo."
  },
  "gst-billing": {
    "section": "taxpowergst",
    "heading": "gst-billing-intro-title",
    "title": "E-Invoice & E-Way Bill Software with GST Billing | TaxPower",
    "description": "Generate e-invoices and e-way bills in bulk with IRN and Excel integration from one GST billing workspace. Desktop software sold across India. Book a demo."
  },
  "taxpowertds": {
    "section": "taxpowertds",
    "title": "TDS Return Filing Software: 24Q, 26Q, 27Q, 27EQ | TaxPower TDS",
    "description": "Prepare TDS and TCS returns, validate PAN and FVU files, manage challans, work with TRACES and email Form 16/16A certificates. Book a free software demo."
  },
  "pricing": {
    "section": "pricing",
    "title": "TaxPower GST & TDS Software Price | Installation & Renewal",
    "description": "Professional and Business edition prices for TaxPower GST, Billing and TDS: installation fee, annual renewal and bundle savings. Request a quotation."
  },
  "downloads": {
    "section": "downloads",
    "title": "Download TaxPower GST, TDS & MVAT Software Setup",
    "description": "Download TaxPower GST, TDS and MVAT setup files and supporting utilities. Contact Siddharth Enterprises for installation help and software support."
  },
  "aboutus": {
    "section": "aboutus",
    "title": "TaxPower Dealer in Nagpur, Maharashtra | Siddharth Enterprises",
    "description": "Siddharth Enterprises, authorized TaxPower dealer in Nagpur, sells GST, Billing and TDS software across India. Meet Magnum Infosystem, the software developer."
  },
  "support": {
    "section": "support",
    "title": "TaxPower Support & Demo Booking | Siddharth Enterprises",
    "description": "Get help with TaxPower GST, Billing and TDS demos, installation, software queries and renewals from anywhere in India. Request a callback."
  },
  "technical-support": {
    "section": "support",
    "canonical": "support",
    "title": "TaxPower Technical Support | Installation, Updates & Licensing",
    "description": "Contact the TaxPower support team for installation, updates, licensing and software queries. Keep your customer ID, product version and error details ready."
  },
  "demo-enquiry": {
    "section": "support",
    "canonical": "support",
    "title": "Book a TaxPower Demo | GST, Billing & TDS Software",
    "description": "Request a TaxPower GST, Billing or TDS software demo, quotation or sales callback from Siddharth Enterprises. Select the products that fit your work."
  }
};
  function updateTitle() {
    const hash = hashForURL(location.href);
    const route = routes[hash.slice(1)];
    if (route === undefined) return;
    document.title = titles[route];
    const meta = routeMetadata[route];
    const canonical = 'https://taxpower.co/' + (meta.canonical || route);
    document.querySelector('meta[name="description"]')?.setAttribute('content', meta.description);
    document.querySelector('link[rel="canonical"]')?.setAttribute('href', canonical);
    for (const [property, value] of Object.entries({'og:title': titles[route], 'og:description': meta.description, 'og:url': canonical})) {
      document.querySelector('meta[property="' + property + '"]')?.setAttribute('content', value);
    }
    for (const [name, value] of Object.entries({'twitter:title': titles[route], 'twitter:description': meta.description})) {
      document.querySelector('meta[name="' + name + '"]')?.setAttribute('content', value);
    }
    // Keep one semantic primary heading as visitors navigate the same visual page.
    const primary = document.getElementById(meta.section);
    if (!primary) return;
    function retag(node, tag) {
      if (node.tagName.toLowerCase() === tag) return node;
      const replacement = document.createElement(tag);
      for (const attribute of node.attributes) replacement.setAttribute(attribute.name, attribute.value);
      replacement.append(...node.childNodes); node.replaceWith(replacement); return replacement;
    }
    const heading = meta.heading ? document.getElementById(meta.heading) : primary.querySelector('[data-page-heading]');
    document.querySelectorAll('h1').forEach(node => { if (node !== heading) retag(node, 'h2'); });
    if (heading) {
      const h = retag(heading, 'h1');
      if (!h.id) h.id = 'page-heading-' + meta.section;
      primary.setAttribute('aria-labelledby', h.id);
    }
    // Use landmarks without replacing section containers or losing event listeners.
    document.querySelectorAll('[data-route-section]').forEach(node => {
      node.setAttribute('role', node.id === meta.section ? 'main' : 'region');
    });
    const schema = document.getElementById('site-structured-data');
    if (schema && schema.dataset.route !== route) {
      const data = JSON.parse(schema.textContent);
      data['@graph'] = data['@graph'].filter(item => !['WebPage','ContactPage','AboutPage','BreadcrumbList','SoftwareApplication','ItemList'].includes(item['@type']));
      data['@graph'].push({'@type': meta.section === 'support' ? 'ContactPage' : route === 'aboutus' ? 'AboutPage' : 'WebPage', '@id': canonical + '#webpage', url: canonical, name: titles[route], description: meta.description, isPartOf: {'@id': 'https://taxpower.co/#website'}});
      schema.textContent = JSON.stringify(data);
      schema.dataset.route = route;
    }
  }
  window.addEventListener('popstate', updateTitle);
  window.addEventListener('hashchange', updateTitle);
  function hashForURL(value) {
    const url = new URL(value, base);
    if (url.origin !== base.origin || !url.pathname.startsWith(base.pathname)) return '';
    let path = url.pathname.slice(base.pathname.length).replace(/\/$/, '');
    if (path.endsWith('.html') && Object.hasOwn(sections, path.slice(0, -5))) path = path.slice(0, -5);
    if (url.hash && (path === '' || path === 'index.html' || Object.hasOwn(sections, path))) {
      return Object.hasOwn(routes, url.hash.slice(1)) ? url.hash : '';
    }
    if (path === 'index.html') return '#home';
    return Object.hasOwn(sections, path) ? '#' + sections[path] : '';
  }
  function urlFor(hash) {
    const route = routes[hash.replace(/^#/, '')];
    return route === undefined ? null : new URL(route, base);
  }
  function write(hash, replace = false) {
    const url = urlFor(hash);
    if (!url) return;
    url.search = location.search;
    if (url.href !== location.href) history[replace ? 'replaceState' : 'pushState'](null, '', url);
    updateTitle();
  }
  function cleanLinks() {
    document.querySelectorAll('a[href]').forEach(link => {
      if (link.getAttribute('href') === '#') return;
      const hash = hashForURL(link.href);
      if (!hash) return;
      const url = urlFor(hash);
      url.search = new URL(link.href).search;
      link.href = url.href;
    });
  }
  window.TaxPowerRoutes = {hash: () => hashForURL(location.href), hashForURL, urlFor, write, cleanLinks};
  function ready() {
    if (document.querySelector('[data-page-sections]')) {
      const hash = hashForURL(location.href);
      if (hash) write(hash, true);
    }
    updateTitle();
    cleanLinks();
  }
  document.addEventListener('DOMContentLoaded', ready);
  ['taxpower:navigation-loaded', 'taxpower:sections-loaded', 'taxpower:footer-loaded'].forEach(name =>
    document.addEventListener(name, cleanLinks));
})();
