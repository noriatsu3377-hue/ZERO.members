#!/bin/bash

# 生成したサムネイル画像をアセットフォルダにコピーします
cp /Users/user/.gemini/antigravity/brain/8fb281e5-1861-4054-b9e4-a0b5796950e4/thumb_weiqi_1790129557020.png assets/thumb_weiqi.png
cp /Users/user/.gemini/antigravity/brain/8fb281e5-1861-4054-b9e4-a0b5796950e4/thumb_dyspnea_1790129567788.png assets/thumb_dyspnea.png
cp /Users/user/.gemini/antigravity/brain/8fb281e5-1861-4054-b9e4-a0b5796950e4/thumb_nociplastic_1790129580591.png assets/thumb_nociplastic.png
cp /Users/user/.gemini/antigravity/brain/8fb281e5-1861-4054-b9e4-a0b5796950e4/thumb_whiplash_1790129591166.png assets/thumb_whiplash.png
cp /Users/user/.gemini/antigravity/brain/8fb281e5-1861-4054-b9e4-a0b5796950e4/thumb_achilles_1790129602217.png assets/thumb_achilles.png
cp /Users/user/.gemini/antigravity/brain/8fb281e5-1861-4054-b9e4-a0b5796950e4/thumb_shoulder_trauma_1790129613592.png assets/thumb_shoulder_trauma.png
cp /Users/user/.gemini/antigravity/brain/8fb281e5-1861-4054-b9e4-a0b5796950e4/thumb_tos_1790129625933.png assets/thumb_tos.png

# HTMLファイル（記事一覧など）に追加された可能性がある変更もすべてステージングします
git add *.html

# 暗号化スクリプトを実行します（合言葉が必要でした）
./encrypt.sh "ZERONEXT9"

# アセットや暗号化されたHTMLなどのすべての変更をステージングしてコミット・プッシュします
git add -A
git commit -m "7件の新規有料記事用サムネイル画像を追加・暗号化更新"
git push
