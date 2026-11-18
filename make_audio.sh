#!/usr/bin/env bash
# ==============================================================================
# 零 -ZERO- MEMBERS 講義の音声ファイル（暗号化済み）を作るスクリプト（macOS専用）
# ==============================================================================
set -euo pipefail
cd "$(dirname "$0")"

TEXT_DIR="private_html/_audio_text"
DONE_DIR="$TEXT_DIR/.done"
KEY_FILE="private_html/_audio_key.txt"
OUT_DIR="audio"
FILTER="${1:-}"
BITRATE="${BITRATE:-24000}"

[ "$(uname)" = "Darwin" ] || { echo "[ERROR] macOS で実行してください"; exit 1; }
[ -f "$KEY_FILE" ] || { echo "[ERROR] $KEY_FILE がありません"; exit 1; }
KEY="$(tr -d ' \n' < "$KEY_FILE")"
[ ${#KEY} -eq 64 ] || { echo "[ERROR] 鍵の形式が不正です"; exit 1; }

VOICE="${VOICE:-Kyoko}"
if [ -z "$VOICE" ]; then
  LIST="$(say -v '?' | grep -E 'ja[_-]JP' || true)"
  for v in "Kyoko" "Otoya"; do
    if printf '%s\n' "$LIST" | grep -q "^$v "; then VOICE="$v"; break; fi
  done
  [ -n "$VOICE" ] || VOICE="$(printf '%s\n' "$LIST" | head -1 | sed -E 's/ +ja[_-]JP.*//')"
fi
[ -n "$VOICE" ] || { echo "[ERROR] 日本語の音声が見つかりません。"; exit 1; }
echo "[INFO] 声: $VOICE / ビットレート: $BITRATE"

mkdir -p "$OUT_DIR" "$DONE_DIR"
TMP="$(mktemp -d)"; trap 'rm -rf "$TMP"' EXIT

made=0; skipped=0; failed=0
for txt in "$TEXT_DIR"/*.txt; do
  slug="$(basename "$txt" .txt)"
  [ -n "$FILTER" ] && [[ "$slug" != *"$FILTER"* ]] && continue
  sha="$(shasum -a 256 "$txt" | cut -d' ' -f1)"
  if [ -f "$OUT_DIR/$slug.bin" ] && [ "$(cat "$DONE_DIR/$slug.sha" 2>/dev/null)" = "$sha" ]; then
    skipped=$((skipped+1)); continue
  fi
  echo "[MAKE] $slug"
  if ! python3 - "$txt" "$VOICE" "$TMP" <<'PY_AUDIO'
import pathlib
import re
import subprocess
import sys
import tempfile
import time
import wave

try:
    source, voice, tmp = sys.argv[1:]
    text = pathlib.Path(source).read_text(encoding="utf-8")
    chunks = []
    chunk = ""
    for sentence in re.findall(r"[^。！？\n]*[。！？\n]|[^。！？\n]+$", text):
        for start in range(0, len(sentence), 2500):
            part = sentence[start:start + 2500]
            if len(chunk) + len(part) > 2500:
                chunks.append(chunk)
                chunk = ""
            chunk += part
    if chunk:
        chunks.append(chunk)
    if not chunks:
        raise ValueError("Empty input")

    with tempfile.TemporaryDirectory(dir=tmp) as work:
        with wave.open(str(pathlib.Path(tmp) / "a.aiff"), "wb") as output:
            expected = None
            for index, chunk in enumerate(chunks):
                txt_path = pathlib.Path(work) / "chunk.txt"
                wav_path = pathlib.Path(work) / "chunk.wav"
                txt_path.write_text(chunk, encoding="utf-8")
                ok = False
                for attempt in range(4):
                    use_voice = voice if attempt < 2 else "Kyoko"
                    try:
                        subprocess.run(
                            ["say", "-v", use_voice, "-f", str(txt_path),
                             "--file-format=WAVE", "--data-format=LEI16@22050",
                             "-o", str(wav_path)],
                            check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
                            timeout=30
                        )
                        if wav_path.exists() and wav_path.stat().st_size > 100:
                            ok = True
                            break
                    except Exception:
                        time.sleep(0.5)
                if not ok:
                    raise RuntimeError("say failed after retries")
                with wave.open(str(wav_path), "rb") as audio:
                    params = (audio.getnchannels(), audio.getsampwidth(),
                              audio.getframerate(), audio.getcomptype(),
                              audio.getcompname())
                    if expected is None:
                        expected = params
                        output.setparams(audio.getparams())
                    elif params != expected:
                        raise ValueError("Inconsistent WAV format")
                    while True:
                        frames = audio.readframes(65536)
                        if not frames:
                            break
                        output.writeframesraw(frames)
                wav_path.unlink()
except Exception:
    sys.exit(1)
PY_AUDIO
  then echo "  [NG] say 失敗"; failed=$((failed+1)); continue; fi
  if ! afconvert "$TMP/a.aiff" "$TMP/a.m4a" -f m4af -d aach -c 1 -b "$BITRATE" 2>/dev/null; then
    afconvert "$TMP/a.aiff" "$TMP/a.m4a" -f m4af -d aac -c 1 -b 32000 || { echo "  [NG] 変換失敗"; failed=$((failed+1)); continue; }
  fi
  IV="$(openssl rand -hex 16)"
  openssl enc -aes-256-cbc -K "$KEY" -iv "$IV" -in "$TMP/a.m4a" -out "$TMP/a.enc"
  { printf '%s' "$IV" | xxd -r -p; cat "$TMP/a.enc"; } > "$OUT_DIR/$slug.bin"
  echo "$sha" > "$DONE_DIR/$slug.sha"
  rm -f "$TMP/a.aiff" "$TMP/a.m4a" "$TMP/a.enc"
  echo "  [OK] $(du -h "$OUT_DIR/$slug.bin" | cut -f1)"
  made=$((made+1))
done
echo "[DONE] 作成 $made / 変更なしで省略 $skipped / 失敗 $failed"
echo "[INFO] audio/ の合計: $(du -sh "$OUT_DIR" | cut -f1)"
