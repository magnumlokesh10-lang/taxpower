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


HIGHLIGHTS = '<ul class="lp-highlights"><li>Demo &amp; support in Hindi, Marathi or English</li><li>Online demo and training</li><li>Free trial available</li></ul>'


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
        + cta('TaxPower Software', f'Book a demo in {n}') + HIGHLIGHTS + '</section>'
        f'<section class="lp-panel" aria-labelledby="lp-use-title"><h2 id="lp-use-title">TaxPower for {esc(n)} CAs and businesses</h2><p>{esc(c["context"])}</p>'
        '<div class="lp-grid">'
        f'<article class="lp-card"><h3>GST returns &amp; ITC</h3><p>{esc(c["gst"])}</p><a class="lp-more" href="gst-return-filing-software">GST return filing software ↗</a></article>'
        f'<article class="lp-card"><h3>Billing, e-invoice &amp; e-way bill</h3><p>{esc(c["billing"])}</p><a class="lp-more" href="e-invoice-e-way-bill-software">E-invoice and e-way bill software ↗</a></article>'
        f'<article class="lp-card"><h3>TDS returns &amp; certificates</h3><p>{esc(c["tds"])}</p><a class="lp-more" href="tds-return-filing-software">TDS return filing software ↗</a></article>'
        '</div></section>'
        f'<section class="lp-panel" aria-labelledby="lp-how-title"><h2 id="lp-how-title">How buying TaxPower works in {esc(n)}</h2>'
        '<ol class="lp-bullets"><li><strong>Book a demo.</strong> We show the software online, using the kind of work you do.</li>'
        '<li><strong>Try it.</strong> A free trial is available on request.</li>'
        '<li><strong>Get set up and trained.</strong> Installation help and training are online, in Hindi, Marathi or English.</li>'
        '<li><strong>Stay supported.</strong> Call for help with updates, licensing and renewals.</li></ol>'
        '<div class="lp-actions"><a class="lp-link" href="pricing">See TaxPower prices ↗</a><a class="lp-link" href="downloads">Downloads ↗</a></div></section>'
        + faq_block(faqs, f'TaxPower in {n}: common questions') +
        f'<section class="lp-panel" aria-labelledby="lp-near-title"><h2 id="lp-near-title">Also serving nearby Vidarbha districts</h2>'
        + chips(nearby + [('All Vidarbha', hub['slug'])]) +
        '<p style="margin-top:16px">Outside Vidarbha? We sell TaxPower across India. Send an enquiry from any state and we will arrange an online demo.</p></section>'
        + contact_block())
    meta = {'title': f'GST & TDS Software in {n} | TaxPower Dealer, Vidarbha',
            'description': f'Buy TaxPower GST, Billing and TDS software in {n}, Vidarbha from authorized dealer Siddharth Enterprises. Hindi, Marathi and English support, online demo, free trial.'}
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
        f'<p class="lp-lead">{esc(hub["lead"])}</p>' + cta('TaxPower Software', 'Book a demo in Vidarbha') + HIGHLIGHTS + '</section>'
        f'<section class="lp-panel" aria-labelledby="lp-services-title"><h2 id="lp-services-title">{esc(hub["services_title"])}</h2><div class="lp-grid">'
        '<article class="lp-card"><h3>Hindi, Marathi and English support</h3><p>Ask questions, get training and request support in Hindi, Marathi or English, whichever you are comfortable with, by phone or online.</p></article>'
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



# ---------------------------------------------------------------- resource pages (trial, requirements, blog, due dates)
import datetime as dt
res = json.loads((ROOT / 'scripts/resource-pages.json').read_text())
PUBLISHED = res['published']
posts_by_slug = {x['slug']: x for x in res['posts']}
RES_LINKS = [('Free trial', 'free-trial'), ('System requirements', 'system-requirements'), ('GST & TDS due dates', 'gst-tds-due-dates'), ('Blog', 'blog')]
NICE = {s_: short_name(f) for s_, f in feature_by_slug.items()}


def nice_date(iso):
    d = dt.date.fromisoformat(iso)
    return f'{d.day} {d.strftime("%B %Y")}'


