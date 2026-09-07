import { randomInt } from "node:crypto";

const CODE_TTL_MS = 5 * 60 * 1000; // 5分
const RESEND_COOLDOWN_MS = 60 * 1000; // 60秒
const MAX_ATTEMPTS = 5;
const TOKEN_TTL_MS = 180 * 24 * 60 * 60 * 1000; // 180日
const SWEEP_AGE_MS = 60 * 60 * 1000; // 1時間放置されたコードは掃除する

interface PendingCode {
  codeHash: string;
  expiresAt: number;
  attempts: number;
  lastSentAt: number;
}

// メモリ内ストア（DBを持たない現状の構成に合わせた最小実装）。サーバー再起動で
// 消えるが、コード自体が5分の短命なので実用上は再送信を促すだけで問題ない。
const pendingCodes = new Map<string, PendingCode>();

function getSecret(): string {
  const secret = process.env.EMAIL_VERIFICATION_SECRET;
  if (!secret) throw new Error("EMAIL_VERIFICATION_SECRET is not configured");
  return secret;
}

function bufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function hmac(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return bufferToHex(signature);
}

function constantTimeEquals(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return mismatch === 0;
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function generateCode(): string {
  return randomInt(0, 1_000_000).toString().padStart(6, "0");
}

function sweep(now: number) {
  for (const [key, entry] of pendingCodes) {
    if (now - entry.lastSentAt > SWEEP_AGE_MS) pendingCodes.delete(key);
  }
}

export async function issueCode(
  email: string
): Promise<{ code: string } | { error: "cooldown" }> {
  const key = normalizeEmail(email);
  const now = Date.now();
  sweep(now);

  const existing = pendingCodes.get(key);
  if (existing && now - existing.lastSentAt < RESEND_COOLDOWN_MS) {
    return { error: "cooldown" };
  }

  const code = generateCode();
  const codeHash = await hmac(getSecret(), `${key}:${code}`);
  pendingCodes.set(key, { codeHash, expiresAt: now + CODE_TTL_MS, attempts: 0, lastSentAt: now });
  return { code };
}

export async function checkCode(email: string, code: string): Promise<boolean> {
  const key = normalizeEmail(email);
  const entry = pendingCodes.get(key);
  if (!entry) return false;

  if (Date.now() > entry.expiresAt) {
    pendingCodes.delete(key);
    return false;
  }

  entry.attempts += 1;
  if (entry.attempts > MAX_ATTEMPTS) {
    pendingCodes.delete(key);
    return false;
  }

  const candidateHash = await hmac(getSecret(), `${key}:${code}`);
  const ok = constantTimeEquals(candidateHash, entry.codeHash);
  if (ok) pendingCodes.delete(key);
  return ok;
}

export async function createVerificationToken(email: string): Promise<string> {
  const key = normalizeEmail(email);
  const issuedAt = Date.now().toString();
  const signature = await hmac(getSecret(), `verified:${key}:${issuedAt}`);
  return `${issuedAt}.${signature}`;
}

export async function verifyVerificationToken(email: string, token: string): Promise<boolean> {
  const key = normalizeEmail(email);
  const [issuedAt, signature] = token.split(".");
  if (!issuedAt || !signature) return false;

  const age = Date.now() - Number(issuedAt);
  if (!Number.isFinite(age) || age < 0 || age > TOKEN_TTL_MS) return false;

  const expected = await hmac(getSecret(), `verified:${key}:${issuedAt}`);
  return constantTimeEquals(expected, signature);
}
