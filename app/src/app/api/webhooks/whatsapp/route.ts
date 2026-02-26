/**
 * Twilio WhatsApp Webhook — handles incoming messages.
 * Configure in Twilio console: Messaging → WhatsApp → Webhook URL
 * POST /api/webhooks/whatsapp
 *
 * Supported commands (case-insensitive):
 *   "אשר [transferId]" → approves a pending transfer
 *   "דחה [transferId]" → rejects a pending transfer
 *   "סטטוס" → returns org status summary
 */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendWhatsApp } from "@/lib/whatsapp";

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
      `🔗 ${process.env.NEXT_PUBLIC_APP_URL ?? "https://matefet-app.azurewebsites.net"}/portal`,
    ].join("\n");
  }

  return null;
}