def table_html(head, rows):
    th = ''.join(f'<th scope="col">{esc(h)}</th>' for h in head)
    tr = ''.join('<tr>' + ''.join(f'<td>{esc(c)}</td>' for c in r) + '</tr>' for r in rows)
    return f'<div class="lp-table-wrap"><table class="lp-table"><thead><tr>{th}</tr></thead><tbody>{tr}</tbody></table></div>'


def blocks_html(blocks):
    out, buf = [], []

    def flush():
        if buf:
            out.append('<section class="lp-panel lp-section">' + ''.join(buf) + '</section>')
            buf.clear()
    for b in blocks:
        t = b['t']
        if t == 'h2':
            buf.append(f'<h2>{esc(b["v"])}</h2>')
        elif t == 'p':
            buf.append(f'<p>{esc(b["v"])}</p>')
        elif t == 'list':
            buf.append(li(b['v']))
        elif t == 'steps':
            buf.append('<ol class="lp-bullets">' + ''.join(f'<li>{esc(i)}</li>' for i in b['v']) + '</ol>')
        elif t == 'table':
            buf.append(table_html(b['head'], b['rows']))
        elif t == 'note':
            buf.append(f'<div class="lp-lang"><p>{esc(b["v"])}</p></div>')
        elif t == 'faq':
            flush()
            out.append(faq_block([(x['q'], x['a']) for x in b['v']]))
        elif t == 'links':
            buf.append(chips([(n, h) for n, h in b['v']]))
    flush()
    return ''.join(out)


def resources_panel():
    return '<section class="lp-panel" aria-labelledby="lp-res-title"><h2 id="lp-res-title">More from TaxPower</h2>' + chips(RES_LINKS) + '</section>'


def static_page(pg):
    body = (breadcrumb([('Home', 'home'), (pg['h1'].split(':')[0], None)]) +
            f'<section class="lp-panel lp-hero"><span class="lp-kicker">{esc(pg["kicker"])}</span><h1>{esc(pg["h1"])}</h1><p class="lp-lead">{esc(pg["lead"])}</p>'
            + cta(pg['product'], pg['cta_label']) + HIGHLIGHTS + '</section>' + blocks_html(pg['blocks']) + contact_block())
    faqs = []
    return body, {'title': pg['title'], 'description': pg['description']}, [('Home', 'home'), (pg['h1'], pg['slug'])], {
        '@type': 'WebPage', '@id': BASE + pg['slug'] + '#page', 'url': BASE + pg['slug']}


def post_cards():
    cards = ''
    for x in res['posts']:
        cards += (f'<article class="lp-card"><span class="lp-tag">{esc(x["category"])} · {x["minutes"]} min read</span><h3><a href="{x["slug"]}">{esc(x["h1"])}</a></h3>'
                  f'<p>{esc(x["summary"])}</p><a class="lp-more" href="{x["slug"]}">Read the guide ↗</a></article>')
    return cards


def blog_index(pg):
    body = (breadcrumb([('Home', 'home'), ('Blog', None)]) +
            f'<section class="lp-panel lp-hero"><span class="lp-kicker">{esc(pg["kicker"])}</span><h1>{esc(pg["h1"])}</h1><p class="lp-lead">{esc(pg["lead"])}</p></section>'
            f'<section class="lp-panel" aria-labelledby="lp-posts-title"><h2 id="lp-posts-title">Latest guides</h2><div class="lp-grid">{post_cards()}</div></section>'
            + resources_panel() + contact_block())
    return body, {'title': pg['title'], 'description': pg['description']}, [('Home', 'home'), ('Blog', 'blog')], {
        '@type': 'Blog', '@id': BASE + 'blog#blog', 'name': 'TaxPower blog', 'url': BASE + 'blog', 'publisher': {'@id': BASE + '#siddharth'},
        'blogPost': [{'@type': 'BlogPosting', 'headline': x['h1'], 'url': BASE + x['slug'], 'datePublished': PUBLISHED} for x in res['posts']]}


