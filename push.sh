#!/bin/bash

# 生成したサムネイル画像をアセットフォルダにコピーします
cp /Users/user/.gemini/antigravity/brain/8fb281e5-1861-4054-b9e4-a0b5796950e4/thumb_meridians_1788678869900.png assets/thumb_meridians.png
cp /Users/user/.gemini/antigravity/brain/8fb281e5-1861-4054-b9e4-a0b5796950e4/thumb_plantar_heel_1788678881963.png assets/thumb_plantar_heel.png
cp /Users/user/.gemini/antigravity/brain/8fb281e5-1861-4054-b9e4-a0b5796950e4/thumb_elbow_wrist_hand_1788678895143.png assets/thumb_elbow_wrist_hand.png
cp /Users/user/.gemini/antigravity/brain/8fb281e5-1861-4054-b9e4-a0b5796950e4/thumb_knee_oa_1788678905336.png assets/thumb_knee_oa.png
cp /Users/user/.gemini/antigravity/brain/8fb281e5-1861-4054-b9e4-a0b5796950e4/thumb_low_back_pain_1788678916574.png assets/thumb_low_back_pain.png

# HTMLファイル（記事一覧など）に追加された可能性がある変更もすべてステージングします
git add *.html

# 暗号化スクリプトを実行します（合言葉が必要でした）
./encrypt.sh "ZERONEXT9"

# アセットや暗号化されたHTMLなどのすべての変更をステージングしてコミット・プッシュします
git add -A
git commit -m "5件の新規有料記事用サムネイル画像を追加・暗号化更新"
git push
