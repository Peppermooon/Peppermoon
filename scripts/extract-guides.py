from html.parser import HTMLParser
from pathlib import Path
import json, re, ast

ROOT = Path(__file__).resolve().parents[1]

class Node:
    def __init__(self, tag='', attrs=None):
        self.tag, self.attrs, self.children = tag, dict(attrs or []), []
    def find_all(self, tag=None, cls=None):
        out = []
        for child in self.children:
            if isinstance(child, Node):
                if (tag is None or child.tag == tag) and (cls is None or cls in child.attrs.get('class', '').split()): out.append(child)
                out.extend(child.find_all(tag, cls))
        return out

class Tree(HTMLParser):
    def __init__(self, source):
        super().__init__(convert_charrefs=True)
        self.root = Node('root'); self.stack = [self.root]; self.feed(source)
    def handle_starttag(self, tag, attrs):
        n = Node(tag, attrs); self.stack[-1].children.append(n)
        if tag not in ['area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr']: self.stack.append(n)
    def handle_endtag(self, tag):
        for i in range(len(self.stack)-1, 0, -1):
            if self.stack[i].tag == tag:
                self.stack = self.stack[:i]; return
    def handle_data(self, text): self.stack[-1].children.append(text)

def text(node, links=False):
    if isinstance(node, str): return node
    if node.tag == 'br': return '\n'
    if node.tag in ['script','style']: return ''
    value = ''.join(text(c, links) for c in node.children)
    if links and node.tag == 'a' and node.attrs.get('href','').startswith('https://'): value += ' ('+node.attrs['href']+')'
    return value

def clean(value): return re.sub(r'\s+', ' ', value).strip()
def plain(node, links=False): return clean(text(node, links))
def kind(value):
    if re.search(r'\bgame\b|remake|remaster', value, re.I): return 'game'
    if re.search(r'TV|television', value, re.I): return 'tv'
    return 'movie'

def entry(raw, rank, strong='', shared=''):
    raw=clean(raw); year=''; typ=''; note=shared
    m=re.search(r'\[Released:\s*(.*?)\s*•\s*(.*?)\]',raw)
    if not m:
        matches=list(re.finditer(r'\((\d{4}[^)]*?)\s*•\s*([^)]*)\)',raw))
        if len(matches)==1:m=matches[0]
    if not m: m=re.search(r'\((\d{4}(?:[–—-]\d{4})?)\)\s*[—–-]\s*(.+)$',raw)
    if m:
        year,typ=m.group(1).strip(),m.group(2).strip()
        tail=raw[m.end():].strip(' .—–-')
        note=' '.join(x for x in [tail,shared] if x)
        if typ.lower() not in ['film','movie','tv series','game','television series']:note=' '.join(x for x in [typ,note] if x)
        raw=raw[:m.start()].strip()
    if strong and raw.startswith(strong):
        trailing=raw[len(strong):].strip(' .—–-')
        if trailing: note=' '.join(x for x in [trailing,note] if x)
        raw=strong
    return {'rank':rank,'title':raw.strip(' .'),'year':year,'type':kind(typ or raw),'notes':note}

def list_items(ol):
    rows=[]; rank=int(ol.attrs.get('start','1'))-1
    for li in [c for c in ol.children if isinstance(c,Node) and c.tag=='li']:
        rank=int(li.attrs.get('value',rank+1))
        spans=[s for s in li.find_all('span') if 'data-guide-media-entry' in s.attrs]
        if spans:
            shared=clean(''.join(text(c) for c in li.children if c not in spans))
            for span in spans:
                for line in text(span).split('\n'):
                    if clean(line):
                        row=entry(line,rank,shared=shared);row['type']='movie' if span.attrs['data-guide-media-entry']=='movie' else 'tv';rows.append(row)
        else:
            strongs=li.find_all('strong')
            rows.append(entry(plain(li),rank,plain(strongs[0]) if strongs else ''))
    return rows

