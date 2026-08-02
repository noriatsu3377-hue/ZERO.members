import re

# 1. Create archive-2026-08.html
with open('private_html/archive-2026-07.html', 'r', encoding='utf-8') as f:
    template = f.read()

template = template.replace('2026年7月', '2026年8月')

start_grid = template.find('<div class="lectures-grid">') + len('<div class="lectures-grid">')
end_grid = template.find('    </div>\n\n  </main>')

article_card = """
      <article class="featured-card">
        <div class="featured-img-wrapper">
          <img src="assets/thumb_japanese_spine.png" alt="日本人の脊柱アライメントとフラットバック改善戦略の概念図">
        </div>
        <div class="featured-content">
          <span class="featured-badge">
            <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor" style="vertical-align: middle;">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
            </svg>
            会員限定講義
          </span>
          <h2 class="featured-title">
            <a href="article-japanese-spine.html">日本人の背骨はなぜ平坦に見えるのか ― 脊柱アライメントの集団差と改善戦略</a>
          </h2>
          <p class="featured-excerpt">
            アジア人に特有の脊柱アライメント傾向（低弯曲・フラットバック傾向）のエビデンスと、その改善のための「回旋＋伸展＋負荷」を用いた姿勢再学習戦略を、原口慶篤が事実・理論・仮説に分けて解説する。
          </p>
          <div class="card-footer" style="padding-top: 0; border-top: none; margin-top: 0;">
            <a href="article-japanese-spine.html" class="read-more-btn" style="font-size: 0.95rem;">
              講義を読む
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
              </svg>
            </a>
          </div>
        </div>
      </article>
"""

new_archive = template[:start_grid] + '\n' + article_card + template[end_grid:]

new_archive = re.sub(
    r'<p class="hero-description" style="margin-bottom: 0;">.*?</p>',
    '<p class="hero-description" style="margin-bottom: 0;">\n        2026年8月に更新された会員限定講義アーカイブです。日本人の脊柱アライメントとフラットバック改善など、最新の臨床知見を収録。\n      </p>',
    new_archive, flags=re.DOTALL
)

with open('private_html/archive-2026-08.html', 'w', encoding='utf-8') as f:
    f.write(new_archive)


# 2. Update index.html
with open('private_html/index.html', 'r', encoding='utf-8') as f:
    index = f.read()

aug_section = """
      <!-- 8月分の欄 -->
      <div class="month-summary-card">
        <div>
          <div class="month-summary-header">
            <h3 class="month-summary-title"><span>2026年8月</span> 講義一覧</h3>
            <span class="month-count-badge">新着講義</span>
          </div>
          <p style="color: var(--text-secondary); font-size: 0.95rem; margin-bottom: 16px; line-height: 1.6;">
            最新の臨床推論と姿勢制御戦略を収録。
          </p>
          <ul class="month-summary-highlights">
            <li>日本人の背骨はなぜ平坦に見えるのか（フラットバック改善）</li>
            <li>随時追加予定</li>
          </ul>
        </div>
        <a href="archive-2026-08.html" class="month-action-btn">
          <span>8月分の講義を見る</span>
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>
        </a>
      </div>
"""

index = index.replace('<!-- 7月分の欄 -->', aug_section + '\n      <!-- 7月分の欄 -->')

with open('private_html/index.html', 'w', encoding='utf-8') as f:
    f.write(index)

