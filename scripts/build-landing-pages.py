"""Build standalone Vidarbha city pages, the Vidarbha hub and software feature pages.
Content lives in scripts/landing-pages.json; shared header/footer come from nav.html and footer.html.
Run after scripts/build-section-routes.py (python scripts/build-landing-pages.py).
Set TAXPOWER_BASE_PATH=/repo-name/ to preview on a GitHub project page (default '/').
"""
from pathlib import Path
from html import escape as esc
import json, os
from urllib.parse import urlsplit
from lxml import html

ROOT = Path(__file__).resolve().parents[1]
BASE = 'https://taxpower.co/'
raw = os.environ.get('TAXPOWER_BASE_PATH', '/').strip('/')
BASE_PATH = '/' + raw + '/' if raw else '/'
data = json.loads((ROOT / 'scripts/landing-pages.json').read_text())
dealer, hub, cities, features = data['dealer'], data['hub'], data['cities'], data['features']
city_by_key = {c['slug'].replace('gst-tds-software-', ''): c for c in cities}
feature_by_slug = {f['slug']: f for f in features}
PHONES = ' · '.join(dealer['phones'])
CSS_V = '20261023-vidarbha'

organization = {'@type': ['Organization', 'LocalBusiness'], '@id': BASE + '#siddharth', 'name': 'Siddharth Enterprises',
    'description': 'Authorized TaxPower dealer in Nagpur, Maharashtra selling TaxPower GST, Billing and TDS software across India.',
    'areaServed': [{'@type': 'Country', 'name': 'India'}, {'@type': 'AdministrativeArea', 'name': 'Vidarbha, Maharashtra'}],
    'url': BASE + 'aboutus', 'logo': BASE + 'asset/swt_icon/siddharth-enterprises-logo.webp', 'email': dealer['email'],
    'telephone': ['+91' + p for p in dealer['phones']],
    'address': {'@type': 'PostalAddress', 'streetAddress': 'Plot No.14, Godawari Apartment, Amar Nagar Road, T-Point Hingna, Hingna MIDC',
                'addressLocality': 'Nagpur', 'addressRegion': 'Maharashtra', 'postalCode': '440016', 'addressCountry': 'IN'}}

# Same clean-route normalization the main build applies to shared navigation and footer links.
alias = {'index.html': 'home', 'taxpowergst.html': 'taxpowergst', 'taxpowertds.html': 'taxpowertds', 'pricing.html': 'pricing',
         'downloads.html': 'downloads', 'aboutus.html': 'aboutus', 'support.html': 'support'}
anchors = {'home': 'home', 'taxpowergst': 'taxpowergst', 'dashboard_bg': 'gst-return', 'gst-return': 'gst-return',
           'gst-billing-intro': 'gst-billing', 'gst-einvoice': 'gst-billing', 'taxpowertds': 'taxpowertds', 'pricing': 'pricing',
           'pricing-banner': 'pricing', 'downloads': 'downloads', 'downloads-banner': 'downloads', 'aboutus': 'aboutus',
           'support': 'support', 'technical-support': 'technical-support', 'demo-enquiry': 'demo-enquiry'}


def shared(xpath_root, source_file, selector):
    doc = html.fromstring((ROOT / source_file).read_text())
    nodes = doc.xpath(selector) if selector else [doc]
    out = []
    for node in nodes:
        for a in node.xpath('.//a[@href]'):
            u = urlsplit(a.get('href'))
            if u.scheme or u.netloc:
                continue
            if u.fragment in anchors and (not u.path or u.path in alias):
                a.set('href', anchors[u.fragment])
            elif u.path in alias and not u.fragment:
                a.set('href', alias[u.path])
        out.append(html.tostring(node, encoding='unicode', method='html'))
    return '\n'.join(out)


NAV = shared(None, 'nav.html', '//header | //button[@id="headerRevealHint"]')
FOOTER = shared(None, 'footer.html', None)


