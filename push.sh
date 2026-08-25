#!/bin/bash

# 生成したサムネイル画像をアセットフォルダにコピーします
cp /Users/user/.gemini/antigravity/brain/432420d3-3277-48c3-9317-f73951c9bd82/thumb_menstrual_1787672585082.png assets/thumb_menstrual.png
cp /Users/user/.gemini/antigravity/brain/432420d3-3277-48c3-9317-f73951c9bd82/thumb_pelvic_floor_1787672598886.png assets/thumb_pelvic_floor.png
cp /Users/user/.gemini/antigravity/brain/432420d3-3277-48c3-9317-f73951c9bd82/thumb_ankle_cai_1787672613853.png assets/thumb_ankle_cai.png
cp /Users/user/.gemini/antigravity/brain/432420d3-3277-48c3-9317-f73951c9bd82/thumb_tmj_1787672628947.png assets/thumb_tmj.png
cp /Users/user/.gemini/antigravity/brain/432420d3-3277-48c3-9317-f73951c9bd82/thumb_manual_context_1787672641783.png assets/thumb_manual_context.png
cp /Users/user/.gemini/antigravity/brain/432420d3-3277-48c3-9317-f73951c9bd82/thumb_fascia_lines_1787672669927.png assets/thumb_fascia_lines.png
cp /Users/user/.gemini/antigravity/brain/432420d3-3277-48c3-9317-f73951c9bd82/thumb_stretching_1787672685260.png assets/thumb_stretching.png
cp /Users/user/.gemini/antigravity/brain/432420d3-3277-48c3-9317-f73951c9bd82/thumb_internal_cold_1787672700217.png assets/thumb_internal_cold.png
cp /Users/user/.gemini/antigravity/brain/432420d3-3277-48c3-9317-f73951c9bd82/thumb_bronchiectasis_1787672712986.png assets/thumb_bronchiectasis.png
cp /Users/user/.gemini/antigravity/brain/432420d3-3277-48c3-9317-f73951c9bd82/thumb_bloating_1787672726004.png assets/thumb_bloating.png

# HTMLファイル（記事一覧など）に追加された可能性がある変更もすべてステージングします
git add *.html

# 暗号化スクリプトを実行します（合言葉が必要でした）
./encrypt.sh "ZERO_AUGUST_2026"

# アセットや暗号化されたHTMLなどのすべての変更をステージングしてコミット・プッシュします
git add -A
git commit -m "10件の新規有料記事用サムネイル画像を追加・暗号化更新"
git push
