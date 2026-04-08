import crypto from "node:crypto";
export function randomToken(size = 32) {
    return crypto.randomBytes(size).toString("base64url");
}
export function deriveKey(passphrase, salt) {
    return crypto.scryptSync(passphrase, Buffer.from(salt, "base64url"), 32);
}
export function encryptJson(data, passphrase) {
    const salt = randomToken(16);
    const iv = crypto.randomBytes(12);
    const key = deriveKey(passphrase, salt);
    const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
    const ciphertext = Buffer.concat([cipher.update(JSON.stringify(data), "utf8"), cipher.final()]);
    const tag = cipher.getAuthTag();
    return {
        salt,
        iv: iv.toString("base64url"),
        tag: tag.toString("base64url"),
        data: ciphertext.toString("base64url")
    };
}
export function decryptJson(payload, passphrase) {
    const key = deriveKey(passphrase, payload.salt);
    const decipher = crypto.createDecipheriv("aes-256-gcm", key, Buffer.from(payload.iv, "base64url"));
    decipher.setAuthTag(Buffer.from(payload.tag, "base64url"));
    const plaintext = Buffer.concat([
        decipher.update(Buffer.from(payload.data, "base64url")),
        decipher.final()
    ]).toString("utf8");
    return JSON.parse(plaintext);
}