def li(items):
    return '<ul class="lp-bullets">' + ''.join(f'<li>{esc(i)}</li>' for i in items) + '</ul>'


def faq_block(items, title='Frequently asked questions'):
    rows = ''.join(f'<details><summary>{esc(q)}</summary><p>{esc(a)}</p></details>' for q, a in items)
    return f'<section class="lp-panel lp-faq" aria-labelledby="lp-faq-title"><h2 id="lp-faq-title">{esc(title)}</h2>{rows}</section>'


def contact_block(extra=''):
    phones = ' · '.join(f'<a href="tel:+91{p}">{p}</a>' for p in dealer['phones'])
    return (f'<section class="lp-panel lp-contact" aria-labelledby="lp-contact-title"><div><h2 id="lp-contact-title">Talk to Siddharth Enterprises</h2>'
            f'<p>Authorized TaxPower dealer for Vidarbha. Call for a demo, a free trial or a quotation.</p>{extra}</div>'
            f'<address><strong>Phone:</strong> {phones}<br><strong>Email:</strong> <a href="mailto:{dealer["email"]}">{dealer["email"]}</a><br>'
            f'<strong>Office:</strong> {esc(dealer["address"])}</address></section>')


def cta(product, label='Book a free demo'):
    return (f'<div class="lp-actions"><a class="lp-button" href="demo-enquiry" data-demo-purpose="Free Trial / Demo" data-demo-product="{esc(product)}">'
            f'{esc(label)} <span aria-hidden="true">↗</span></a><a class="lp-link" href="pricing">See TaxPower prices ↗</a></div>')


LANG_NOTE = ('<div class="lp-lang"><p lang="mr">TaxPower GST, TDS आणि बिलिंग सॉफ्टवेअरचा डेमो मराठी किंवा हिंदीत मिळवा.</p>'
             '<p lang="hi">TaxPower GST, TDS और बिलिंग सॉफ्टवेयर का डेमो हिंदी या मराठी में पाएं।</p></div>')
HIGHLIGHTS = '<ul class="lp-highlights"><li>Support in Marathi and Hindi</li><li>Online demo and training</li><li>Free trial available</li></ul>'


def breadcrumb(trail):
    parts = []
    for i, (name, href) in enumerate(trail):
        if href:
            parts.append(f'<a href="{href}">{esc(name)}</a>')
        else:
            parts.append(f'<span aria-current="page">{esc(name)}</span>')
    return '<nav class="lp-breadcrumb" aria-label="Breadcrumb">' + ' <span aria-hidden="true">›</span> '.join(parts) + '</nav>'


def chips(pairs):
    return '<ul class="lp-chips">' + ''.join(f'<li><a href="{h}">{esc(n)}</a></li>' for n, h in pairs) + '</ul>'


def guide_chips():
    return chips([(short_name(f), f['slug']) for f in features])


def short_name(f):
    return {'gst-return-filing-software': 'GST return filing', 'gstr-2b-itc-reconciliation-software': 'GSTR-2B ITC reconciliation',
            'e-invoice-e-way-bill-software': 'E-invoice & e-way bill', 'gst-billing-software': 'GST billing',
            'tds-return-filing-software': 'TDS return filing', 'form-16-form-16a-certificate-software': 'Form 16 & 16A'}[f['slug']]


