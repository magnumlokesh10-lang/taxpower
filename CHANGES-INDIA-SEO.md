# India / Maharashtra SEO changes (working copy)

Original repo (magnumlokesh10-lang/taxpower.co) was NOT modified. This is a separate copy.

## What changed
- `scripts/seo-routes.json`: new titles + descriptions for all 11 routes (all-India targeting, Nagpur/Maharashtra as home base).
- `_site-source/index.html`: removed stale `github.io` canonical, old "#1 / 10,000+ businesses" description, meta keywords; lang `en-IN`; fixed "Filling" -> "Filing"; replaced "India's leading" with a factual phrase.
- `_site-source/taxpowergst.html`: descriptive alt text on 5 screenshots; "Filling" -> "Filing".
- `_site-source/aboutus.html` + `css/aboutus.css`: new short "Use TaxPower anywhere in India" band (Nagpur, Maharashtra home base, demo/price links). No state table.
- `scripts/build-section-routes.py`: Siddharth Enterprises schema is now Organization + LocalBusiness with areaServed India; WebSite inLanguage en-IN; SoftwareApplication gets description/subcategory; og:locale en_IN; aboutus.css cache-bust.
- Rebuilt with `python scripts/build-section-routes.py` (generated HTML, js/section-routes.js, sitemap.xml, robots.txt are build output).
- `CNAME` removed from this copy so a preview repo does not claim taxpower.co. Restore it (content: `taxpower.co`) when going live.

## Previewing without the domain
`<base href="/">` means the site must be served from a root. Use a GitHub *user* site repo named `<username>.github.io`, or run locally: `python -m http.server 8000` in this folder, then open http://localhost:8000/home. A project-page URL like user.github.io/repo/ will break asset paths.

## Not done (needs you)
- Google Business Profile, Search Console sitemap submit, reviews, backlinks (e.g. Magnum dealer listing).
- Original guides/blog content (needs accurate, current tax content from a CA/owner).
- The jsdom test suite (`tests/seo-routes.cjs`) could not be run here (npm registry blocked); equivalent checks were run with Python and a real Chromium screenshot.

## Previewing under a project-page path (github.io/<repo>/)
Build with `TAXPOWER_BASE_PATH=/<repo>/ python scripts/build-section-routes.py` (for example `/taxpower/`). Plain `python scripts/build-section-routes.py` builds for the domain root (`/`) and is what taxpower.co needs. Rebuild without the variable before going live on the domain.

## Vidarbha city pages and software guides
- `scripts/landing-pages.json`: all content for 1 Vidarbha hub, 11 district pages and 6 software guides. Edit text here, then run both build scripts (`python scripts/build-section-routes.py` then `python scripts/build-landing-pages.py`; use `TAXPOWER_BASE_PATH=/taxpower/` for the preview only).
- Standalone pages (own H1, schema, canonical, sitemap entry): `gst-tds-software-vidarbha`, `gst-tds-software-<district>`, `gst-return-filing-software`, `gstr-2b-itc-reconciliation-software`, `e-invoice-e-way-bill-software`, `gst-billing-software`, `tds-return-filing-software`, `form-16-form-16a-certificate-software`.
- Not in the top menu. Linked from the footer ("Serving Vidarbha", "Software guides"), the About page India band, and from each other.
- Only confirmed claims are used: Marathi/Hindi support, online demo and training, free trial (no number of days stated), Vidarbha authorization. Review the local-context paragraphs for each district and add real details (clients, local CA groups).
