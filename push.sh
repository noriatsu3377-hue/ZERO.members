#!/bin/bash

# 今回は画像コピーなし

# HTMLファイル（記事一覧など）に追加された可能性がある変更もすべてステージングします
git add *.html

# 暗号化スクリプトを実行します（合言葉が必要でした）
./encrypt.sh "ZERONEXT9"

# アセットや暗号化されたHTMLなどのすべての変更をステージングしてコミット・プッシュします
git add -A
git commit -m "9月のZoomアーカイブ動画リンクを追加・暗号化更新"
git push