def city_page(c):
    n = c['name']
    key = c['slug'].replace('gst-tds-software-', '')
    nearby = [(city_by_key[k]['name'], city_by_key[k]['slug']) for k in c['nearby']]
    towns = ', '.join(c['towns'][:-1]) + ' and ' + c['towns'][-1]
    faqs = [
        (c['faq_q'], c['faq_a']),
        (f'Who is the authorized TaxPower dealer in {n}?', f'Siddharth Enterprises, Nagpur is authorized by Magnum Infosystem, the developer of TaxPower, to sell TaxPower GST, Billing and TDS software across Vidarbha, including {n} district ({towns}).'),
        (f'Can I try TaxPower before buying in {n}?', 'Yes. A free trial is available. Book an online demo, tell us the work you do (GST returns, billing or TDS) and ask for the trial. Prices for installation and renewal are on the pricing page.'),
    ]
    body = (
        breadcrumb([('Home', 'home'), ('Vidarbha', hub['slug']), (n, None)]) +
        f'<section class="lp-panel lp-hero"><span class="lp-kicker">Authorized TaxPower dealer · {esc(c["division"])}</span>'
        f'<h1>GST &amp; TDS software in {esc(n)}</h1><p class="lp-lead">{esc(c["intro"])}</p>'
        + cta('TaxPower Software', f'Book a demo in {n}') + HIGHLIGHTS + LANG_NOTE + '</section>'
        f'<section class="lp-panel" aria-labelledby="lp-use-title"><h2 id="lp-use-title">TaxPower for {esc(n)} CAs and businesses</h2><p>{esc(c["context"])}</p>'
        '<div class="lp-grid">'
        f'<article class="lp-card"><h3>GST returns &amp; ITC</h3><p>{esc(c["gst"])}</p><a class="lp-more" href="gst-return-filing-software">GST return filing software ↗</a></article>'
        f'<article class="lp-card"><h3>Billing, e-invoice &amp; e-way bill</h3><p>{esc(c["billing"])}</p><a class="lp-more" href="e-invoice-e-way-bill-software">E-invoice and e-way bill software ↗</a></article>'
        f'<article class="lp-card"><h3>TDS returns &amp; certificates</h3><p>{esc(c["tds"])}</p><a class="lp-more" href="tds-return-filing-software">TDS return filing software ↗</a></article>'
        '</div></section>'
        f'<section class="lp-panel" aria-labelledby="lp-how-title"><h2 id="lp-how-title">How buying TaxPower works in {esc(n)}</h2>'
        '<ol class="lp-bullets"><li><strong>Book a demo.</strong> We show the software online, using the kind of work you do.</li>'
        '<li><strong>Try it.</strong> A free trial is available on request.</li>'
        '<li><strong>Get set up and trained.</strong> Installation help and training are online, in Marathi or Hindi.</li>'
        '<li><strong>Stay supported.</strong> Call for help with updates, licensing and renewals.</li></ol>'
        '<div class="lp-actions"><a class="lp-link" href="pricing">See TaxPower prices ↗</a><a class="lp-link" href="downloads">Downloads ↗</a></div></section>'
        + faq_block(faqs, f'TaxPower in {n}: common questions') +
        f'<section class="lp-panel" aria-labelledby="lp-near-title"><h2 id="lp-near-title">Also serving nearby Vidarbha districts</h2>'
        + chips(nearby + [('All Vidarbha', hub['slug'])]) +
        '<p style="margin-top:16px">Outside Vidarbha? We sell TaxPower across India. Send an enquiry from any state and we will arrange an online demo.</p></section>'
        + contact_block())
    meta = {'title': f'GST & TDS Software in {n} | TaxPower Dealer, Vidarbha',
            'description': f'Buy TaxPower GST, Billing and TDS software in {n}, Vidarbha from authorized dealer Siddharth Enterprises. Marathi and Hindi support, online demo, free trial.'}
    return body, meta, faqs, [('Home', 'home'), ('Vidarbha', hub['slug']), (n, c['slug'])], {
        '@type': 'Service', 'serviceType': 'GST, Billing and TDS software sales, demo and support',
        'name': f'TaxPower GST & TDS software in {n}', 'provider': {'@id': BASE + '#siddharth'},
        'areaServed': {'@type': 'AdministrativeArea', 'name': f'{n} district, Maharashtra'}}


