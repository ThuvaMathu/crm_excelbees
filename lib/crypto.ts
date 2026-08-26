import crypto from "crypto";
import { logger } from "@/lib/logger";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;

/**
 * Gets the raw secret used for encryption/signing. Throws if neither
 * ENCRYPTION_KEY nor NEXTAUTH_SECRET is configured — a silent fallback to a
 * hardcoded string would make all "encrypted" data (e.g. SMTP passwords)
 * trivially decryptable by anyone who reads this source file.
 */
function getEncryptionSecret(): string {
  const secret = process.env.ENCRYPTION_KEY || process.env.NEXTAUTH_SECRET;
  if (!secret) {
    throw new Error(
      "ENCRYPTION_KEY (or NEXTAUTH_SECRET) must be set to use encryption/signing."
    );
  }
  return secret;
}

/**
 * Derives a 32-byte key from the secret and a salt. A random per-encryption
 * salt is used (see `encrypt`) so the same plaintext never derives the same
 * key/ciphertext twice and rainbow-table attacks aren't feasible.
 */
function getEncryptionKey(salt: string): Buffer {
  return crypto.scryptSync(getEncryptionSecret(), salt, 32);
}

/**
 * Signs a value (e.g. a tracked redirect URL) with HMAC-SHA256 so it can be
 * verified later without being reversible/guessable by a third party.
 */
export function signValue(value: string): string {
  return crypto.createHmac("sha256", getEncryptionSecret()).update(value).digest("hex").slice(0, 32);
}

/**
 * Verifies a value against a previously generated signature using a
 * constant-time comparison.
 */
export function verifySignedValue(value: string, signature: string): boolean {
  const expected = signValue(value);
  const expectedBuf = Buffer.from(expected, "hex");
  const actualBuf = Buffer.from(signature, "hex");
  if (expectedBuf.length !== actualBuf.length) return false;
  return crypto.timingSafeEqual(expectedBuf, actualBuf);
}

/**
 * Encrypts text using AES-256-GCM.
 * Returns a colon-separated string: salt:iv:tag:encryptedText
 */
export function encrypt(text: string): string {
  if (!text) return text;

  const salt = crypto.randomBytes(SALT_LENGTH);
  const iv = crypto.randomBytes(IV_LENGTH);
  const key = getEncryptionKey(salt.toString("hex"));

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");

  const tag = cipher.getAuthTag();

  return `${salt.toString("hex")}:${iv.toString("hex")}:${tag.toString("hex")}:${encrypted}`;
}

/**
 * Decrypts text previously encrypted with the `encrypt` function. Also
 * supports the legacy 3-part format (iv:tag:encrypted, static salt) for
 * data encrypted before per-value salts were introduced.
 */
export function decrypt(encryptedText: string): string {
  if (!encryptedText) return encryptedText;

  try {
    const parts = encryptedText.split(":");

    let salt: string;
    let iv: Buffer;
    let tag: Buffer;
    let text: string;

    if (parts.length === 4) {
      [salt, , , ] = parts;
      iv = Buffer.from(parts[1], "hex");
      tag = Buffer.from(parts[2], "hex");
      text = parts[3];
    } else if (parts.length === 3) {
      // Legacy format encrypted with the old static salt.
      salt = "salt";
      iv = Buffer.from(parts[0], "hex");
      tag = Buffer.from(parts[1], "hex");
      text = parts[2];
    } else {
      throw new Error("Invalid encrypted text format");
    }

    const key = getEncryptionKey(salt);

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);

    let decrypted = decipher.update(text, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch (error) {
    logger.warn("Decryption failed", { module: "crypto", action: "decrypt", error });
    return ""; // Return empty string on failure to avoid leaking info
  }
}
