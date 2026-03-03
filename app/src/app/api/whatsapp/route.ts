import { getAuthSession, apiError } from "@/lib/api-helpers";
import { NextResponse } from "next/server";

const WA_URL = process.env.WHATSAPP_SERVICE_URL;
const WA_KEY = process.env.WHATSAPP_API_KEY;
const ALLOWED_ACTIONS = ["connect", "pair", "disconnect", "reset"] as const;
const DEFAULT_TIMEOUT_MS = 15000;

export async function GET() {
  const user = await getAuthSession();
  if (!user) return apiError("לא מחובר", 401);

  if (!WA_URL || !WA_KEY) {
    return NextResponse.json({ configured: false, status: "not_configured" });
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  try {
    const res = await fetch(`${WA_URL}/status`, {
      headers: { apikey: WA_KEY },
      cache: "no-store",
      signal: controller.signal,
    });
    return NextResponse.json(await res.json());
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function POST(req: Request) {
  const user = await getAuthSession();
  if (!user) return apiError("לא מחובר", 401);

  if (!WA_URL || !WA_KEY) {
    return apiError("WhatsApp לא מוגדר", 500);
  }

  const { action, phone } = await req.json();

  if (!action || !ALLOWED_ACTIONS.includes(action)) {
    return apiError("פעולה לא חוקית", 400);
  }

  const endpoint = `/${action}`;
  const body = action === "pair" ? JSON.stringify({ phone }) : undefined;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  try {
    const res = await fetch(`${WA_URL}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: WA_KEY },
      body,
      signal: controller.signal,
    });
    return NextResponse.json(await res.json());
  } finally {
    clearTimeout(timeoutId);
  }
}
