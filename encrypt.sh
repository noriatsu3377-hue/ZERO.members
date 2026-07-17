#!/usr/bin/env bash
# ==============================================================================
# 会員サイト「零 -ZERO- MEMBERS」一括暗号化スクリプト (StatiCrypt AES-256)
# ==============================================================================
# 使用方法:
#   ./encrypt.sh <新しい合言葉(パスワード)>
# または
#   npm run encrypt -- <新しい合言葉(パスワード)>
# ==============================================================================

set -euo pipefail

# PATHの拡張 (シェルの非対話実行やcron、様々な環境でNode.js / npm / Pythonを安定して検出可能にする)
export PATH="/Users/user/.local/share/zero-node/bin:/Users/user/.local/share/node18/bin:/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:$PATH"

# カラー定義
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# パラメータチェック
if [ "$#" -lt 1 ] || [ -z "$1" ]; then
    echo -e "${RED}[ERROR] パスワード(合言葉)を指定してください。${NC}"
    echo -e "使用例: ./encrypt.sh \"ZERO_AUGUST_2026\""
    exit 1
fi

PASSWORD="$1"
INPUT_DIR="private_html"
OUTPUT_DIR="."
TEMPLATE_FILE="template_zero.html"
REMEMBER_DAYS=31

echo -e "${CYAN}====================================================================${NC}"
echo -e "${CYAN}  零 -ZERO- MEMBERS ページ一括暗号化処理開始 (AES-256)${NC}"
echo -e "${CYAN}====================================================================${NC}"

# 平文フォルダの確認
if [ ! -d "$INPUT_DIR" ]; then
    echo -e "${RED}[ERROR] 平文ソースディレクトリ ($INPUT_DIR) が見つかりません。${NC}"
    exit 1
fi

# テンプレートの確認
if [ ! -f "$TEMPLATE_FILE" ]; then
    echo -e "${RED}[ERROR] テンプレートファイル ($TEMPLATE_FILE) が見つかりません。${NC}"
    exit 1
fi

echo -e "${YELLOW}[INFO] 対象ディレクトリ: ${INPUT_DIR}/${NC}"
echo -e "${YELLOW}[INFO] 出力ディレクトリ: ${OUTPUT_DIR}/ (公開用ルート)${NC}"
echo -e "${YELLOW}[INFO] 有効期限設定: ${REMEMBER_DAYS} 日間記憶${NC}"

# 実行エンジンの判定 (Node.js/npm staticrypt vs Python Fallback)
if command -v ./node_modules/.bin/staticrypt >/dev/null 2>&1 && ./node_modules/.bin/staticrypt --help >/dev/null 2>&1; then
    echo -e "${GREEN}[INFO] ./node_modules/.bin/staticrypt エンジンを使用して一括ビルドを実行します...${NC}"
    for html_file in "$INPUT_DIR"/*.html; do
        filename=$(basename "$html_file")
        echo -e "  -> 暗号化中: $filename ..."
        ./node_modules/.bin/staticrypt "$html_file" "$PASSWORD" \
            -t "$TEMPLATE_FILE" \
            --remember "$REMEMBER_DAYS" \
            -d "$OUTPUT_DIR" \
            --template-instructions "今月の合言葉を入力してください" \
            --template-placeholder "合言葉を入力" \
            --template-button "認証してページを開く" \
            --template-remember "合言葉を${REMEMBER_DAYS}日間記憶する" \
            --template-error "合言葉が正しくありません。再度入力してください。" \
            --template-toggle-show "合言葉を表示" \
            --template-toggle-hide "合言葉を隠す"
    done
elif command -v npx >/dev/null 2>&1 && npx --no-install staticrypt --help >/dev/null 2>&1; then
    echo -e "${GREEN}[INFO] npx staticrypt エンジンを使用して一括ビルドを実行します...${NC}"
    for html_file in "$INPUT_DIR"/*.html; do
        filename=$(basename "$html_file")
        echo -e "  -> 暗号化中: $filename ..."
        npx --no-install staticrypt "$html_file" "$PASSWORD" \
            -t "$TEMPLATE_FILE" \
            --remember "$REMEMBER_DAYS" \
            -d "$OUTPUT_DIR" \
            --template-instructions "今月の合言葉を入力してください" \
            --template-placeholder "合言葉を入力" \
            --template-button "認証してページを開く" \
            --template-remember "合言葉を${REMEMBER_DAYS}日間記憶する" \
            --template-error "合言葉が正しくありません。再度入力してください。" \
            --template-toggle-show "合言葉を表示" \
            --template-toggle-hide "合言葉を隠す"
    done
else
    echo -e "${YELLOW}[INFO] Node.js/staticrypt コマンドライン未検出または非互換。高信頼ネイティブ Python 互換エンジンを使用します...${NC}"
    python3 scripts/encrypt_fallback.py \
        --password "$PASSWORD" \
        --input-dir "$INPUT_DIR" \
        --output-dir "$OUTPUT_DIR" \
        --template "$TEMPLATE_FILE" \
        --remember "$REMEMBER_DAYS"
fi

echo -e "${GREEN}====================================================================${NC}"
echo -e "${GREEN}  一括暗号化およびビルドが完了しました！${NC}"
echo -e "${GREEN}====================================================================${NC}"
echo -e "更新の確認手順:"
echo -e " 1. ブラウザでローカルの index.html を開き、新しい合言葉で認証できるかテストしてください。"
echo -e " 2. 問題がなければ 'git add . && git commit -m \"Monthly password update\" && git push' で公開できます。"
