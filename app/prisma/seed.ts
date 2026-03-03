import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { seedRegulatoryCalendar } from "../src/lib/regulatory-calendar-seeds";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // ==================== ADMIN USER ====================
  const adminEmail = process.env.ADMIN_EMAIL ?? "admin@matefet.co.il";
  const adminPassword = process.env.ADMIN_PASSWORD ?? "Admin123!";
  const passwordHash = await bcrypt.hash(adminPassword, 10);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      passwordHash,
      name: "מנהל מערכת",
      role: "ADMIN",
    },
  });
  console.log(`Admin: ${admin.email}`);

  // ==================== ORGANIZATION ====================
  const org = await prisma.organization.upsert({
    where: { id: "org-or-letzion" },
    update: {},
    create: {
      id: "org-or-letzion",
      name: "עמותת אור לציון",
      number: "580123456",
      address: "רחוב הרצל 15, ירושלים",
      phone: "02-6234567",
      email: "info@or-letzion.org.il",
    },
  });
  console.log(`Organization: ${org.name}`);

  // ==================== MANAGER USER ====================
  const managerHash = await bcrypt.hash("Manager123!", 10);
  await prisma.user.upsert({
    where: { email: "yossi@or-letzion.org.il" },
    update: {},
    create: {
      email: "yossi@or-letzion.org.il",
      passwordHash: managerHash,
      name: "יוסי לוי",
      role: "MANAGER",
      status: "APPROVED",
      organizationId: org.id,
    },
  });
  console.log("Manager: yossi@or-letzion.org.il");

  // ==================== REGULATORY CALENDAR ====================
  const seededItems = await seedRegulatoryCalendar(org.id);
  console.log(`Regulatory calendar: ${seededItems} items seeded`);

  // ==================== BOARD MEMBERS ====================
  const boardMembers = [
    { name: "יוסי לוי", role: "יו\"ר", email: "yossi@or-letzion.org.il", phone: "050-1234567", isAuthorizedSignatory: true },
    { name: "שרה כהן", role: "מזכירה", email: "sara@or-letzion.org.il", phone: "050-2345678", isAuthorizedSignatory: true },
    { name: "דוד מזרחי", role: "גזבר", email: "david@or-letzion.org.il", phone: "050-3456789", isAuthorizedSignatory: false },
    { name: "רחל אברהם", role: "חברת ועד", email: "rachel@or-letzion.org.il", phone: "050-4567890", isAuthorizedSignatory: false },
    { name: "משה פרידמן", role: "חבר ועד", email: "moshe@or-letzion.org.il", phone: "050-5678901", isAuthorizedSignatory: false },
  ];

  for (const member of boardMembers) {
    const existing = await prisma.boardMember.findFirst({
      where: { organizationId: org.id, name: member.name },
    });
    if (!existing) {
      await prisma.boardMember.create({
        data: {
          organizationId: org.id,
          ...member,
          startDate: new Date(2025, 0, 1),
          isActive: true,
        },
      });
    }
  }
  console.log(`Board members: ${boardMembers.length} seeded`);

  // ==================== BOARD MEETINGS ====================
  const now = new Date();
  const meetings = [
    { title: "ישיבת ועד מנהל #12", date: new Date(now.getFullYear(), now.getMonth() - 1, 15), status: "COMPLETED", location: "משרדי העמותה", attendeesCount: 5, summary: "אושר תקציב רבעוני, דווח על התקדמות פרויקטים" },
    { title: "ישיבת ועד מנהל #11", date: new Date(now.getFullYear(), now.getMonth() - 2, 10), status: "COMPLETED", location: "משרדי העמותה", attendeesCount: 4, summary: "אושרו הוצאות חריגות, נדונה העסקת עובד חדש" },
    { title: "אסיפה כללית שנתית 2025", date: new Date(now.getFullYear(), now.getMonth() - 3, 20), status: "COMPLETED", location: "אולם הקהילה, ירושלים", attendeesCount: 23, summary: "אושרו דוחות שנתיים, נבחרה ועדת ביקורת חדשה" },
    { title: "ישיבת ועד מנהל #13", date: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 14), status: "SCHEDULED", location: "משרדי העמותה", attendeesCount: 0 },
    { title: "ישיבת ועדת ביקורת", date: new Date(now.getFullYear(), now.getMonth() + 1, 5), status: "SCHEDULED", location: "משרדי העמותה", attendeesCount: 0 },
    { title: "אסיפה כללית מן המניין", date: new Date(now.getFullYear(), now.getMonth() + 3, 15), status: "SCHEDULED", location: "אולם הקהילה, ירושלים", attendeesCount: 0 },
  ];

  for (const meeting of meetings) {
    const existing = await prisma.boardMeeting.findFirst({
      where: { organizationId: org.id, title: meeting.title },
    });
    if (!existing) {
      await prisma.boardMeeting.create({
        data: {
          organizationId: org.id,
          title: meeting.title,
          date: meeting.date,
          status: meeting.status as "SCHEDULED" | "COMPLETED",
          location: meeting.location,
          attendeesCount: meeting.attendeesCount,
          summary: meeting.summary,
        },
      });
    }
  }
  console.log(`Board meetings: ${meetings.length} seeded`);

  // ==================== ADMIN EVENTS ====================
  const adminEvents = [
    { title: "הכנת דוחות כספיים שנתיים", description: "הכנת כל המסמכים לדוח כספי שנתי לרשם העמותות — דדליין 30 ביוני", type: "DEADLINE", date: new Date(now.getFullYear(), 5, 30), location: "משרדי העמותה" },
    { title: "פגישה עם רואה חשבון", description: "סקירת יתרות סוף שנה והכנה לביקורת", type: "MEETING", date: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7), time: "10:00", location: "משרד רו\"ח גולדשטיין" },
    { title: "הדרכת מתנדבים חדשים", description: "הכשרה ראשונית ל-8 מתנדבים חדשים — נהלים, בטיחות ומדיניות העמותה", type: "TRAINING", date: new Date(now.getFullYear(), now.getMonth() + 1, 12), time: "18:00", location: "מרכז הקהילה" },
    { title: "אירוע גיוס תרומות שנתי", description: "ארוחת ערב לתורמים ותומכים — הצגת פעילות השנה ותוכניות עתידיות", type: "FUNDRAISING", date: new Date(now.getFullYear(), now.getMonth() + 2, 20), time: "19:30", location: "מלון דן, ירושלים" },
    { title: "ביקורת עומק — הכנה", description: "הכנת כל המסמכים הנדרשים לביקורת עומק מהרשם", type: "AUDIT", date: new Date(now.getFullYear(), now.getMonth() + 1, 25), time: "09:00", location: "משרדי העמותה" },
    { title: "יום פעילות למוטבים", description: "יום שטח למשפחות נתמכות — הסעות, כיבוד ופעילויות", type: "VOLUNTEER_EVENT", date: new Date(now.getFullYear(), now.getMonth() + 2, 5), time: "08:30", location: "פארק הירדן" },
  ];

  for (const event of adminEvents) {
    const existing = await prisma.adminEvent.findFirst({
      where: { organizationId: org.id, title: event.title },
    });
    if (!existing) {
      await prisma.adminEvent.create({
        data: {
          organizationId: org.id,
          title: event.title,
          description: event.description,
          type: event.type as "DEADLINE" | "MEETING" | "TRAINING" | "FUNDRAISING" | "AUDIT" | "VOLUNTEER_EVENT",
          date: event.date,
          time: event.time,
          location: event.location,
          status: "SCHEDULED",
        },
      });
    }
  }
  console.log(`Admin events: ${adminEvents.length} seeded`);

  console.log("\nSeed completed!");
  console.log(`\nLogin credentials:`);
  console.log(`  Admin: ${adminEmail} / ${adminPassword}`);
  console.log(`  Manager: yossi@or-letzion.org.il / Manager123!`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
