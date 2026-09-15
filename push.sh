#!/bin/bash

# 生成したサムネイル画像をアセットフォルダにコピーします
cp /Users/user/.gemini/antigravity/brain/8fb281e5-1861-4054-b9e4-a0b5796950e4/thumb_comorbidity_1789478066221.png assets/thumb_comorbidity.png
cp /Users/user/.gemini/antigravity/brain/8fb281e5-1861-4054-b9e4-a0b5796950e4/thumb_vertigo_1789478079184.png assets/thumb_vertigo.png
cp /Users/user/.gemini/antigravity/brain/8fb281e5-1861-4054-b9e4-a0b5796950e4/thumb_menopause_1789478091585.png assets/thumb_menopause.png
cp /Users/user/.gemini/antigravity/brain/8fb281e5-1861-4054-b9e4-a0b5796950e4/thumb_deficiency_excess_1789478108014.png assets/thumb_deficiency_excess.png
cp /Users/user/.gemini/antigravity/brain/8fb281e5-1861-4054-b9e4-a0b5796950e4/thumb_tongue_pulse_1789478125722.png assets/thumb_tongue_pulse.png
cp /Users/user/.gemini/antigravity/brain/8fb281e5-1861-4054-b9e4-a0b5796950e4/thumb_six_excesses_1789478137482.png assets/thumb_six_excesses.png
cp /Users/user/.gemini/antigravity/brain/8fb281e5-1861-4054-b9e4-a0b5796950e4/thumb_pediatric_alignment_1789478149809.png assets/thumb_pediatric_alignment.png
cp /Users/user/.gemini/antigravity/brain/8fb281e5-1861-4054-b9e4-a0b5796950e4/thumb_youth_sports_1789478164362.png assets/thumb_youth_sports.png
cp /Users/user/.gemini/antigravity/brain/8fb281e5-1861-4054-b9e4-a0b5796950e4/thumb_motor_milestones_1789478175868.png assets/thumb_motor_milestones.png
cp /Users/user/.gemini/antigravity/brain/8fb281e5-1861-4054-b9e4-a0b5796950e4/thumb_primitive_reflexes_1789478187338.png assets/thumb_primitive_reflexes.png

# HTMLファイル（記事一覧など）に追加された可能性がある変更もすべてステージングします
git add *.html

# 暗号化スクリプトを実行します（合言葉が必要でした）
./encrypt.sh "ZERONEXT9"

# アセットや暗号化されたHTMLなどのすべての変更をステージングしてコミット・プッシュします
git add -A
git commit -m "10件の新規有料記事用サムネイル画像を追加・暗号化更新"
git push
