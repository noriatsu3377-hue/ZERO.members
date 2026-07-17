(() => {
    const cryptoEngine = {
        async hashPassword(password, saltHex) {
            const enc = new TextEncoder();
            const saltBytes = enc.encode(saltHex);

            async function deriveRound(passStr, iterations, hashName) {
                const passBytes = enc.encode(passStr);
                const keyMaterial = await window.crypto.subtle.importKey(
                    "raw",
                    passBytes,
                    { name: "PBKDF2" },
                    false,
                    ["deriveBits"]
                );
                const bits = await window.crypto.subtle.deriveBits(
                    {
                        name: "PBKDF2",
                        salt: saltBytes,
                        iterations: iterations,
                        hash: hashName
                    },
                    keyMaterial,
                    256
                );
                const bytes = new Uint8Array(bits);
                return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
            }

            const r1 = await deriveRound(password, 1000, "SHA-1");
            const r2 = await deriveRound(r1, 14000, "SHA-256");
            const r3 = await deriveRound(r2, 585000, "SHA-256");
            return r3;
        }
    };

    const codec = {
        init(engine) {
            return {
                async decode(encryptedMsg, hashedPasswordHex, saltHex) {
                    try {
                        function hexToBytes(hex) {
                            const bytes = new Uint8Array(hex.length / 2);
                            for (let i = 0; i < bytes.length; i++) {
                                bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
                            }
                            return bytes;
                        }

                        if (!encryptedMsg || encryptedMsg.length < 96) {
                            return { success: false };
                        }

                        const hmacHex = encryptedMsg.slice(0, 64);
                        const ivHex = encryptedMsg.slice(64, 96);
                        const ciphertextHex = encryptedMsg.slice(96);
                        const payloadToVerify = encryptedMsg.slice(64);

                        const keyBytes = hexToBytes(hashedPasswordHex);
                        const ivBytes = hexToBytes(ivHex);
                        const ciphertextBytes = hexToBytes(ciphertextHex);

                        const hmacKey = await window.crypto.subtle.importKey(
                            "raw",
                            keyBytes,
                            { name: "HMAC", hash: "SHA-256" },
                            false,
                            ["verify"]
                        );
                        const payloadBytes = new TextEncoder().encode(payloadToVerify);
                        const expectedHmacBytes = hexToBytes(hmacHex);
                        const isHmacValid = await window.crypto.subtle.verify(
                            "HMAC",
                            hmacKey,
                            expectedHmacBytes,
                            payloadBytes
                        );

                        if (!isHmacValid) {
                            return { success: false };
                        }

                        const aesKey = await window.crypto.subtle.importKey(
                            "raw",
                            keyBytes,
                            { name: "AES-CBC" },
                            false,
                            ["decrypt"]
                        );
                        const decryptedBuffer = await window.crypto.subtle.decrypt(
                            { name: "AES-CBC", iv: ivBytes },
                            aesKey,
                            ciphertextBytes
                        );

                        const plainHTML = new TextDecoder().decode(decryptedBuffer);
                        return { success: true, decoded: plainHTML };
                    } catch (e) {
                        console.error("Decryption failed:", e);
                        return { success: false };
                    }
                }
            };
        }
    };

    const decode = codec.init(cryptoEngine).decode;

    function init(staticryptConfig, templateConfig) {
        const exports = {};

        async function decryptAndReplaceHtml(hashedPassword) {
            const { staticryptEncryptedMsgUniqueVariableName, staticryptSaltUniqueVariableName } = staticryptConfig;
            const { replaceHtmlCallback } = templateConfig;

            const result = await decode(
                staticryptEncryptedMsgUniqueVariableName,
                hashedPassword,
                staticryptSaltUniqueVariableName
            );
            if (!result.success) {
                return false;
            }
            const plainHTML = result.decoded;

            if (typeof replaceHtmlCallback === "function") {
                replaceHtmlCallback(plainHTML);
            } else {
                document.write(plainHTML);
                document.close();
            }

            return true;
        }

        async function handleDecryptionOfPage(password, isRememberChecked) {
            const { staticryptSaltUniqueVariableName } = staticryptConfig;
            const hashedPassword = await cryptoEngine.hashPassword(password, staticryptSaltUniqueVariableName);
            return handleDecryptionOfPageFromHash(hashedPassword, isRememberChecked);
        }
        exports.handleDecryptionOfPage = handleDecryptionOfPage;

        async function handleDecryptionOfPageFromHash(hashedPassword, isRememberChecked) {
            const { isRememberEnabled, rememberDurationInDays } = staticryptConfig;
            const { rememberExpirationKey, rememberPassphraseKey } = templateConfig;

            const isDecryptionSuccessful = await decryptAndReplaceHtml(hashedPassword);

            if (!isDecryptionSuccessful) {
                return {
                    isSuccessful: false,
                    hashedPassword,
                };
            }

            if (isRememberEnabled && isRememberChecked) {
                window.localStorage.setItem(rememberPassphraseKey, hashedPassword);
                if (rememberDurationInDays > 0) {
                    window.localStorage.setItem(
                        rememberExpirationKey,
                        (new Date().getTime() + rememberDurationInDays * 24 * 60 * 60 * 1000).toString()
                    );
                }
            }

            return {
                isSuccessful: true,
                hashedPassword,
            };
        }
        exports.handleDecryptionOfPageFromHash = handleDecryptionOfPageFromHash;

        function clearLocalStorage() {
            const { clearLocalStorageCallback, rememberExpirationKey, rememberPassphraseKey } = templateConfig;

            if (typeof clearLocalStorageCallback === "function") {
                clearLocalStorageCallback();
            } else {
                localStorage.removeItem(rememberPassphraseKey);
                localStorage.removeItem(rememberExpirationKey);
            }
        }

        async function handleDecryptOnLoad() {
            let isSuccessful = await decryptOnLoadFromUrl();

            if (!isSuccessful) {
                isSuccessful = await decryptOnLoadFromRememberMe();
            }

            return { isSuccessful };
        }
        exports.handleDecryptOnLoad = handleDecryptOnLoad;

        function logoutIfNeeded() {
            const logoutKey = "staticrypt_logout";
            const queryParams = new URLSearchParams(window.location.search);
            if (queryParams.has(logoutKey)) {
                clearLocalStorage();
                return true;
            }
            const hash = window.location.hash.substring(1);
            if (hash.includes(logoutKey)) {
                clearLocalStorage();
                return true;
            }
            return false;
        }

        async function decryptOnLoadFromRememberMe() {
            const { rememberDurationInDays } = staticryptConfig;
            const { rememberExpirationKey, rememberPassphraseKey } = templateConfig;

            if (logoutIfNeeded()) {
                return false;
            }

            if (rememberDurationInDays && rememberDurationInDays > 0) {
                const expiration = localStorage.getItem(rememberExpirationKey),
                    isExpired = expiration && new Date().getTime() > parseInt(expiration);

                if (isExpired) {
                    clearLocalStorage();
                    return false;
                }
            }

            const hashedPassword = localStorage.getItem(rememberPassphraseKey);

            if (hashedPassword) {
                const isDecryptionSuccessful = await decryptAndReplaceHtml(hashedPassword);
                if (!isDecryptionSuccessful) {
                    clearLocalStorage();
                    return false;
                }
                return true;
            }

            return false;
        }

        async function decryptOnLoadFromUrl() {
            const passwordKey = "staticrypt_pwd";
            const rememberMeKey = "remember_me";

            const queryParams = new URLSearchParams(window.location.search);
            const hashedPasswordQuery = queryParams.get(passwordKey);
            const rememberMeQuery = queryParams.get(rememberMeKey);

            const urlFragment = window.location.hash.substring(1);
            const hashedPasswordRegexMatch = urlFragment.match(new RegExp(passwordKey + "=([^&]*)"));
            const hashedPasswordFragment = hashedPasswordRegexMatch ? hashedPasswordRegexMatch[1] : null;
            const rememberMeFragment = urlFragment.includes(rememberMeKey);

            const hashedPassword = hashedPasswordFragment || hashedPasswordQuery;
            const rememberMe = rememberMeFragment || rememberMeQuery;

            if (hashedPassword) {
                return handleDecryptionOfPageFromHash(hashedPassword, rememberMe);
            }

            return false;
        }

        return exports;
    }

    return { init: init };
})()
