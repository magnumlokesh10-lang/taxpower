"""Test copy: the same site, but each tab is its own short page under /split/.
Reads the pages built by build-section-routes.py and writes split/<route>.html.
Remove the whole split/ folder to discard the experiment. Run after build-section-routes.py."""
from pathlib import Path
import json,os,re
from lxml import html
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'split'
BASE_PATH='/'+os.environ.get('TAXPOWER_BASE_PATH','/').strip('/')+'/' if os.environ.get('TAXPOWER_BASE_PATH','/').strip('/') else '/'
config=json.loads((ROOT/'scripts/seo-routes.json').read_text())
PAGES=['home','taxpowergst','taxpowertds','pricing','downloads','aboutus','support']
# Where each old route lives in the split copy.
target={p:'split/'+p for p in PAGES}
target.update({'gst-return':'split/taxpowergst#dashboard_bg','gst-billing':'split/taxpowergst#gst-billing-intro',
               'technical-support':'split/support#technical-support','demo-enquiry':'split/support#demo-enquiry'})
def fix_href(h):
    if not h:return h
    raw=h[len(BASE_PATH):] if h.startswith(BASE_PATH) else h
    path,_,frag=raw.partition('#')
    path=path.rstrip('/')
    if path.endswith('.html'):path=path[:-5]
    if path in ('index',''):path='home'
    if path in target and (not frag or path=='home' or True):
        t=target[path]
        if frag and '#' not in t:t+='#'+frag
        return BASE_PATH+t
    return h
OUT.mkdir(exist_ok=True)
for page in PAGES:
    doc=html.fromstring((ROOT/(page+'.html')).read_text())
    keep=config[page]['section']
    cont=doc.xpath('//*[@data-page-sections]')[0]
    for node in list(cont):
        if node.get('id')!=keep:cont.remove(node)
    if page!='home':
        for node in doc.xpath('//main[@id="home"] | //section[@id="home"] | //section[contains(@class,"trusted-companies-section")]'):
            node.getparent().remove(node)
    for s in doc.xpath('//script[contains(@src,"section-routes.js")]'):s.getparent().remove(s)
    for a in doc.xpath('//a[@href]'):a.set('href',fix_href(a.get('href')))
    for l in doc.xpath('//link[@rel="canonical"]'):l.set('href',l.get('href'))
    stub=html.fromstring('<script>window.TaxPowerRoutes={hash:function(){return "#%s"},hashForURL:function(){return ""},urlFor:function(){return null},write:function(){},cleanLinks:function(){}};</script>'%keep)
    doc.xpath('//head')[0].insert(1,stub)
    doc.xpath('//head')[0].append(html.fromstring('<meta name="robots" content="noindex, nofollow">'))
    for m in doc.xpath('//meta[@name="robots"][@content="index, follow, max-image-preview:large"]'):m.getparent().remove(m)
    for f,nested in ((page+'.html',False),(page+'/index.html',True)):
        p=OUT/f;p.parent.mkdir(exist_ok=True);p.write_text('<!DOCTYPE html>\n'+html.tostring(doc,encoding='unicode',method='html'))
print('split pages:',len(PAGES))
