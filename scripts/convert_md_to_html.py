import re

with open('日本人の背骨はなぜ平坦に見えるのか.md', 'r', encoding='utf-8') as f:
    md_content = f.read()

# Very basic markdown to html conversion for this specific format
html_body = []
lines = md_content.split('\n')
i = 0

def parse_inline(text):
    text = re.sub(r'\*\*(.*?)\*\*', r'<strong>\1</strong>', text)
    return text

in_blockquote = False
in_list = False

while i < len(lines):
    line = lines[i]
    if line.startswith('# 日本人の背骨はなぜ平坦に見えるのか'):
        pass # title
    elif line.startswith('### ―脊柱'):
        pass # subtitle
    elif line.startswith('**著者：'):
        pass
    elif line.startswith('**対象読者：'):
        pass
    elif line.startswith('---'):
        html_body.append('<hr>\n')
    elif line.startswith('## '):
        section_id = "section" + str(len([x for x in html_body if '<h2' in x]))
        if '要約' in line:
            section_id = 'intro'
        elif '結論' in line or '臨床チェックリスト' in line or '参考文献' in line:
            section_id = 'outro'
        html_body.append(f'<section id="{section_id}">\n  <h2>{line[3:].strip()}</h2>\n')
    elif line.startswith('> 🟢 **【事実ベース】**'):
        html_body.append('  <p><span class="ev ev-fact">事実</span> ' + parse_inline(line.replace('> 🟢 **【事実ベース】**', '').strip()))
    elif line.startswith('> 🔵 **【理論ベース】**'):
        html_body.append('  <p><span class="ev ev-theory">理論</span> ' + parse_inline(line.replace('> 🔵 **【理論ベース】**', '').strip()))
    elif line.startswith('> 🟡 **【臨床仮説】**') or line.startswith('> 🟡 **【臨床仮説／解釈上の注意】**'):
        html_body.append('  <p><span class="ev ev-hypo">仮説</span> ' + parse_inline(line.replace('> 🟡 **【臨床仮説】**', '').replace('> 🟡 **【臨床仮説／解釈上の注意】**', '').strip()))
    elif line.startswith('> '):
        if not in_blockquote:
            html_body.append('  <blockquote>\n')
            in_blockquote = True
        html_body.append('    <p>' + parse_inline(line[2:].strip()) + '</p>\n')
    elif line.startswith('- '):
        if not in_list:
            html_body.append('  <ul>\n')
            in_list = True
        html_body.append('    <li>' + parse_inline(line[2:].strip()) + '</li>\n')
    elif line.startswith('1. ') or line.startswith('2. '):
        if 'Roussouly' in line or '形態的' in line or 'Sagittal' in line or 'Age- and' in line: # lazy list
            html_body.append('  <p>' + parse_inline(line.strip()) + '</p>\n')
    elif line.startswith('### '):
        html_body.append('  <h3>' + parse_inline(line[4:].strip()) + '</h3>\n')
    elif line.startswith('| '):
        if '胸椎後弯' in line: # table header handled manually below
            html_body.append('  <table class="zero-table">\n    <thead>\n      <tr><th>指標</th><th>日本人若年成人[4]</th><th>アジア人群 MEANS[1]</th><th>白人群 MEANS[1]</th><th>北アフリカ系 MEANS[1]</th></tr>\n    </thead>\n    <tbody>\n')
            html_body.append('      <tr><td>胸椎後弯 TK</td><td>27.5°</td><td>32.9°</td><td>40.0°</td><td>43.3°</td></tr>\n')
            html_body.append('      <tr><td>腰椎前弯 LL</td><td>43.4°(前弯)</td><td>−54.2°</td><td>−59.6°</td><td>−60.4°</td></tr>\n')
            html_body.append('      <tr><td>Pelvic Incidence PI</td><td>46.7°</td><td>51.0°</td><td>52.5°</td><td>52.0°</td></tr>\n')
            html_body.append('      <tr><td>Sacral Slope SS</td><td>34.6°</td><td>約39°</td><td>約40°</td><td>約40°</td></tr>\n')
            html_body.append('      <tr><td>Pelvic Tilt PT</td><td>13.2°</td><td>11.9°</td><td>12.9°</td><td>12.3°</td></tr>\n')
            html_body.append('      <tr><td>SVA</td><td>8.45mm</td><td>集団により差</td><td>集団により差</td><td>集団により差</td></tr>\n    </tbody>\n  </table>\n')
    elif line.startswith('|---|'):
        pass
    elif line.strip() == '':
        if in_blockquote and (i+1 >= len(lines) or not lines[i+1].startswith('>')):
            html_body.append('  </blockquote>\n')
            in_blockquote = False
        if in_list and (i+1 >= len(lines) or not lines[i+1].startswith('-')):
            html_body.append('  </ul>\n')
            in_list = False
    else:
        if line.strip() and not line.startswith('|'):
            if html_body and html_body[-1].startswith('  <p><span class="ev'):
                html_body[-1] += parse_inline(line.strip()) + '</p>\n'
            else:
                html_body.append('  <p>' + parse_inline(line.strip()) + '</p>\n')
    i += 1

