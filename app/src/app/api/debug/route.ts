import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const [users, orgs, compliance, meetings, boardMembers, events] = await Promise.all([
      prisma.user.count(),
      prisma.organization.count(),
      prisma.complianceItem.count(),
      prisma.boardMeeting.count(),
      prisma.boardMember.count(),
      prisma.adminEvent.count(),
    ]);

    return NextResponse.json({
      counts: { users, orgs, compliance, meetings, boardMembers, events },
      timestamp: new Date().toISOString(),
    });
  } catch (e: unknown) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
