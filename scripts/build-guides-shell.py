from pathlib import Path
import re,json
root=Path(__file__).resolve().parents[1]
source=(root/'index.html').read_text()
styles=re.findall(r'<style[^>]*>([\s\S]*?)</style>',source)

def split_selectors(value):
    parts=[];start=0;depth=0;quote=None
    for i,c in enumerate(value):
        if quote:
            if c==quote and (i==0 or value[i-1]!='\\'):quote=None
        elif c in ['"',"'"]:quote=c
        elif c in '([':depth+=1
        elif c in ')]':depth-=1
        elif c==',' and depth==0:parts.append(value[start:i].strip());start=i+1
    parts.append(value[start:].strip());return parts

shell=re.compile(r'\.(?:pm-[\w-]+|nav(?:\b|-[\w-]+)|topbar\b|brand(?:\b|-[\w-]+)|icon-btn\b|menu-toggle\b|mobile-bottom-nav\b|container\b)|#pm[\w-]+')
def keep(selector):return bool(shell.search(selector) or selector==':root' or re.fullmatch(r'''html\[data-theme=["']light["']\]''',selector))
def filter_css(css):
    css=re.sub(r'/\*[\s\S]*?\*/','',css);out=[];start=0;i=0
    while i<len(css):
        opening=css.find('{',i)
        if opening<0:break
        selector=css[start:opening].strip();depth=1;quote=None;j=opening+1
        while j<len(css) and depth:
            c=css[j]
            if quote:
                if c==quote and css[j-1]!='\\':quote=None
            elif c in ['"',"'"]:quote=c
            elif c=='{':depth+=1
            elif c=='}':depth-=1
            j+=1
        body=css[opening+1:j-1]
        if selector.startswith('@media') or selector.startswith('@supports'):
            inner=filter_css(body)
            if inner:out.append(selector+'{'+inner+'}')
        elif not selector.startswith('@'):
            wanted=[s for s in split_selectors(selector) if keep(s)]
            for s in split_selectors(selector):
                if re.fullmatch(r'''html\[data-theme=["']light["']\] input''',s):wanted.append(s.replace(' input',' #pmAuthModal input'))
            if wanted:out.append(',\n'.join(wanted)+'{'+body+'}')
        start=j;i=j
    return '\n'.join(out)

css='/* Header and account styles extracted from Home; guide content keeps its own styles. */\n'+filter_css(styles[0])+filter_css(styles[1])+filter_css(styles[-1])
css+='\n.topbar .brand{text-transform:none}.topbar,#pmAuthModal{line-height:normal}.topbar a,#pmAuthModal a{text-decoration:none}.topbar button,#pmAuthModal button,#pmAuthModal input{font:inherit}body{background:var(--bg,#f6f7fa);color:var(--text,#161b29)}\n'
(root/'assets/guides-shell.css').write_text(css)
header=re.search(r'<header\b[\s\S]*?</header>',source)[0]
header=header.replace('href="/" class="active" aria-current="page"','href="/"').replace('href="/guides"','href="/guides" class="active" aria-current="page"')
def root_paths(value):
    return re.sub(r'(href|src)="(?!https?:|/|#)([^"]+)"',r'\1="/\2"',value)
header=root_paths(header)
start=source.index('<div class="pm-auth-modal" id="pmAuthModal">')
modal=source[start:source.index('<script>',start)].strip()
mobile=re.search(r'<nav class="mobile-bottom-nav"[\s\S]*?</nav>',source)[0]
mobile=mobile.replace('data-mobile-section="home" class="active" aria-current="page"','data-mobile-section="home"').replace('data-mobile-section="guides"','data-mobile-section="guides" class="active" aria-current="page"')
scripts=re.findall(r'<script[^>]*>([\s\S]*?)</script>',source)
auth=next(s for s in scripts if 'const sbAuth=' in s)
auth=auth.replace("'profile.html","'/profile.html").replace('"profile.html','"/profile.html')
# Supabase auth callbacks must finish promptly before profile queries use the client.
old="sbAuth.auth.onAuthStateChange(async(_event,session)=>{\n  await render(session);\n  if(session && $('pmAuthModal')) $('pmAuthModal').classList.remove('open');\n});"
new="sbAuth.auth.onAuthStateChange((_event,session)=>{\n  setTimeout(async()=>{await render(session);if(session && $('pmAuthModal'))$('pmAuthModal').classList.remove('open');},0);\n});"
assert old in auth
auth=auth.replace(old,new)
(root/'assets/guides-auth.js').write_text(auth)
(root/'lib/guides-shell.mjs').write_text('export const header='+json.dumps(header,ensure_ascii=False)+';\nexport const authModal='+json.dumps(modal,ensure_ascii=False)+';\nexport const mobileNav='+json.dumps(mobile,ensure_ascii=False)+';\n')
print('Home header copied with profile menu; shell CSS:',len(css),'characters')