def post_page(x):
    related = []
    for r in x['related']:
        if r in posts_by_slug:
            related.append((posts_by_slug[r]['h1'].split(':')[0], r))
        elif r in feature_by_slug:
            related.append((NICE[r] + ' software', r))
        elif r == 'free-trial':
            related.append(('Free 30-day trial', r))
    body = (breadcrumb([('Home', 'home'), ('Blog', 'blog'), (x['h1'].split(':')[0], None)]) +
            f'<section class="lp-panel lp-hero"><span class="lp-kicker">{esc(x["category"])} · GUIDE</span><h1>{esc(x["h1"])}</h1>'
            f'<p class="lp-meta">By Siddharth Enterprises · Published {nice_date(PUBLISHED)} · Last updated {nice_date(PUBLISHED)} · {x["minutes"]} min read</p>'
            f'<p class="lp-lead">{esc(x["summary"])}</p></section>' + blocks_html(x['blocks']) +
            '<section class="lp-panel"><h2>Check before you act</h2><p>Tax rules, forms and due dates change often and may be extended by notification. Use this guide as a starting point and confirm the current position on the official portals, <a href="https://www.gst.gov.in" rel="noopener">gst.gov.in</a> for GST and <a href="https://www.incometax.gov.in" rel="noopener">incometax.gov.in</a> for TDS, or with your CA.</p></section>'
            '<section class="lp-panel lp-hero"><h2>Try TaxPower free for 30 days</h2><p>See these workflows on your own work. Installation help and training are available in Hindi, Marathi or English.</p>'
            + cta('TaxPower Software', 'Request free trial') + '</section>'
            '<section class="lp-panel"><h2>Related</h2>' + chips(related + [('All guides', 'blog')]) + '</section>' + contact_block())
    return body, {'title': x['title'], 'description': x['description']}, [('Home', 'home'), ('Blog', 'blog'), (x['h1'], x['slug'])], {
        '@type': 'BlogPosting', '@id': BASE + x['slug'] + '#article', 'headline': x['h1'], 'description': x['description'], 'url': BASE + x['slug'],
        'mainEntityOfPage': BASE + x['slug'], 'datePublished': PUBLISHED, 'dateModified': PUBLISHED, 'inLanguage': 'en-IN',
        'author': {'@id': BASE + '#siddharth'}, 'publisher': {'@id': BASE + '#siddharth'}, 'image': BASE + 'asset/swt_icon/taxpower_icon.png'}


# ---- due-date calendar, FY 2026-27 (standard statutory dates; extensions are notified separately)
MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
Q_AFTER = {4: 'January–March', 7: 'April–June', 10: 'July–September', 1: 'October–December'}
IFF_MONTHS = {5, 6, 8, 9, 11, 12, 2, 3}


