/**
 * WhatsApp client via external Baileys service on Render.
 * The service runs separately and exposes REST API endpoints.
 */

const WHATSAPP_URL = process.env.WHATSAPP_SERVICE_URL;
const WHATSAPP_KEY = process.env.WHATSAPP_API_KEY;

export function isWhatsAppConfigured() {
  return !!(WHATSAPP_URL && WHATSAPP_KEY);
}

/**
 * Send a WhatsApp message to a phone number.
 * @param phone Phone number e.g. "0501234567" or "+972501234567"
 * @param message Message body
 */
export async function sendWhatsApp(phone: string, message: string): Promise<void> {
  if (!isWhatsAppConfigured()) {
    return;
  }

  const res = await fetch(`${WHATSAPP_URL}/send`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: WHATSAPP_KEY!,
    },
    body: JSON.stringify({ phone, message }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`WhatsApp send error ${res.status}: ${text}`);
  }
}

/**
 * Get WhatsApp service status (connected, qr_ready, disconnected, etc.)
 */
export async function getWhatsAppStatus() {
  if (!isWhatsAppConfigured()) {
    return { configured: false, status: "not_configured" as const };
  }

  const res = await fetch(`${WHATSAPP_URL}/status`, {
    headers: { apikey: WHATSAPP_KEY! },
    cache: "no-store",
  });

  return res.json();
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
