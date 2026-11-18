import re,glob,os,html,hashlib
from html.parser import HTMLParser
P="private_html"; OUT=P+"/_audio_text"; os.makedirs(OUT,exist_ok=True)
SKIPCLS={"sheet","legend"}; SKIPID={"toc","refs","sheet"}
BREAK={"p","li","br","h1","h2","h3","h4","h5","tr","caption","summary","div"}
class X(HTMLParser):
    def __init__(s):
        super().__init__(); s.stack=[]; s.skip=0; s.out=[]; s.inart=0
    def handle_starttag(s,t,a):
        a=dict(a); cls=set((a.get("class") or "").split())
        if t in("br","img","input","meta","link","hr"):
            if t=="br" and s.inart and not s.skip: s.out.append("。")
            return
        sk = s.skip>0 or (cls&SKIPCLS) or a.get("id") in SKIPID or t in("nav","script","style","sup","details","aside")
        if "article-content" in cls: s.inart+=1
        s.stack.append((t,bool(sk),"article-content" in cls))
        if sk: s.skip+=1
    def handle_endtag(s,t):
        while s.stack:
            tt,sk,ac=s.stack.pop()
            if sk: s.skip-=1
            if ac: s.inart-=1
            if s.inart and not s.skip:
                if tt in BREAK: s.out.append("。")
                elif tt in("td","th"): s.out.append("、")
            if tt==t: break
    def handle_data(s,d):
        if s.inart and not s.skip: s.out.append(d)
def clean(t):
    t=t.replace("★","").replace("——","、").replace("―","、").replace(" ・"," ").replace("。・","。").replace("→","、つまり、").replace("＝","イコール").replace("|","、")
    t=re.sub(r"\s+"," ",t); t=re.sub(r"([。、])\s*[。、]+",r"\1",t); t=re.sub(r"^[。、 ]+","",t)
    return t.strip()
n=0;tot=0
for f in sorted(glob.glob(P+"/*.html")):
    s=open(f,encoding="utf-8").read()
    if 'class="article-content"' not in s: continue
    h1=re.search(r'<h1[^>]*>(.*?)</h1>',s,re.S); sub=re.search(r'class="article-subtitle">(.*?)</p>',s,re.S)
    head=html.unescape(re.sub("<[^>]+>","",(h1.group(1) if h1 else "")))+"。"+(html.unescape(re.sub("<[^>]+>","",sub.group(1)))+"。" if sub else "")
    x=X(); x.feed(s); body=clean("".join(x.out))
    txt=clean(head+" "+body)+"\n\n以上で、この講義の読み上げを終わります。零 ゼロ メンバーズ。"
    slug=os.path.basename(f)[:-5]
    open(f"{OUT}/{slug}.txt","w",encoding="utf-8").write(txt); n+=1; tot+=len(txt)
print(n,tot)