def hub_page():
    div_html = ''
    for division in ['Nagpur division', 'Amravati division']:
        members = [c for c in cities if c['division'] == division]
        div_html += f'<div class="lp-division"><h3>{division}</h3>' + chips([(c['name'], c['slug']) for c in members]) + '</div>'
    body = (
        breadcrumb([('Home', 'home'), ('Vidarbha', None)]) +
        f'<section class="lp-panel lp-hero"><span class="lp-kicker">Authorized TaxPower dealer · Vidarbha</span><h1>{esc(hub["h1"])}</h1>'
        f'<p class="lp-lead">{esc(hub["lead"])}</p>' + cta('TaxPower Software', 'Book a demo in Vidarbha') + HIGHLIGHTS + LANG_NOTE + '</section>'
        f'<section class="lp-panel" aria-labelledby="lp-services-title"><h2 id="lp-services-title">{esc(hub["services_title"])}</h2><div class="lp-grid">'
        '<article class="lp-card"><h3>Marathi and Hindi support</h3><p>Ask questions, get training and request support in the language you work in, by phone or online.</p></article>'
        '<article class="lp-card"><h3>Online demo and training</h3><p>We show TaxPower GST, Billing and TDS online and train your team remotely, so district distance does not matter.</p></article>'
        '<article class="lp-card"><h3>Free trial</h3><p>Ask for a free trial when you book the demo. Installation, renewal and bundle prices are on the pricing page.</p></article>'
        '</div></section>'
        '<section class="lp-panel" aria-labelledby="lp-districts-title"><h2 id="lp-districts-title">TaxPower software in your district</h2>'
        '<p>Choose your district for details on how GST, billing and TDS software is sold and supported where you work.</p>' + div_html + '</section>'
        '<section class="lp-panel" aria-labelledby="lp-products-title"><h2 id="lp-products-title">What you can do with TaxPower</h2>'
        + guide_chips() + '</section>'
        f'<section class="lp-panel" aria-labelledby="lp-outside-title"><h2 id="lp-outside-title">{esc(hub["outside_title"])}</h2><p>{esc(hub["outside"])}</p></section>'
        + contact_block())
    faqs = []
    meta = {'title': hub['title'], 'description': hub['description']}
    return body, meta, faqs, [('Home', 'home'), ('Vidarbha', hub['slug'])], {
        '@type': 'Service', 'serviceType': 'GST, Billing and TDS software sales, demo and support', 'name': 'TaxPower GST & TDS software in Vidarbha',
        'provider': {'@id': BASE + '#siddharth'}, 'areaServed': {'@type': 'AdministrativeArea', 'name': 'Vidarbha, Maharashtra'}}


def feature_page(f):
    sections = ''
    for s in f['sections']:
        sections += f'<div class="lp-section"><h2>{esc(s["h"])}</h2><p>{esc(s["p"])}</p>' + (li(s['bullets']) if s.get('bullets') else '') + '</div>'
    related = chips([(short_name(feature_by_slug[r]), r) for r in f['related']])
    faqs = [(x['q'], x['a']) for x in f['faq']]
    body = (
        breadcrumb([('Home', 'home'), (short_name(f), None)]) +
        f'<section class="lp-panel lp-hero"><span class="lp-kicker">{esc(f["kicker"])}</span><h1>{esc(f["h1"])}</h1><p class="lp-lead">{esc(f["lead"])}</p>'
        + cta(f['product']) + HIGHLIGHTS + '</section>'
        f'<section class="lp-panel">{sections}</section>'
        + faq_block(faqs) +
        '<section class="lp-panel" aria-labelledby="lp-rel-title"><h2 id="lp-rel-title">Related TaxPower guides</h2>' + related +
        '<p style="margin-top:16px">Buying in Maharashtra? See <a href="' + hub['slug'] + '">TaxPower for Vidarbha</a>: Nagpur, Amravati, Akola, Chandrapur and every other district.</p></section>'
        + contact_block())
    meta = {'title': f['title'], 'description': f['description']}
    app_name = {'TaxPower GST Return': 'TaxPower GST', 'TaxPower Billing': 'TaxPower GST Billing', 'TaxPower TDS': 'TaxPower TDS'}[f['product']]
    return body, meta, faqs, [('Home', 'home'), (short_name(f), f['slug'])], {
        '@type': 'SoftwareApplication', 'name': app_name, 'applicationCategory': 'BusinessApplication',
        'applicationSubCategory': 'GST and TDS compliance software', 'operatingSystem': 'Windows', 'description': f['description'],
        'url': BASE + f['slug'], 'publisher': {'@id': BASE + '#magnum'}}