def due_events():
    ev = []

    def add(y, m, d, kind, title, desc):
        ev.append((dt.date(y, m, d), kind, title, desc))
    for y, m in [(2026, k) for k in range(4, 13)] + [(2027, k) for k in range(1, 4)]:
        prev_i = (m - 2) % 12
        prev = MONTHS[prev_i] + (' ' + str(y if m > 1 else y - 1))
        if m == 4:
            add(y, m, 7, 'TDS', 'TCS deposit for March', 'Deposit of tax collected at source in March (challan ITNS 281).')
            add(y, m, 30, 'TDS', 'TDS deposit for March', 'Deposit of tax deducted in March, other than by government offices.')
        else:
            add(y, m, 7, 'TDS', f'TDS and TCS deposit for {MONTHS[prev_i]}', 'Deposit of tax deducted or collected in the previous month (challan ITNS 281).')
        add(y, m, 10, 'GST', 'GSTR-7 and GSTR-8', f'GST TDS and e-commerce TCS returns for {prev}.')
        add(y, m, 11, 'GST', 'GSTR-1 (monthly filers)', f'Outward supplies for {prev}.')
        if m in Q_AFTER:
            qy = y if m != 1 else y - 1
            add(y, m, 13, 'GST', 'GSTR-1 (QRMP quarterly filers)', f'Outward supplies for {Q_AFTER[m]} {qy if m != 4 else y}.')
            add(y, m, 18, 'GST', 'CMP-08 (composition taxpayers)', f'Quarterly payment statement for {Q_AFTER[m]}.')
            add(y, m, 22, 'GST', 'GSTR-3B (QRMP, 22nd-category states)', f'Quarterly return for {Q_AFTER[m]}. Includes Maharashtra, Madhya Pradesh, Chhattisgarh, Gujarat, Karnataka, Goa, Kerala, Tamil Nadu, Telangana and Andhra Pradesh.')
            add(y, m, 24, 'GST', 'GSTR-3B (QRMP, 24th-category states)', f'Quarterly return for {Q_AFTER[m]} for the remaining states and union territories, such as Delhi, Uttar Pradesh and Rajasthan.')
        if m in IFF_MONTHS:
            add(y, m, 13, 'GST', 'IFF (optional, QRMP filers)', f'Invoice furnishing facility for B2B invoices of {MONTHS[prev_i]}.')
            add(y, m, 25, 'GST', 'PMT-06 (QRMP monthly tax payment)', f'Tax payment for {MONTHS[prev_i]}.')
        add(y, m, 13, 'GST', 'GSTR-6 (Input Service Distributors)', f'Return for {prev}.')
        add(y, m, 20, 'GST', 'GSTR-3B (monthly filers)', f'Summary return and tax payment for {prev}.')
    add(2026, 4, 30, 'GST', 'GSTR-4 (composition taxpayers)', 'Annual return for FY 2025-26.')
    add(2026, 12, 31, 'GST', 'GSTR-9 and GSTR-9C', 'Annual return and reconciliation statement for FY 2025-26, unless extended.')
    add(2026, 5, 31, 'TDS', 'TDS statements, Q4 FY 2025-26', 'Forms 24Q, 26Q and 27Q for January–March 2026.')
    add(2026, 7, 31, 'TDS', 'TDS statements, Q1 FY 2026-27', 'Forms 138, 140 and 144 for April–June 2026.')
    add(2026, 10, 31, 'TDS', 'TDS statements, Q2 FY 2026-27', 'Forms 138, 140 and 144 for July–September 2026.')
    add(2027, 1, 31, 'TDS', 'TDS statements, Q3 FY 2026-27', 'Forms 138, 140 and 144 for October–December 2026.')
    add(2026, 6, 15, 'TDS', 'Form 16 and Form 16A', 'Form 16 for FY 2025-26 and Form 16A for the January–March 2026 quarter.')
    add(2026, 8, 15, 'TDS', 'Form 131 (Form 16A)', 'Non-salary TDS certificates for April–June 2026.')
    add(2026, 11, 15, 'TDS', 'Form 131 (Form 16A)', 'Non-salary TDS certificates for July–September 2026.')
    add(2027, 2, 15, 'TDS', 'Form 131 (Form 16A)', 'Non-salary TDS certificates for October–December 2026.')
    return sorted(ev, key=lambda e: (e[0], e[1], e[2]))


ICS_NAME = 'taxpower-gst-tds-due-dates-fy-2026-27.ics'


def write_ics(events):
    lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//TaxPower//Due dates FY 2026-27//EN', 'CALSCALE:GREGORIAN', 'X-WR-CALNAME:GST and TDS due dates FY 2026-27']
    for i, (d, kind, title, desc) in enumerate(events):
        nxt = d + dt.timedelta(days=1)
        lines += ['BEGIN:VEVENT', f'UID:due-{d.isoformat()}-{i}@taxpower.co', 'DTSTAMP:20261023T000000Z', f'DTSTART;VALUE=DATE:{d.strftime("%Y%m%d")}',
                  f'DTEND;VALUE=DATE:{nxt.strftime("%Y%m%d")}', f'SUMMARY:{kind}: {title}'.replace(',', '\\,'),
                  f'DESCRIPTION:{desc} Confirm on the official portal; due dates may be extended.'.replace(',', '\\,'), 'END:VEVENT']
    lines.append('END:VCALENDAR')
    (ROOT / ICS_NAME).write_text('\r\n'.join(lines) + '\r\n')


