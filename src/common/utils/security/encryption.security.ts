import crypto from "crypto";
import { BadRequestException } from "../../exceptions";
import { ENC_BYTE } from "../../../config/config";

const ENCRYPTION_IV_LENGTH = 16;

// ✅ حل المشكلة هنا
if (!ENC_BYTE) {
  throw new Error("ENC_BYTE is not defined in environment variables");
}

// 👇 دلوقتي بقت string فعلاً
const ENCRYPTION_KEY = Buffer.from(ENC_BYTE as string, "hex");

// ✅ check الطول
if (ENCRYPTION_KEY.length !== 32) {
  throw new Error("Encryption key must be 32 bytes (64 hex characters)");
}

export const generateEncryption = async (
  plaintext: string,
): Promise<string> => {
  if (!plaintext) {
    throw new BadRequestException("No data to encrypt");
  }

  const iv = crypto.randomBytes(ENCRYPTION_IV_LENGTH);

  const cipher = crypto.createCipheriv(
    "aes-256-cbc",
    ENCRYPTION_KEY,
    iv,
  );

  let encrypted = cipher.update(plaintext, "utf8", "hex");
  encrypted += cipher.final("hex");

  return `${iv.toString("hex")}:${encrypted}`;
};

export const generateDecryption = async (
  cipherText: string,
): Promise<string> => {
  if (!cipherText) {
    throw new BadRequestException("No cipher text provided");
  }

  const parts = cipherText.split(":");

  if (parts.length !== 2) {
    throw new BadRequestException("Invalid encryption format");
  }

  // ✅ حل المشكلة هنا
  const ivHex = parts[0];
  const encrypted = parts[1];

  if (!ivHex || !encrypted) {
    throw new BadRequestException("Invalid encryption parts");
  }

  const iv = Buffer.from(ivHex, "hex");

  const decipher = crypto.createDecipheriv(
    "aes-256-cbc",
    ENCRYPTION_KEY,
    iv,
  );

  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
};