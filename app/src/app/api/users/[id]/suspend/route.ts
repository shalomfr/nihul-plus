import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as { role?: string }).role !== "ADMIN") {
    return NextResponse.json({ success: false, error: "לא מורשה" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return NextResponse.json({ success: false, error: "משתמש לא נמצא" }, { status: 404 });
    }
    if (user.role === "ADMIN") {
      return NextResponse.json({ success: false, error: "לא ניתן להשהות אדמין" }, { status: 403 });
    }

    const newStatus = user.status === "SUSPENDED" ? "APPROVED" : "SUSPENDED";

    await prisma.user.update({
      where: { id },
      data: { status: newStatus },
    });

    return NextResponse.json({
      success: true,
      data: { status: newStatus },
    });
  } catch {
    return NextResponse.json({ success: false, error: "שגיאה" }, { status: 500 });
  }
}