hub=Tree((ROOT/'guides/index.html').read_text()).root
cards=hub.find_all('a','card'); seeds=[]
for i, card in enumerate(cards):
    slug=card.attrs['href'].split('/')[-1]
    source=None
    for p in (ROOT/'guides').glob('*.html'):
        s=p.read_text()
        if 'href="https://thepeppermoon.com/guides/'+slug+'"' in s: source=s;break
    assert source, slug
    root=Tree(source).root; content=root.find_all('article','content')[0]
    guide={'slug':slug,'title':plain(root.find_all('h1')[0]),'franchise':plain(card.find_all('h3')[0]),'collection':'games' if 'Game' in plain(card.find_all('span','tag')[0]) else 'screen','summary':plain(card.find_all('p')[0]),'intro':'','notes':'','image_url':'','image_alt':'','status':'published','display_order':i+1,'release_sections':[],'story_sections':[]}
    mode=None; section=None; intro=[]; notes=[]
    for child in content.children:
        if not isinstance(child,Node):continue
        if child.tag=='div' and 'guide-controls' in child.attrs.get('class',''):continue
        if child.tag=='h2':
            heading=plain(child); lower=heading.lower()
            if 'release order' in lower:mode='release'
            elif 'story order' in lower or 'story progression' in lower:mode='story'
            else:mode='notes';section=None;notes.append('## '+heading);continue
            section={'heading':heading,'note':'','items':[]};guide[mode+'_sections'].append(section);continue
        if child.tag=='p' and mode in ['release','story'] and child.find_all('strong') and plain(child)==plain(child.find_all('strong')[0]) and plain(child).endswith(':'):
            section={'heading':plain(child).rstrip(':'),'note':'','items':[]};guide[mode+'_sections'].append(section);continue
        if child.tag in ['ol','ul'] and section is not None:section['items'].extend(list_items(child))
        elif child.tag not in ['script','style']:
            value=plain(child,True)
            if value:
                if mode is None:intro.append(value)
                elif mode=='notes':notes.append(value)
                elif section is not None:section['note']+='\n\n'+value
    guide['intro']='\n\n'.join(intro);guide['notes']='\n\n'.join(notes)
    if slug=='marvel-cinematic-universe':
        def array(name):return ast.literal_eval(re.search(r'const '+name+r'=(\[[\s\S]*?\]);',source)[1])
        films,shows=array('filmsRelease'),array('showsRelease')
        def row(v,typ,rank):return {'rank':rank,'title':v[0],'year':str(v[1]),'type':typ,'notes':'Alternate universe' if len(v)>2 and v[2]=='alt' else ''}
        combined=sorted([(v,'movie') for v in films]+[(v,'tv') for v in shows],key=lambda v:v[0][1])
        guide['release_sections']=[{'heading':'Release order','note':'','items':[row(v,typ,n+1) for n,(v,typ) in enumerate(combined)]}]
        movies={v[0]:v for v in array('filmStory')};tv={v[0]:v for v in array('showStory')}
        chronology=array('chronology');items=[]
        for n,title in enumerate(chronology):
            v=movies.get(title) or tv.get(title)
            if v:items.append(row(v,'movie' if title in movies else 'tv',n+1))
        alts=[(v,'tv') for v in array('alternateShows')]+[(v,'movie') for v in films if len(v)>2 and v[2]=='alt']
        guide['story_sections']=[{'heading':'Story order','note':'','items':items},{'heading':'Alternate-universe stories','note':'These MCU multiverse projects do not fit into the main timeline. For a first watch, use release order.','items':[row(v,typ,n+1) for n,(v,typ) in enumerate(alts)]}]
    for order in ['release','story']:guide[order+'_sections']=[s for s in guide[order+'_sections'] if s['items'] or s['note'].strip()]
    assert guide['release_sections'], slug+' missing release data'
    assert guide['story_sections'], slug+' missing story data'
    seeds.append(guide)
    print(slug,[(k,sum(len(s['items']) for s in guide[k+'_sections'])) for k in ['release','story']])
(ROOT/'data').mkdir(exist_ok=True)
(ROOT/'data/guides-seed.mjs').write_text('export default '+json.dumps(seeds,ensure_ascii=False,indent=2)+';\n')
(ROOT/'data/guides-seed.json').write_text(json.dumps(seeds,ensure_ascii=False,indent=2))
