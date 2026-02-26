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
