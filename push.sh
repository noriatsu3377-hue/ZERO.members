#!/bin/bash

# 生成したサムネイル画像をアセットフォルダにコピーします
cp /Users/user/.gemini/antigravity/brain/8fb281e5-1861-4054-b9e4-a0b5796950e4/thumb_pregnancy_1788285294576.png assets/thumb_pregnancy.png
cp /Users/user/.gemini/antigravity/brain/8fb281e5-1861-4054-b9e4-a0b5796950e4/thumb_older_adults_1788285305462.png assets/thumb_older_adults.png
cp /Users/user/.gemini/antigravity/brain/8fb281e5-1861-4054-b9e4-a0b5796950e4/thumb_headache_1788285316998.png assets/thumb_headache.png
cp /Users/user/.gemini/antigravity/brain/8fb281e5-1861-4054-b9e4-a0b5796950e4/thumb_sleep_apnea_1788285326821.png assets/thumb_sleep_apnea.png
cp /Users/user/.gemini/antigravity/brain/8fb281e5-1861-4054-b9e4-a0b5796950e4/thumb_tendinopathy_1788285337412.png assets/thumb_tendinopathy.png
cp /Users/user/.gemini/antigravity/brain/8fb281e5-1861-4054-b9e4-a0b5796950e4/thumb_hip_groin_1788285350074.png assets/thumb_hip_groin.png
cp /Users/user/.gemini/antigravity/brain/8fb281e5-1861-4054-b9e4-a0b5796950e4/thumb_pfp_1788285363565.png assets/thumb_pfp.png
cp /Users/user/.gemini/antigravity/brain/8fb281e5-1861-4054-b9e4-a0b5796950e4/thumb_shoulder_rcrsp_1788285373082.png assets/thumb_shoulder_rcrsp.png
cp /Users/user/.gemini/antigravity/brain/8fb281e5-1861-4054-b9e4-a0b5796950e4/thumb_neck_pain_1788285383250.png assets/thumb_neck_pain.png

# HTMLファイル（記事一覧など）に追加された可能性がある変更もすべてステージングします
git add *.html

# 暗号化スクリプトを実行します（合言葉が必要でした）
./encrypt.sh "ZERONEXT9"

# アセットや暗号化されたHTMLなどのすべての変更をステージングしてコミット・プッシュします
git add -A
git commit -m "9件の新規有料記事用サムネイル画像を追加・暗号化更新"
git push
