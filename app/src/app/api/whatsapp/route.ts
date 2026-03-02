import { NextResponse } from "next/server";

const WA_URL = process.env.WHATSAPP_SERVICE_URL;
const WA_KEY = process.env.WHATSAPP_API_KEY;

export async function GET() {
  if (!WA_URL || !WA_KEY) {
    return NextResponse.json({ configured: false, status: "not_configured" });
  }
  const res = await fetch(`${WA_URL}/status`, {
    headers: { apikey: WA_KEY },
    cache: "no-store",
  });
  return NextResponse.json(await res.json());
}

export async function POST(req: Request) {
  if (!WA_URL || !WA_KEY) {
    return NextResponse.json({ error: "Not configured" }, { status: 500 });
  }
  const { action, phone } = await req.json();

  const endpoint = action === "pair" ? "/pair" : `/${action}`;
  const body = action === "pair" ? JSON.stringify({ phone }) : undefined;

  const res = await fetch(`${WA_URL}${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: WA_KEY,
    },
    body,
  });
  return NextResponse.json(await res.json());
}
