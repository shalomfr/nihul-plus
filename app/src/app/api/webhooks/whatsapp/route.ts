/**
 * Twilio WhatsApp Webhook — handles incoming messages.
 * Configure in Twilio console: Messaging → WhatsApp → Webhook URL
 * POST /api/webhooks/whatsapp
 *
 * Supported commands (case-insensitive):
 *   "אשר [transferId]" → approves a pending transfer
 *   "דחה [transferId]" → rejects a pending transfer
 *   "סטטוס" → returns org status summary
 *   "תרומות" → weekly donations summary
 *   "דדליין" → upcoming compliance deadlines
 *   "קבלה [donationId]" → sends Section 46 receipt to donor
 *   "עזרה" → lists all commands
 */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendWhatsApp } from "@/lib/whatsapp";
import { generateReceiptText } from "@/lib/receipt-generator";

export async function POST(req: Request) {
  const body = await req.text();
  const params = new URLSearchParams(body);

  const from = params.get("From") ?? ""; // whatsapp:+972501234567
  const msgBody = (params.get("Body") ?? "").trim();
  const phone = from.replace("whatsapp:", "");

  if (!phone || !msgBody) {
    return NextResponse.json({ ok: true });
  }

  const response = await handleWhatsAppCommand(phone, msgBody);
  if (response) {
    await sendWhatsApp(phone, response).catch(console.error);
  }

  // Twilio expects a TwiML response or empty 200
  return new NextResponse(
    `<?xml version="1.0" encoding="UTF-8"?><Response></Response>`,
    { headers: { "Content-Type": "text/xml" } }
  );
}

async function handleWhatsAppCommand(phone: string, body: string): Promise<string | null> {
  const lower = body.toLowerCase().trim();

  // Find board member by phone
  const member = await prisma.boardMember.findFirst({
    where: { phone },
    include: { organization: true },
  });

  if (!member) {
    return "מספר זה אינו רשום במערכת מעטפת.";
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://matefet-app.azurewebsites.net";

  if (lower === "סטטוס" || lower === "status") {
    const [pending, overdue] = await Promise.all([
      prisma.bankTransfer.count({
        where: { organizationId: member.organizationId, status: "PENDING_APPROVAL" },
      }),
      prisma.complianceItem.count({
        where: { organizationId: member.organizationId, status: "EXPIRED", dueDate: { lt: new Date() } },
      }),
    ]);
    return [
      `📊 *${member.organization.name}*`,
      `✍️ העברות ממתינות: *${pending}*`,
      `🚨 פריטים באיחור: *${overdue}*`,
      ``,
      `🔗 ${appUrl}/portal`,
    ].join("\n");
  }

  // תרומות — donations this week
  if (lower === "תרומות" || lower === "donations") {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const donations = await prisma.donation.findMany({
      where: {
        organizationId: member.organizationId,
        donatedAt: { gte: weekAgo },
        status: "COMPLETED",
      },
    });
    const total = donations.reduce((s, d) => s + d.amount, 0);
    return [
      `💙 *תרומות השבוע — ${member.organization.name}*`,
      `📦 מספר תרומות: *${donations.length}*`,
      `💰 סכום כולל: *₪${total.toLocaleString("he-IL")}*`,
      ``,
      `לפרטים: ${appUrl}/portal`,
    ].join("\n");
  }

  // דדליין — upcoming compliance deadlines
  if (lower === "דדליין" || lower === "deadline") {
    const thirtyDays = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const items = await prisma.complianceItem.findMany({
      where: {
        organizationId: member.organizationId,
        dueDate: { lte: thirtyDays },
        status: { in: ["WARNING", "EXPIRED", "MISSING"] },
      },
      orderBy: { dueDate: "asc" },
      take: 5,
    });

    if (items.length === 0) {
      return "✅ אין דדליינים קרובים — הכל תקין!";
    }

    const lines = [
      `🗓️ *דדליינים קרובים — ${member.organization.name}*`,
      "",
    ];
    for (const item of items) {
      const dueStr = item.dueDate ? new Date(item.dueDate).toLocaleDateString("he-IL") : "—";
      const icon = item.status === "EXPIRED" ? "🔴" : item.status === "WARNING" ? "🟡" : "⚪";
      lines.push(`${icon} ${item.name} — ${dueStr}`);
    }
    return lines.join("\n");
  }

  // קבלה [id] — send Section 46 receipt to donor
  const receiptMatch = lower.match(/^קבלה\s+(.+)/);
  if (receiptMatch) {
    const donationId = receiptMatch[1].trim();
    const donation = await prisma.donation.findFirst({
      where: { id: donationId, organizationId: member.organizationId },
      include: { donor: true, organization: true },
    });

    if (!donation) {
      return `❌ תרומה עם מזהה "${donationId}" לא נמצאה`;
    }
    if (!donation.donor?.email) {
      return `⚠️ אין כתובת מייל לתורם — לא ניתן לשלוח קבלה`;
    }

    const receiptNumber = await prisma.donation.count({
      where: { organizationId: donation.organizationId, donatedAt: { lte: donation.donatedAt } },
    });

    const receiptText = generateReceiptText({
      receiptNumber,
      donorName: `${donation.donor.firstName} ${donation.donor.lastName}`.trim(),
      amount: donation.amount,
      donatedAt: donation.donatedAt,
      organizationName: donation.organization.name,
      organizationNumber: donation.organization.number ?? "",
    });

    // Send receipt email (async, don't wait)
    fetch(`${appUrl}/api/automations/run`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "send_missing_receipts" }),
    }).catch(console.error);

    return `✅ קבלה נשלחת ל-${donation.donor.email}\n\n${receiptText}`;
  }

  // עזרה — help
  if (lower === "עזרה" || lower === "help") {
    return [
      `🤖 *פקודות מעטפת WhatsApp*`,
      ``,
      `📊 *סטטוס* — סיכום שוטף של הארגון`,
      `💙 *תרומות* — תרומות השבוע`,
      `🗓️ *דדליין* — דדליינים קרובים`,
      `📧 *קבלה [id]* — שלח קבלת סעיף 46 לתורם`,
      `✅ *אשר [id]* — אשר העברה בנקאית`,
      `❌ *דחה [id]* — דחה העברה בנקאית`,
      ``,
      `🔗 ${appUrl}/portal`,
    ].join("\n");
  }

  return null;
}