def render(slug, body, meta, trail, extra):
    canonical = BASE + slug
    graph = [organization,
             {'@type': 'Organization', '@id': BASE + '#magnum', 'name': 'Magnum Infosystem Pvt. Ltd.', 'url': 'https://www.magnuminfosystem.com/Default'},
             {'@type': 'WebSite', '@id': BASE + '#website', 'url': BASE + 'home', 'name': 'TaxPower', 'inLanguage': 'en-IN', 'publisher': {'@id': BASE + '#siddharth'}},
             {'@type': 'WebPage', '@id': canonical + '#webpage', 'url': canonical, 'name': meta['title'], 'description': meta['description'],
              'isPartOf': {'@id': BASE + '#website'}, 'publisher': {'@id': BASE + '#siddharth'}, 'inLanguage': 'en-IN'},
             {'@type': 'BreadcrumbList', 'itemListElement': [{'@type': 'ListItem', 'position': i + 1, 'name': name, 'item': BASE + href} for i, (name, href) in enumerate(trail)]},
             extra]
    ld = json.dumps({'@context': 'https://schema.org', '@graph': graph}, ensure_ascii=False)
    t, d = esc(meta['title']), esc(meta['description'], quote=True)
    return f'''<!DOCTYPE html>
<html lang="en-IN">
<head>
<base href="{BASE_PATH}">
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{t}</title>
<link rel="canonical" href="{canonical}">
<meta name="description" content="{d}">
<meta name="robots" content="index, follow, max-image-preview:large">
<link rel="icon" type="image/x-icon" href="asset/swt_icon/taxpower_icon.png">
<meta property="og:title" content="{t}">
<meta property="og:description" content="{d}">
<meta property="og:url" content="{canonical}">
<meta property="og:type" content="website">
<meta property="og:locale" content="en_IN">
<meta property="og:site_name" content="TaxPower">
<meta property="og:image" content="{BASE}asset/swt_icon/taxpower_icon.png">
<meta name="twitter:card" content="summary">
<meta name="twitter:title" content="{t}">
<meta name="twitter:description" content="{d}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=DM+Sans:wght@400;500;600&display=swap">
<link rel="stylesheet" href="css/stylesheet.css?v={CSS_V}">
<link rel="stylesheet" href="css/company-logos.css?v=20260924-logo-branding">
<link rel="stylesheet" href="css/landing.css?v={CSS_V}">
<script type="application/ld+json" id="site-structured-data" data-route="{slug}">{ld}</script>
</head>
<body>
<div class="global-site-bg site-grid-background" data-site-background aria-hidden="true"><div class="grid-blueprint"></div><div class="grid-squares-layer" data-site-background-squares></div></div>
{NAV}
<main class="lp" id="main">
{body}
</main>
{FOOTER}
<script src="js/landing.js?v={CSS_V}" defer></script>
</body>
</html>
'''


pages = [(hub['slug'],) + hub_page()] + [(c['slug'],) + city_page(c) for c in cities] + [(f['slug'],) + feature_page(f) for f in features]
for slug, body, meta, faqs, trail, extra in pages:
    out = render(slug, body, meta, trail, extra)
    for filename in (f'{slug}.html', f'{slug}/index.html'):
        path = ROOT / filename
        path.parent.mkdir(exist_ok=True)
        path.write_text('\n'.join(line.rstrip() for line in out.splitlines()) + '\n')
print('Built', len(pages), 'standalone landing pages.')
