import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const [userCount, orgCount, complianceCount, meetingCount] = await Promise.all([
      prisma.user.count(),
      prisma.organization.count(),
      prisma.complianceItem.count(),
      prisma.boardMeeting.count(),
    ]);

    const users = await prisma.user.findMany({
      select: { email: true, role: true, organizationId: true },
    });

    return NextResponse.json({
      ok: true,
      counts: { userCount, orgCount, complianceCount, meetingCount },
      users,
    });
  } catch (e: unknown) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
