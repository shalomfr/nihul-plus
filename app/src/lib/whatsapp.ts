/**
 * WhatsApp client via Twilio REST API.
 * Uses fetch — no SDK dependency required.
 */

const TWILIO_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_FROM = process.env.TWILIO_WHATSAPP_FROM ?? "whatsapp:+14155238886";

function isConfigured() {
  return !!(TWILIO_SID && TWILIO_TOKEN);
}

/**
 * Send a WhatsApp message to a phone number.
 * @param to Phone number in E.164 format e.g. +972501234567
 * @param body Message body (max ~1600 chars)
 */
export async function sendWhatsApp(to: string, body: string): Promise<void> {
  if (!isConfigured()) {
    console.log(`[DEV WhatsApp] to: ${to}`);
    console.log(`[DEV WhatsApp] body: ${body.slice(0, 200)}`);
    return;
  }

  const toFormatted = to.startsWith("whatsapp:") ? to : `whatsapp:${to}`;

  const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}/Messages.json`;
  const auth = Buffer.from(`${TWILIO_SID}:${TWILIO_TOKEN}`).toString("base64");

  const body_ = new URLSearchParams({
    From: TWILIO_FROM,
    To: toFormatted,
    Body: body,
  });

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body_.toString(),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Twilio error ${res.status}: ${text}`);
  }
}

/**
 * Build the morning digest WhatsApp message (short, with emoji).
 */
export function buildMorningDigestWhatsApp(params: {
  orgName: string;
  bankBalance: number | null;
  pendingTransfers: number;
  upcomingDeadlines: number;
  alerts: number;
  appUrl: string;
}): string {
  const balance =
    params.bankBalance !== null
      ? `₪${params.bankBalance.toLocaleString("he-IL")}`
      : "לא מחובר";

  return [
    `☀️ *בוקר טוב, ${params.orgName}!*`,
    ``,
    `📊 יתרת בנק: *${balance}*`,
    `✍️ אישורים ממתינים: *${params.pendingTransfers}* העברות`,
    `📅 דדליינים השבוע: *${params.upcomingDeadlines}* פריטים`,
    params.alerts > 0 ? `🚨 התראות: *${params.alerts}* דורשים תשומת לב` : `✅ אין התראות דחופות`,
    ``,
    `👉 ${params.appUrl}/portal`,
  ].join("\n");
}

/**
 * Build transfer approval WhatsApp message.
 */
export function buildTransferApprovalWhatsApp(params: {
  signatoryName: string;
  amount: number;
  purpose: string;
  transferId: string;
  token: string;
  appUrl: string;
}): string {
  const approveUrl = `${params.appUrl}/approve/${params.token}`;
  return [
    `✍️ *נדרשת חתימתך*`,
    ``,
    `העברה בנקאית של *₪${params.amount.toLocaleString("he-IL")}*`,
    `מטרה: ${params.purpose}`,
    ``,
    `לאישור או דחייה — לחץ על הקישור:`,
    approveUrl,
    ``,
    `_הקישור תקף ל-48 שעות_`,
  ].join("\n");
}
