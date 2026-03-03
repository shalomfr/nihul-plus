import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as { role?: string }).role !== "ADMIN") {
    return NextResponse.json({ success: false, error: "לא מורשה" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const tab = searchParams.get("tab") ?? "all";

  try {
    let where: Prisma.UserWhereInput = {};

    if (tab === "pending") {
      where = { role: "MANAGER", status: "PENDING" };
    } else if (tab === "active") {
      where = {
        OR: [
          { role: "ADMIN" },
          { role: "MANAGER", status: "APPROVED" },
        ],
      };
    }

    const users = await prisma.user.findMany({
      where: tab === "all" ? {} : where,
      include: { organization: true },
      orderBy: { createdAt: "desc" },
    });

    const safe = users.map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role,
      status: u.status,
      organizationName: u.organization?.name ?? "–",
      organizationNumber: u.organization?.number ?? "–",
      createdAt: u.createdAt,
    }));

    return NextResponse.json({ success: true, data: safe });
  } catch {
    return NextResponse.json({ success: false, error: "שגיאה" }, { status: 500 });
  }
}