def due_page():
    events = due_events()
    write_ics(events)
    months = {}
    for d, kind, title, desc in events:
        months.setdefault((d.year, d.month), []).append((d, kind, title, desc))
    import json
    DUE_JSON = json.dumps([{'d': d.isoformat(), 'k': k, 't': t, 'x': ds} for d, k, t, ds in events], ensure_ascii=False).replace('</', '<\\/')
    cal = ''
    for (y, m), items in sorted(months.items()):
        rows = ''.join(
            f'<li class="lp-due-item" data-kind="{k}" data-date="{d.isoformat()}"><span class="lp-due-date"><strong>{d.day}</strong> {d.strftime("%a")}</span>'
            f'<span class="lp-due-body"><span class="lp-due-tag lp-due-tag--{k.lower()}">{k}</span><strong>{esc(t)}</strong><small>{esc(ds)}</small></span></li>'
            for d, k, t, ds in items)
        cal += f'<section class="lp-month" data-month="{y}-{m:02d}"><h3>{MONTHS[m - 1]} {y}</h3><ul class="lp-due-list">{rows}</ul></section>'
    gst_rows = [['GSTR-1 (monthly)', '11th of the next month'], ['GSTR-1 (QRMP, quarterly)', '13th of the month after the quarter'], ['IFF (optional)', '13th of the next month, for the first two months of a quarter'],
                ['GSTR-3B (monthly)', '20th of the next month'], ['GSTR-3B (QRMP, quarterly)', '22nd or 24th of the month after the quarter, by state. Maharashtra: 22nd'],
                ['PMT-06 (QRMP)', '25th of the next month, for the first two months of a quarter'], ['GSTR-7 and GSTR-8', '10th of the next month'], ['GSTR-6', '13th of the next month'],
                ['CMP-08', '18th of the month after the quarter'], ['GSTR-4', '30 April after the financial year'], ['GSTR-9 and GSTR-9C', '31 December after the financial year']]
    tds_rows = [['TDS and TCS deposit', '7th of the next month; TDS for March by 30 April'], ['TDS statements (Forms 138, 140, 144)', '31 July, 31 October, 31 January and 31 May'],
                ['TCS statement (Form 143)', 'Check the Income Tax portal for the current due date'], ['Form 16 (Form 130)', '15 June after the financial year'],
                ['Form 16A (Form 131)', 'Usually 15 August, 15 November, 15 February and 15 June']]
    body = (breadcrumb([('Home', 'home'), ('GST & TDS due dates', None)]) +
            '<section class="lp-panel lp-hero"><span class="lp-kicker">FY 2026-27 · APRIL 2026 TO MARCH 2027</span><h1>GST and TDS due dates calendar</h1>'
            '<p class="lp-lead">Month-by-month standard due dates for GST returns, TDS and TCS deposits, TDS statements and certificates. Tap a date to see what is due, search for a return or switch to the month list. Add the calendar to your phone or Outlook.</p>'
            f'<div class="lp-actions"><a class="lp-button" href="{ICS_NAME}" download>Add to calendar (.ics) <span aria-hidden="true">↓</span></a><a class="lp-link" href="free-trial">Try TaxPower free for 30 days ↗</a></div>'
            f'<p class="lp-meta">Last checked {nice_date(PUBLISHED)}. Dates are standard statutory dates; extensions are notified separately.</p></section>'
            '<section class="lp-panel" aria-labelledby="lp-cal-title"><h2 id="lp-cal-title">Tax calendar</h2>'
            '<div class="lp-toolbar"><div class="lp-views" role="tablist" aria-label="Choose view"><button type="button" role="tab" class="lp-view is-active" data-due-view="cal">Calendar view</button><button type="button" role="tab" class="lp-view" data-due-view="list">List by month</button></div>'
            '<label class="lp-search"><span class="lp-sr">Search due dates</span><input type="search" placeholder="Search due date, e.g. GSTR-3B" data-due-search></label></div>'
            '<div class="lp-filters" role="group" aria-label="Filter due dates"><button type="button" class="lp-filter is-active" data-due-filter="all">All</button><button type="button" class="lp-filter lp-filter--gst" data-due-filter="GST">GST</button>'
            '<button type="button" class="lp-filter lp-filter--tds" data-due-filter="TDS">TDS &amp; TCS</button><label class="lp-toggle" data-due-pastwrap hidden><input type="checkbox" data-due-past> Show dates that have passed</label></div>'
            '<div class="lp-taxcal" data-taxcal hidden><div class="lp-tc-left"><div class="lp-tc-head"><button type="button" class="lp-tc-nav" data-tc-prev aria-label="Previous month">‹</button><strong data-tc-month></strong><button type="button" class="lp-tc-nav" data-tc-next aria-label="Next month">›</button></div>'
            '<div class="lp-tc-grid" data-tc-grid role="grid"></div><p class="lp-tc-legend"><span class="lp-dot lp-dot--gst"></span>GST <span class="lp-dot lp-dot--tds"></span>TDS &amp; TCS <span class="lp-dot lp-dot--both"></span>Both</p></div>'
            '<div class="lp-tc-right"><h3 data-tc-title></h3><div class="lp-table-wrap"><table class="lp-table lp-tc-table"><thead><tr><th>Event</th><th>Type</th><th>Description</th></tr></thead><tbody data-tc-rows></tbody></table></div></div></div>'
            f'<div class="lp-calendar" data-due-list>{cal}</div>'
            f'<script type="application/json" id="lp-due-data">{DUE_JSON}</script></section>'
            '<section class="lp-panel"><h2>Quick reference: GST</h2>' + table_html(['Return or payment', 'Standard due date'], gst_rows) + '</section>'
            '<section class="lp-panel"><h2>Quick reference: TDS and TCS</h2>' + table_html(['Return, payment or certificate', 'Standard due date'], tds_rows) +
            '<p style="margin-top:14px">Income-tax Act, 2025 applies from 1 April 2026, so TDS and TCS forms and sections have new numbers. Forms 24Q, 26Q, 27Q and 27EQ became Forms 138, 140, 144 and 143. Form 16, 16A and 27D became Forms 130, 131 and 133.</p></section>'
            '<section class="lp-panel"><h2>Before you rely on a date</h2><p>The government often extends due dates, and some extensions apply only to certain states or taxpayers. Always confirm on <a href="https://www.gst.gov.in" rel="noopener">gst.gov.in</a> and <a href="https://www.incometax.gov.in" rel="noopener">incometax.gov.in</a>. Do not wait for the last day, because the portals are busy near deadlines.</p></section>'
            + resources_panel() + contact_block())
    meta = {'title': 'GST & TDS Due Dates Calendar FY 2026-27 | TaxPower',
            'description': 'Month-by-month GST and TDS due dates for FY 2026-27: GSTR-1, GSTR-3B, QRMP, TDS deposits, statements and certificates. Filter and add to your calendar.'}
    return body, meta, [('Home', 'home'), ('GST & TDS due dates', 'gst-tds-due-dates')], {'@type': 'WebPage', '@id': BASE + 'gst-tds-due-dates#page', 'url': BASE + 'gst-tds-due-dates'}


def wrap(slug, result):
    body, meta, trail, extra = result
    return (slug, body, meta, [], trail, extra)


pages = [(hub['slug'],) + hub_page()] + [(c['slug'],) + city_page(c) for c in cities] + [(f['slug'],) + feature_page(f) for f in features] \
    + [wrap(pg['slug'], blog_index(pg) if pg.get('type') == 'blog-index' else static_page(pg)) for pg in res['pages']] \
    + [wrap(x['slug'], post_page(x)) for x in res['posts']] \
    + [wrap('gst-tds-due-dates', due_page())]
for slug, body, meta, faqs, trail, extra in pages:
    out = render(slug, body, meta, trail, extra)
    for filename in (f'{slug}.html', f'{slug}/index.html'):
        path = ROOT / filename
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text('\n'.join(line.rstrip() for line in out.splitlines()) + '\n')
print('Built', len(pages), 'standalone landing pages.')