if in_blockquote: html_body.append('  </blockquote>\n')
if in_list: html_body.append('  </ul>\n')

# Close sections
final_html_body = []
for line in html_body:
    if line.startswith('<hr>'):
        final_html_body.append('        </section>\n\n        <hr>\n\n')
    else:
        if line.startswith('<section'):
            pass
        final_html_body.append(line)
final_html_body.append('        </section>\n')

content_html = "".join(final_html_body)

with open('private_html/article-autonomic-selfcare.html', 'r', encoding='utf-8') as f:
    template = f.read()

# Replace title
template = re.sub(r'<title>.*?</title>', '<title>日本人の背骨はなぜ平坦に見えるのか ― 脊柱アライメントの集団差とフラットバック改善戦略 | 零 -ZERO- MEMBERS</title>', template)
template = re.sub(r'<meta name="description" content=".*?">', '<meta name="description" content="脊柱の矢状面アライメントの集団差、日本人・アジア人の低弯曲傾向と、フラットバック改善のための回旋・伸展・負荷による姿勢再学習戦略について、原口慶篤が事実・理論・仮説を整理して解説。">', template)

# Replace metadata
template = re.sub(r'<span>読了目安：約.*?分</span>', '<span>読了目安：約22分</span>', template)
template = re.sub(r'<h1 class="article-main-title">.*?</h1>', '<h1 class="article-main-title">日本人の背骨はなぜ平坦に見えるのか</h1>', template)
template = re.sub(r'<p class="article-subtitle">.*?</p>', '<p class="article-subtitle">― 脊柱アライメントの集団差とフラットバック改善戦略 ―</p>', template)
template = re.sub(r'<img src="assets/thumb_autonomic_selfcare.png".*?>', '<img src="assets/thumb_japanese_spine.png" alt="日本人の脊柱アライメントとフラットバック改善戦略">', template)

# Replace content
import re
start_idx = template.find('<article class="article-content" id="article-text">') + len('<article class="article-content" id="article-text">')
end_idx = template.find('</article>', start_idx)

new_content = '\n' + content_html + '\n'

template = template[:start_idx] + new_content + template[end_idx:]

# Sidebar
sidebar_content = """
        <div class="sidebar-block">
          <h3 class="sidebar-title">講義目次</h3>
          <ul class="toc-list">
            <li><a href="#intro">要約</a></li>
            <li><a href="#section1">第1章 脊柱の形</a></li>
            <li><a href="#section2">第2章 集団差</a></li>
            <li><a href="#section3">第3章 フラットバックとは</a></li>
            <li><a href="#section4">第4章 何が問題になるか</a></li>
            <li><a href="#section5">第5章 胸椎伸展だけでは不十分</a></li>
            <li><a href="#section6">第6章 臨床仮説</a></li>
            <li><a href="#section7">第7章 何を変えることなのか</a></li>
            <li><a href="#section8">第8章 評価方法</a></li>
            <li><a href="#section9">第9章 トレーニング戦略</a></li>
            <li><a href="#section10">第10章 注意点</a></li>
            <li><a href="#section11">第11章 確認すべき変化</a></li>
            <li><a href="#section12">第12章 臨床観察</a></li>
            <li><a href="#outro">結論</a></li>
          </ul>
        </div>
"""
start_sidebar = template.find('<div class="sidebar-block">')
end_sidebar = template.find('<div class="sidebar-block" style="border-color:')
template = template[:start_sidebar] + sidebar_content + template[end_sidebar:]

with open('private_html/article-japanese-spine.html', 'w', encoding='utf-8') as f:
    f.write(template)

