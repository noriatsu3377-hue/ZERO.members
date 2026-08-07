import re
import os
import shutil

# 1. Copy images
img1_src = "/Users/user/.gemini/antigravity/brain/6fc6d5b4-3057-4f3a-8105-c810e155f329/thumb_flatback_breathing_1786099156213.png"
img2_src = "/Users/user/.gemini/antigravity/brain/6fc6d5b4-3057-4f3a-8105-c810e155f329/thumb_gait_spine_1786099168463.png"
img3_src = "/Users/user/.gemini/antigravity/brain/6fc6d5b4-3057-4f3a-8105-c810e155f329/thumb_thorax_pelvis_1786099180493.png"

shutil.copy(img1_src, "assets/thumb_flatback_breathing.png")
shutil.copy(img2_src, "assets/thumb_gait_spine.png")
shutil.copy(img3_src, "assets/thumb_thorax_pelvis.png")

files_to_process = [
    {
        'md': 'フラットバックは呼吸から変えられるのか.md',
        'html': 'article-flatback-breathing.html',
        'img': 'assets/thumb_flatback_breathing.png',
        'title_short': 'フラットバックは“呼吸”から変えられるのか',
        'excerpt': 'フラットバック（平背）の改善に「呼吸」がどう関わるのか。胸郭の拡張制限、横隔膜と腹腔内圧（IAP）、姿勢制御と呼吸のリンクについて、最新のバイオメカニクスから読み解く。'
    },
    {
        'md': '歩けば背骨は変わるのか.md',
        'html': 'article-gait-spine.html',
        'img': 'assets/thumb_gait_spine.png',
        'title_short': '歩けば背骨は変わるのか',
        'excerpt': '歩行が脊柱の形態や機能に与える影響について。床反力、サスペンションとしてのS字カーブ、そして歩行中の微小な回旋運動が椎間板や関節にどのような適応を促すかを解説する。'
    },
    {
        'md': '胸郭と骨盤は、なぜねじれて動くのか.md',
        'html': 'article-thorax-pelvis.html',
        'img': 'assets/thumb_thorax_pelvis.png',
        'title_short': '胸郭と骨盤は、なぜ“ねじれて”動くのか',
        'excerpt': '歩行や回旋動作における胸郭と骨盤の「相反するねじれ（カウンターローテーション）」。斜めの筋膜スリングと弾性エネルギーの蓄積・放出のメカニズムを、運動制御の観点から解き明かす。'
    }
]

def parse_inline(text):
    text = re.sub(r'\*\*(.*?)\*\*', r'<strong>\1</strong>', text)
    return text

with open('private_html/article-japanese-spine.html', 'r', encoding='utf-8') as f:
    template = f.read()

article_cards = []

for item in files_to_process:
    with open(item['md'], 'r', encoding='utf-8') as f:
        md_content = f.read()

    html_body = []
    lines = md_content.split('\n')
    i = 0

    in_blockquote = False
    in_list = False

    full_title = "Unknown"
    subtitle = ""

    while i < len(lines):
        line = lines[i]
        if line.startswith('# '):
            full_title = line[2:].strip()
        elif line.startswith('### ―'):
            subtitle = line[4:].strip()
        elif line.startswith('**著者：'):
            pass
        elif line.startswith('**対象読者：'):
            pass
        elif line.startswith('---'):
            html_body.append('<hr>\n')
        elif line.startswith('## '):
            section_id = "section" + str(len([x for x in html_body if '<h2' in x]))
            if '要約' in line or 'Abstract' in line:
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
        if line.startswith('<hr>'):
            final_html_body.append('        </section>\n\n        <hr>\n\n')
        else:
            final_html_body.append(line)
    final_html_body.append('        </section>\n')
    
    content_html = "".join(final_html_body)

    # Build the HTML file
    new_html = template
    new_html = re.sub(r'<title>.*?</title>', f'<title>{item["title_short"]} | 零 -ZERO- MEMBERS</title>', new_html)
    new_html = re.sub(r'<meta name="description" content=".*?">', f'<meta name="description" content="{item["excerpt"]}">', new_html)
    new_html = re.sub(r'<h1 class="article-main-title">.*?</h1>', f'<h1 class="article-main-title">{full_title}</h1>', new_html)
    new_html = re.sub(r'<p class="article-subtitle">.*?</p>', f'<p class="article-subtitle">{subtitle}</p>', new_html)
    new_html = re.sub(r'<img src="assets/thumb_japanese_spine.png".*?>', f'<img src="{item["img"]}" alt="{full_title}">', new_html)

    start_idx = new_html.find('<article class="article-content" id="article-text">') + len('<article class="article-content" id="article-text">')
    end_idx = new_html.find('</article>', start_idx)
    new_html = new_html[:start_idx] + '\n' + content_html + '\n' + new_html[end_idx:]

    with open(f'private_html/{item["html"]}', 'w', encoding='utf-8') as f:
        f.write(new_html)

    # Generate card for archive
    card = f"""
      <article class="featured-card">
        <div class="featured-img-wrapper">
          <img src="{item['img']}" alt="{item['title_short']}">
        </div>
        <div class="featured-content">
          <span class="featured-badge">
            <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor" style="vertical-align: middle;">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
            </svg>
            会員限定講義
          </span>
          <h2 class="featured-title">
            <a href="{item['html']}">{item['title_short']}</a>
          </h2>
          <p class="featured-excerpt">
            {item['excerpt']}
          </p>
          <div class="card-footer" style="padding-top: 0; border-top: none; margin-top: 0;">
            <a href="{item['html']}" class="read-more-btn" style="font-size: 0.95rem;">
              講義を読む
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
              </svg>
            </a>
          </div>
        </div>
      </article>
"""
    article_cards.append(card)

# 3. Update archive-2026-08.html
with open('private_html/archive-2026-08.html', 'r', encoding='utf-8') as f:
    archive_html = f.read()

# Insert cards before the Japanese spine card (which is already there)
start_grid = archive_html.find('<div class="lectures-grid">') + len('<div class="lectures-grid">')
archive_html = archive_html[:start_grid] + '\n' + "".join(article_cards) + archive_html[start_grid:]

with open('private_html/archive-2026-08.html', 'w', encoding='utf-8') as f:
    f.write(archive_html)

