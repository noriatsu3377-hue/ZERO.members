#!/bin/bash

# 生成したサムネイル画像をアセットフォルダにコピーします
cp /Users/user/.gemini/antigravity/brain/8fb281e5-1861-4054-b9e4-a0b5796950e4/thumb_zangxiang_1791227817614.png assets/thumb_zangxiang.png
cp /Users/user/.gemini/antigravity/brain/8fb281e5-1861-4054-b9e4-a0b5796950e4/thumb_parkinson_1791227826278.png assets/thumb_parkinson.png
cp /Users/user/.gemini/antigravity/brain/8fb281e5-1861-4054-b9e4-a0b5796950e4/thumb_stroke_1791227835323.png assets/thumb_stroke.png
cp /Users/user/.gemini/antigravity/brain/8fb281e5-1861-4054-b9e4-a0b5796950e4/thumb_orthotics_1791227843705.png assets/thumb_orthotics.png
cp /Users/user/.gemini/antigravity/brain/8fb281e5-1861-4054-b9e4-a0b5796950e4/thumb_iceheat_1791227852506.png assets/thumb_iceheat.png
cp /Users/user/.gemini/antigravity/brain/8fb281e5-1861-4054-b9e4-a0b5796950e4/thumb_adverse_1791227861070.png assets/thumb_adverse.png
cp /Users/user/.gemini/antigravity/brain/8fb281e5-1861-4054-b9e4-a0b5796950e4/thumb_scoliosis_1791227869517.png assets/thumb_scoliosis.png
cp /Users/user/.gemini/antigravity/brain/8fb281e5-1861-4054-b9e4-a0b5796950e4/thumb_reds_1791227879271.png assets/thumb_reds.png
cp /Users/user/.gemini/antigravity/brain/8fb281e5-1861-4054-b9e4-a0b5796950e4/thumb_osteoporosis_1791227888409.png assets/thumb_osteoporosis.png
cp /Users/user/.gemini/antigravity/brain/8fb281e5-1861-4054-b9e4-a0b5796950e4/thumb_hamstring_1791227898566.png assets/thumb_hamstring.png
cp /Users/user/.gemini/antigravity/brain/8fb281e5-1861-4054-b9e4-a0b5796950e4/thumb_meniscus_1791227907327.png assets/thumb_meniscus.png
cp /Users/user/.gemini/antigravity/brain/8fb281e5-1861-4054-b9e4-a0b5796950e4/thumb_acl_1791227917228.png assets/thumb_acl.png

# HTMLファイル（記事一覧など）に追加された可能性がある変更もすべてステージングします
git add *.html

# 暗号化スクリプトを実行します（合言葉が必要でした）
./encrypt.sh "ZERONEXT9"

# アセットや暗号化されたHTMLなどのすべての変更をステージングしてコミット・プッシュします
git add -A
git commit -m "12件の新規有料記事用サムネイル画像を追加・暗号化更新"
git push
