import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { seedRegulatoryCalendar } from "@/lib/regulatory-calendar-seeds";

const BCRYPT_ROUNDS = 10;
const MIN_PASSWORD_LENGTH = 8;

const registerSchema = z.object({
  email: z.string().email("אימייל לא תקין"),
  password: z
    .string()
    .min(MIN_PASSWORD_LENGTH, `סיסמה חייבת להכיל לפחות ${MIN_PASSWORD_LENGTH} תווים`)
    .regex(/[A-Z]/, "סיסמה חייבת להכיל לפחות אות גדולה אחת")
    .regex(/[0-9]/, "סיסמה חייבת להכיל לפחות ספרה אחת"),
  name: z.string().min(2, "שם חייב להכיל לפחות 2 תווים"),
  organizationName: z.string().min(2, "שם עמותה חייב להכיל לפחות 2 תווים"),
  organizationNumber: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data = registerSchema.parse(body);

    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      return NextResponse.json(
        { success: false, error: "אימייל זה כבר רשום במערכת" },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(data.password, BCRYPT_ROUNDS);

    const org = await prisma.organization.create({
      data: {
        name: data.organizationName,
        number: data.organizationNumber ?? null,
      },
    });

    await prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        name: data.name,
        role: "MANAGER",
        organizationId: org.id,
        status: "PENDING",
      },
    });

    // Populate default compliance tasks for the new organization
    await seedRegulatoryCalendar(org.id);

    return NextResponse.json({
      success: true,
      message: "הבקשה נשלחה. תקבל עדכון במייל לאחר אישור.",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.issues[0]?.message ?? "נתונים לא תקינים";
      return NextResponse.json(
        { success: false, error: firstError },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: "שגיאה ברישום" },
      { status: 500 }
    );
  }
}
