#!/usr/bin/env python3
"""
StatiCrypt v3 Compatible Encryption Engine & Template Builder (Python Fallback)
Implements AES-256-CBC, 3-round PBKDF2 (SHA-1 1k -> SHA-256 14k -> SHA-256 585k), and HMAC-SHA256.
Uses macOS CommonCrypto via ctypes for native C-speed AES-256 encryption without external pip packages.
"""

import os
import sys
import json
import hmac
import hashlib
import ctypes
import re
import argparse
from pathlib import Path

# Load macOS CommonCrypto
try:
    _cc = ctypes.CDLL('/usr/lib/system/libcommonCrypto.dylib')
    _kCCEncrypt = 0
    _kCCAlgorithmAES128 = 0  # CommonCrypto uses kCCAlgorithmAES128 (0) for all AES key sizes (128/192/256 determined by key length)
    _kCCOptionPKCS7Padding = 1
except Exception as e:
    sys.stderr.write(f"Error loading libcommonCrypto.dylib: {e}\n")
    sys.exit(1)


def aes_cbc_encrypt(key: bytes, iv: bytes, data: bytes) -> bytes:
    out = ctypes.create_string_buffer(len(data) + 16)
    out_len = ctypes.c_size_t(0)
    res = _cc.CCCrypt(
        _kCCEncrypt,
        _kCCAlgorithmAES128,
        _kCCOptionPKCS7Padding,
        key,
        len(key),
        iv,
        data,
        len(data),
        out,
        len(out),
        ctypes.byref(out_len),
    )
    if res != 0:
        raise RuntimeError(f"CCCrypt encrypt failed with error code {res}")
    return out.raw[: out_len.value]


def hash_password(password: str, salt_hex: str) -> str:
    pwd_bytes = password.encode('utf-8')
    salt_bytes = salt_hex.encode('utf-8')

    # Round 1: Legacy SHA-1, 1000 iterations
    r1 = hashlib.pbkdf2_hmac('sha1', pwd_bytes, salt_bytes, 1000).hex()

    # Round 2: SHA-256, 14000 iterations
    r2 = hashlib.pbkdf2_hmac(
        'sha256', r1.encode('utf-8'), salt_bytes, 14000
    ).hex()

    # Round 3: SHA-256, 585000 iterations
    r3 = hashlib.pbkdf2_hmac(
        'sha256', r2.encode('utf-8'), salt_bytes, 585000
    ).hex()

    return r3


def encode_with_hashed_password(contents: str, hashed_password_hex: str) -> str:
    iv = os.urandom(16)
    key = bytes.fromhex(hashed_password_hex)

    ciphertext = aes_cbc_encrypt(key, iv, contents.encode('utf-8'))
    encrypted_msg = iv.hex() + ciphertext.hex()

    hmac_hex = hmac.new(
        key, encrypted_msg.encode('utf-8'), hashlib.sha256
    ).hexdigest()

    return hmac_hex + encrypted_msg


def render_template(template_string: str, data: dict) -> str:
    def replacer(match):
        key = match.group(1)
        if key not in data or data[key] is None:
            return match.group(0)
        val = data[key]
        if isinstance(val, (dict, list)):
            return json.dumps(val)
        return str(val)

    return re.sub(r'\/\*\[\|\s*(\w+)\s*\|]\*\/\s*0', replacer, template_string)


def main():
    parser = argparse.ArgumentParser(
        description="StatiCrypt Python Fallback Builder"
    )
    parser.add_argument(
        "--password", required=True, help="Password for encryption"
    )
    parser.add_argument(
        "--input-dir",
        default="private_html",
        help="Input directory containing plaintext HTML files",
    )
    parser.add_argument(
        "--output-dir",
        default=".",
        help="Output directory for encrypted HTML files",
    )
    parser.add_argument(
        "--template",
        default="template_zero.html",
        help="Template HTML file path",
    )
    parser.add_argument(
        "--remember", type=int, default=31, help="Remember me duration in days"
    )
    args = parser.parse_args()

    input_dir = Path(args.input_dir)
    output_dir = Path(args.output_dir)
    template_path = Path(args.template)

    if not input_dir.exists() or not input_dir.is_dir():
        sys.stderr.write(f"Input directory not found: {input_dir}\n")
        sys.exit(1)

    if not template_path.exists():
        sys.stderr.write(f"Template file not found: {template_path}\n")
        sys.exit(1)

    # Load template
    template_str = template_path.read_text(encoding='utf-8')

    # Load staticryptJs.js
    js_path = Path(__file__).parent / "staticryptJs.js"
    if not js_path.exists():
        sys.stderr.write(f"staticryptJs.js not found at {js_path}\n")
        sys.exit(1)
    js_staticrypt_code = js_path.read_text(encoding='utf-8')

    # Generate 16-byte random salt
    salt_hex = os.urandom(16).hex()
    print(f"Generating key structure with salt: {salt_hex} ...")
    hashed_password_hex = hash_password(args.password, salt_hex)

    html_files = list(input_dir.glob("*.html"))
    if not html_files:
        print(f"No HTML files found in {input_dir}")
        return

    is_remember_enabled = args.remember > 0

    print(
        f"Encrypting {len(html_files)} HTML files using StatiCrypt AES-256-CBC engine..."
    )

    for html_file in html_files:
        contents = html_file.read_text(encoding='utf-8')
        encrypted_msg = encode_with_hashed_password(
            contents, hashed_password_hex
        )

        # Title extraction or fallback
        title_match = re.search(
            r'<title>(.*?)</title>', contents, re.IGNORECASE
        )
        template_title = (
            title_match.group(1).replace(' | 零 -ZERO- MEMBERS', '').strip()
            if title_match
            else html_file.stem
        )

        staticrypt_config = {
            "staticryptEncryptedMsgUniqueVariableName": encrypted_msg,
            "isRememberEnabled": is_remember_enabled,
            "rememberDurationInDays": args.remember,
            "staticryptSaltUniqueVariableName": salt_hex,
        }

        template_data = {
            "is_remember_enabled": json.dumps(is_remember_enabled),
            "js_staticrypt": js_staticrypt_code,
            "template_button": "認証してページを開く",
            "template_color_primary": "",
            "template_color_secondary": "",
            "template_error": "合言葉が正しくありません。再度入力してください。",
            "template_instructions": "今月の合言葉を入力してください",
            "template_placeholder": "合言葉を入力",
            "template_remember": f"合言葉を{args.remember}日間記憶する",
            "template_title": template_title,
            "template_toggle_show": "合言葉を表示",
            "template_toggle_hide": "合言葉を隠す",
            "staticrypt_config": staticrypt_config,
        }

        rendered = render_template(template_str, template_data)
        out_file = output_dir / html_file.name
        out_file.write_text(rendered, encoding='utf-8')
        print(f"  [OK] Encrypted {html_file.name} -> {out_file}")

    print("All target files successfully encrypted and built.")


if __name__ == "__main__":
    main()
