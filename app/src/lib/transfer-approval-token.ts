/**
 * Transfer Approval Token — HMAC-SHA256 signed tokens for email/WhatsApp approval links.
 * No DB changes needed. Tokens encode: transferId + signatoryId + expiry.
 * Tokens are single-use enforced by checking if an approval already exists.
 */
import { createHmac } from "crypto";

const SECRET = process.env.TRANSFER_APPROVAL_SECRET ?? process.env.NEXTAUTH_SECRET ?? "fallback-secret";
const TTL_MS = 48 * 60 * 60 * 1000; // 48 hours

interface TokenPayload {
  transferId: string;
  signatoryId: string;
  exp: number; // Unix timestamp ms
}

export function createApprovalToken(transferId: string, signatoryId: string): string {
  const payload: TokenPayload = {
    transferId,
    signatoryId,
    exp: Date.now() + TTL_MS,
  };
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = createHmac("sha256", SECRET).update(payloadB64).digest("hex");
  return `${payloadB64}.${sig}`;
}

export function verifyApprovalToken(token: string): TokenPayload {
  const parts = token.split(".");
  if (parts.length !== 2) throw new Error("Invalid token format");

  const [payloadB64, sig] = parts;
  const expectedSig = createHmac("sha256", SECRET).update(payloadB64).digest("hex");

  if (sig !== expectedSig) throw new Error("Invalid token signature");

  const payload: TokenPayload = JSON.parse(Buffer.from(payloadB64, "base64url").toString());

  if (Date.now() > payload.exp) throw new Error("Token expired");

  return payload;
}
