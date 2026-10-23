# India / Maharashtra SEO changes (working copy)

Original repo (magnumlokesh10-lang/taxpower.co) was NOT modified. This is a separate copy.

## What changed
- `scripts/seo-routes.json`: new titles + descriptions for all 11 routes (all-India targeting, Nagpur/Maharashtra as home base).
- `_site-source/index.html`: removed stale `github.io` canonical, old "#1 / 10,000+ businesses" description, meta keywords; lang `en-IN`; fixed "Filling" -> "Filing"; replaced "India's leading" with a factual phrase.
- `_site-source/taxpowergst.html`: descriptive alt text on 5 screenshots; "Filling" -> "Filing".
- `_site-source/aboutus.html` + `css/aboutus.css`: new "GST & TDS software for every state in India" section (Maharashtra home-state card, 36 states/UTs with GST codes, demo/price links). The state list was checked against the enquiry form's list at edit time.
- `scripts/build-section-routes.py`: Siddharth Enterprises schema is now Organization + LocalBusiness with areaServed India; WebSite inLanguage en-IN; SoftwareApplication gets description/subcategory; og:locale en_IN; aboutus.css cache-bust.
- Rebuilt with `python scripts/build-section-routes.py` (generated HTML, js/section-routes.js, sitemap.xml, robots.txt are build output).
- `CNAME` removed from this copy so a preview repo does not claim taxpower.co. Restore it (content: `taxpower.co`) when going live.

## Previewing without the domain
`<base href="/">` means the site must be served from a root. Use a GitHub *user* site repo named `<username>.github.io`, or run locally: `python -m http.server 8000` in this folder, then open http://localhost:8000/home. A project-page URL like user.github.io/repo/ will break asset paths.

## Not done (needs you)
- Google Business Profile, Search Console sitemap submit, reviews, backlinks (e.g. Magnum dealer listing).
- Original guides/blog content (needs accurate, current tax content from a CA/owner).
- The jsdom test suite (`tests/seo-routes.cjs`) could not be run here (npm registry blocked); equivalent checks were run with Python and a real Chromium screenshot.
