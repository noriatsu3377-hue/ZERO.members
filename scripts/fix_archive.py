import re
import os
import shutil

# 1. Fix archive-2026-08.html
with open('private_html/archive-2026-08.html', 'r', encoding='utf-8') as f:
    content = f.read()

# I prepended 3 cards. I need to remove them.
# The user's first card starts with '      <article class="featured-card">\n        <div class="featured-img-wrapper">\n          <img src="assets/thumb_gait_relearning.png"'
# So I'll find that string and keep everything from there onwards (plus the header before the grid).
start_grid = content.find('<div class="lectures-grid">') + len('<div class="lectures-grid">')
start_user_cards = content.find('<article class="featured-card">\n        <div class="featured-img-wrapper">\n          <img src="assets/thumb_gait_relearning.png"')

if start_user_cards != -1:
    new_content = content[:start_grid] + '\n\n      ' + content[start_user_cards:]
    with open('private_html/archive-2026-08.html', 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("Fixed archive-2026-08.html")
else:
    print("Could not find user cards in archive-2026-08.html")


# 2. Re-generate article-flatback-breathing.html properly
def parse_inline(text):
    text = re.sub(r'\*\*(.*?)\*\*', r'<strong>\1</strong>', text)
    return text

with open('private_html/article-japanese-spine.html', 'r', encoding='utf-8') as f:
    template = f.read()

with open('フラットバックは呼吸から変えられるのか.md', 'r', encoding='utf-8') as f:
    md_content = f.read()

html_body = []
lines = md_content.split('\n')
i = 0
in_blockquote = False
in_list = False
full_title = "フラットバックは\"呼吸\"から変えられるのか ― 脊柱弯曲を選択できる胸郭の再構築"
subtitle = "横隔膜の姿勢機能とIAP、三次元的な胸郭の拡張制限に対する評価と介入"
excerpt = '横隔膜の姿勢機能と腹腔内圧、胸郭の三次元運動。核心は「フラットバックに"とにかく吐いて丸める"は、すでに小さい腰椎前弯をさらに減らしうる」という警告。吸気優位・呼気優位の正しい扱い、Zone of Appositionの限界、そして「胸椎後弯を保ったまま後方・側方胸郭へ吸気する」という臨床仮説と16章構成のプログラム。'

while i < len(lines):
    line = lines[i]
    if line.startswith('# ') or line.startswith('### ―') or line.startswith('**著者：') or line.startswith('**対象読者：'):
        pass
    elif line.startswith('---'):
        html_body.append('<hr>\n')
    elif line.startswith('## '):
        section_id = "section" + str(len([x for x in html_body if '<h2' in x]))
        if '要約' in line or 'Abstract' in line: section_id = 'intro'
        elif '結論' in line or '臨床チェックリスト' in line or '参考文献' in line: section_id = 'outro'
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
    elif line.startswith('1. ') or line.startswith('2. ') or line.startswith('3. '):
        html_body.append('  <p>' + parse_inline(line.strip()) + '</p>\n')
    elif line.startswith('### '):
        html_body.append('  <h3>' + parse_inline(line[4:].strip()) + '</h3>\n')
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

final_html_body = []
for line in html_body:
    if line.startswith('<hr>'): final_html_body.append('        </section>\n\n        <hr>\n\n')
    else: final_html_body.append(line)
final_html_body.append('        </section>\n')

content_html = "".join(final_html_body)

new_html = template
new_html = re.sub(r'<title>.*?</title>', f'<title>{full_title} | 零 -ZERO- MEMBERS</title>', new_html)
new_html = re.sub(r'<meta name="description" content=".*?">', f'<meta name="description" content="{excerpt}">', new_html)
new_html = re.sub(r'<h1 class="article-main-title">.*?</h1>', f'<h1 class="article-main-title">{full_title}</h1>', new_html)
new_html = re.sub(r'<p class="article-subtitle">.*?</p>', f'<p class="article-subtitle">{subtitle}</p>', new_html)
new_html = re.sub(r'<img src="assets/thumb_japanese_spine.png".*?>', f'<img src="assets/thumb_flatback_breathing.png" alt="{full_title}">', new_html)

start_idx = new_html.find('<article class="article-content" id="article-text">') + len('<article class="article-content" id="article-text">')
end_idx = new_html.find('</article>', start_idx)
new_html = new_html[:start_idx] + '\n' + content_html + '\n' + new_html[end_idx:]

with open('private_html/article-flatback-breathing.html', 'w', encoding='utf-8') as f:
    f.write(new_html)
print("Regenerated article-flatback-breathing.html")

