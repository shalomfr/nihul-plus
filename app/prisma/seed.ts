import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // ==================== CLEANUP (idempotent) ====================
  const existingOrg = await prisma.organization.findUnique({ where: { id: "org-or-letzion" } });
  if (existingOrg) {
    console.log("Cleaning existing seed data...");
    await prisma.adminEvent.deleteMany({ where: { organizationId: existingOrg.id } });
    // Banking data (accounts, transactions, transfers, expenses) is NOT cleaned —
    // it contains real data from bank scraper sync and manual entry.
    await prisma.finandaConnection.deleteMany({ where: { organizationId: existingOrg.id } });
    await prisma.executionStepLog.deleteMany({ where: { execution: { organizationId: existingOrg.id } } });
    await prisma.workflowExecution.deleteMany({ where: { organizationId: existingOrg.id } });
    await prisma.workflowStep.deleteMany({ where: { workflow: { organizationId: existingOrg.id } } });
    await prisma.workflow.deleteMany({ where: { organizationId: existingOrg.id } });
    await prisma.auditLog.deleteMany({ where: { organizationId: existingOrg.id } });
    await prisma.notification.deleteMany({ where: { organizationId: existingOrg.id } });
    await prisma.volunteerHours.deleteMany({ where: { volunteer: { organizationId: existingOrg.id } } });
    await prisma.volunteer.deleteMany({ where: { organizationId: existingOrg.id } });
    await prisma.organizationDocument.deleteMany({ where: { organizationId: existingOrg.id } });
    await prisma.complianceCertificate.deleteMany({ where: { organizationId: existingOrg.id } });
    await prisma.complianceItem.deleteMany({ where: { organizationId: existingOrg.id } });
    await prisma.boardResolution.deleteMany({ where: { organizationId: existingOrg.id } });
    await prisma.meetingProtocol.deleteMany({ where: { meeting: { organizationId: existingOrg.id } } });
    await prisma.boardMeeting.deleteMany({ where: { organizationId: existingOrg.id } });
    await prisma.boardMember.deleteMany({ where: { organizationId: existingOrg.id } });
    await prisma.budgetLine.deleteMany({ where: { budget: { organizationId: existingOrg.id } } });
    await prisma.budget.deleteMany({ where: { organizationId: existingOrg.id } });
    await prisma.documentSequence.deleteMany({ where: { organizationId: existingOrg.id } });
    await prisma.receipt.deleteMany({ where: { organizationId: existingOrg.id } });
    await prisma.donation.deleteMany({ where: { organizationId: existingOrg.id } });
    await prisma.campaign.deleteMany({ where: { organizationId: existingOrg.id } });
    await prisma.donor.deleteMany({ where: { organizationId: existingOrg.id } });
    console.log("Cleanup done.");
  }

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
  const manager = await prisma.user.upsert({
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
  console.log(`Manager: ${manager.email}`);

  // ==================== DONORS ====================
  const donors = await Promise.all([
    prisma.donor.create({
      data: {
        organizationId: org.id,
        firstName: "אברהם",
        lastName: "כהן",
        email: "avraham@example.com",
        phone: "050-1234567",
        city: "ירושלים",
        totalDonated: 15000,
        donationCount: 5,
      },
    }),
    prisma.donor.create({
      data: {
        organizationId: org.id,
        firstName: "שרה",
        lastName: "לוי",
        email: "sarah@example.com",
        phone: "052-9876543",
        city: "תל אביב",
        totalDonated: 8500,
        donationCount: 3,
      },
    }),
    prisma.donor.create({
      data: {
        organizationId: org.id,
        firstName: "משה",
        lastName: "ישראלי",
        email: "moshe@example.com",
        phone: "054-5551234",
        city: "חיפה",
        totalDonated: 25000,
        donationCount: 12,
      },
    }),
    prisma.donor.create({
      data: {
        organizationId: org.id,
        firstName: "רחל",
        lastName: "אברמוביץ",
        email: "rachel@example.com",
        phone: "053-7778899",
        city: "בני ברק",
        totalDonated: 5000,
        donationCount: 2,
      },
    }),
    prisma.donor.create({
      data: {
        organizationId: org.id,
        firstName: "דוד",
        lastName: "מזרחי",
        email: "david@example.com",
        phone: "058-3334455",
        city: "באר שבע",
        totalDonated: 42000,
        donationCount: 8,
      },
    }),
  ]);
  console.log(`Created ${donors.length} donors`);

  // ==================== CAMPAIGNS ====================
  const campaign = await prisma.campaign.create({
    data: {
      organizationId: org.id,
      name: "קמפיין חנוכה תשפ״ו",
      description: "קמפיין גיוס תרומות לחנוכה",
      goalAmount: 100000,
      raisedAmount: 67500,
      isActive: true,
      startDate: new Date("2025-12-01"),
      endDate: new Date("2026-01-15"),
    },
  });

  // ==================== DONATIONS ====================
  const now = new Date();
  const donations = [];
  for (let i = 0; i < 15; i++) {
    const donor = donors[i % donors.length];
    const daysAgo = Math.floor(Math.random() * 90);
    const amount = [500, 1000, 1800, 2500, 3600, 5000, 10000][Math.floor(Math.random() * 7)];
    donations.push(
      await prisma.donation.create({
        data: {
          organizationId: org.id,
          donorId: donor.id,
          amount,
          status: "COMPLETED",
          method: ["credit_card", "bank_transfer", "cash", "check"][Math.floor(Math.random() * 4)],
          campaignId: i < 5 ? campaign.id : null,
          donatedAt: new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000),
        },
      })
    );
  }
  console.log(`Created ${donations.length} donations`);

  // ==================== RECEIPTS ====================
  await prisma.receipt.create({
    data: {
      organizationId: org.id,
      receiptNumber: 1001,
      recipientName: "אברהם כהן",
      amount: 5000,
      isTaxDeductible: true,
      section46: true,
    },
  });

  // ==================== DOCUMENT SEQUENCES ====================
  await prisma.documentSequence.create({
    data: { organizationId: org.id, type: "receipt", lastNumber: 1001, prefix: "R" },
  });
  await prisma.documentSequence.create({
    data: { organizationId: org.id, type: "invoice", lastNumber: 100, prefix: "INV" },
  });

  // ==================== BUDGET ====================
  const budget = await prisma.budget.create({
    data: {
      organizationId: org.id,
      year: 2026,
      name: "תקציב שנתי 2026",
      totalBudget: 500000,
      totalSpent: 187500,
      lines: {
        create: [
          { category: "משכורות", planned: 200000, actual: 95000 },
          { category: "שכירות", planned: 60000, actual: 30000 },
          { category: "פעילויות", planned: 80000, actual: 32500 },
          { category: "שיווק", planned: 40000, actual: 15000 },
          { category: "הנהלה וכלליות", planned: 50000, actual: 10000 },
          { category: "תחבורה", planned: 30000, actual: 5000 },
          { category: "אחר", planned: 40000, actual: 0 },
        ],
      },
    },
  });
  console.log(`Budget: ${budget.name}`);

  // ==================== BOARD MEMBERS ====================
  const boardMembers = await Promise.all([
    prisma.boardMember.create({
      data: { organizationId: org.id, name: "הרב יוסף כהן", role: "יו״ר", email: "yosef@example.com", phone: "050-1111111" },
    }),
    prisma.boardMember.create({
      data: { organizationId: org.id, name: "מרים לוי", role: "גזברית", email: "miriam@example.com", phone: "052-2222222" },
    }),
    prisma.boardMember.create({
      data: { organizationId: org.id, name: "שמעון ישראלי", role: "מזכיר", email: "shimon@example.com", phone: "054-3333333" },
    }),
    prisma.boardMember.create({
      data: { organizationId: org.id, name: "דבורה אברמוביץ", role: "חברת ועד", email: "devora@example.com" },
    }),
    prisma.boardMember.create({
      data: { organizationId: org.id, name: "נתנאל מזרחי", role: "חבר ועד", email: "netanel@example.com" },
    }),
  ]);
  console.log(`Created ${boardMembers.length} board members`);

  // ==================== BOARD MEETINGS ====================
  const pastMeeting = await prisma.boardMeeting.create({
    data: {
      organizationId: org.id,
      title: "ישיבת ועד מנהל - רבעון 4",
      date: new Date("2026-01-15T18:00:00"),
      location: "משרדי העמותה",
      status: "COMPLETED",
      summary: "דנו בתקציב 2026, אושר פה אחד. סוכם לקדם קמפיין חנוכה.",
      attendeesCount: 5,
      protocol: {
        create: {
          content: "פרוטוקול ישיבת ועד מנהל מתאריך 15.01.2026\nנוכחים: כל חברי הועד\nסדר יום: אישור תקציב 2026, קמפיין חנוכה\nהחלטות: אושר תקציב 500,000 ש\"ח לשנת 2026",
          approvedAt: new Date("2026-01-16"),
        },
      },
    },
  });

  await prisma.boardMeeting.create({
    data: {
      organizationId: org.id,
      title: "ישיבת ועד מנהל - רבעון 1",
      date: new Date("2026-03-15T18:00:00"),
      location: "משרדי העמותה",
      status: "SCHEDULED",
    },
  });

  await prisma.boardMeeting.create({
    data: {
      organizationId: org.id,
      title: "אסיפה כללית שנתית",
      date: new Date("2026-04-20T17:00:00"),
      location: "אולם הכנסים",
      status: "SCHEDULED",
    },
  });

  // ==================== BOARD RESOLUTIONS ====================
  await prisma.boardResolution.create({
    data: {
      organizationId: org.id,
      meetingId: pastMeeting.id,
      title: "אישור תקציב 2026",
      description: "אישור תקציב שנתי בסך 500,000 ש\"ח",
      status: "approved",
      votesFor: 5,
      votesAgainst: 0,
      votesAbstain: 0,
      decidedAt: new Date("2026-01-15"),
    },
  });

  await prisma.boardResolution.create({
    data: {
      organizationId: org.id,
      meetingId: pastMeeting.id,
      title: "השקת קמפיין חנוכה",
      description: "אישור השקת קמפיין גיוס תרומות לחנוכה ביעד 100,000 ש\"ח",
      status: "approved",
      votesFor: 4,
      votesAgainst: 0,
      votesAbstain: 1,
      decidedAt: new Date("2026-01-15"),
    },
  });

  // ==================== COMPLIANCE ITEMS (74 items, 9 categories) ====================
  const ci = (name: string, type: string, category: string, status: string, opts: Record<string, unknown> = {}) =>
    prisma.complianceItem.create({ data: { organizationId: org.id, name, type, category, status, ...opts } as never });

  await Promise.all([
    // 1. מסמכי יסוד (FOUNDING_DOCS) — 8 items
    ci("תקנון העמותה", "DOCUMENT", "FOUNDING_DOCS", "OK", { completedAt: new Date("2020-03-15"), frequency: "one_time", description: "תקנון מעודכן ומאושר" }),
    ci("אישור רישום ברשם העמותות", "REGISTRATION", "FOUNDING_DOCS", "OK", { completedAt: new Date("2020-03-15"), frequency: "one_time" }),
    ci("תעודת רישום עמותה", "CERTIFICATE", "FOUNDING_DOCS", "OK", { completedAt: new Date("2020-03-15"), frequency: "one_time" }),
    ci("פרוטוקול ישיבת ייסוד", "DOCUMENT", "FOUNDING_DOCS", "OK", { completedAt: new Date("2020-03-15"), frequency: "one_time" }),
    ci("פרוטוקול מינוי נושאי משרה", "DOCUMENT", "FOUNDING_DOCS", "OK", { completedAt: new Date("2025-11-01"), frequency: "annual" }),
    ci("רשימת חברי ועד מעודכנת", "DOCUMENT", "FOUNDING_DOCS", "WARNING", { dueDate: new Date("2026-03-31"), frequency: "annual", description: "נדרש עדכון רשימת חברי ועד" }),
    ci("כתב מינוי מנכ\"ל / מנהל", "DOCUMENT", "FOUNDING_DOCS", "OK", { completedAt: new Date("2025-06-01"), frequency: "one_time" }),
    ci("רשימת חברי עמותה", "DOCUMENT", "FOUNDING_DOCS", "OK", { completedAt: new Date("2026-01-01"), frequency: "annual" }),

    // 2. חובות שנתיות לרשם (ANNUAL_OBLIGATIONS) — 7 items
    ci("דוח שנתי לרשם העמותות", "REPORT", "ANNUAL_OBLIGATIONS", "WARNING", { dueDate: new Date("2026-06-30"), frequency: "annual", description: "יש להגיש עד 30 יוני", legalBasis: "חוק העמותות, סעיף 36" }),
    ci("דוח כספי מבוקר", "REPORT", "ANNUAL_OBLIGATIONS", "OK", { completedAt: new Date("2026-02-01"), dueDate: new Date("2026-06-30"), frequency: "annual", legalBasis: "חוק העמותות, סעיף 37" }),
    ci("דו\"ח מילולי על פעילות", "REPORT", "ANNUAL_OBLIGATIONS", "MISSING", { dueDate: new Date("2026-06-30"), frequency: "annual", description: "טרם הוגש דוח מילולי לרשם" }),
    ci("פרוטוקול אסיפה כללית שנתית", "DOCUMENT", "ANNUAL_OBLIGATIONS", "OK", { completedAt: new Date("2025-11-15"), frequency: "annual" }),
    ci("עדכון פרטי ממונים ברשם", "REGISTRATION", "ANNUAL_OBLIGATIONS", "OK", { completedAt: new Date("2026-01-10"), frequency: "annual" }),
    ci("הגשת בקשה לאישור ניהול תקין", "APPROVAL", "ANNUAL_OBLIGATIONS", "OK", { completedAt: new Date("2026-01-10"), dueDate: new Date("2026-12-31"), frequency: "annual", legalBasis: "תקנות העמותות" }),
    ci("תשלום אגרה שנתית לרשם", "DOCUMENT", "ANNUAL_OBLIGATIONS", "OK", { completedAt: new Date("2026-01-05"), frequency: "annual" }),

    // 3. אישורים מרשות המסים (TAX_APPROVALS) — 7 items
    ci("אישור ניהול ספרים", "CERTIFICATE", "TAX_APPROVALS", "OK", { completedAt: new Date("2026-01-10"), dueDate: new Date("2026-12-31"), frequency: "annual", legalBasis: "פקודת מס הכנסה" }),
    ci("אישור סעיף 46 (פטור ממס לתורמים)", "APPROVAL", "TAX_APPROVALS", "OK", { completedAt: new Date("2026-01-05"), dueDate: new Date("2026-12-31"), frequency: "annual", legalBasis: "סעיף 46 לפקודת מס הכנסה" }),
    ci("רישום מע\"מ / פטור ממע\"מ", "REGISTRATION", "TAX_APPROVALS", "OK", { completedAt: new Date("2020-03-15"), frequency: "one_time" }),
    ci("הגשת דוח מע\"מ שנתי", "REPORT", "TAX_APPROVALS", "OK", { completedAt: new Date("2026-02-01"), dueDate: new Date("2026-04-30"), frequency: "annual" }),
    ci("אישור פטור ממס הכנסה לעמותה", "CERTIFICATE", "TAX_APPROVALS", "OK", { completedAt: new Date("2026-01-10"), dueDate: new Date("2026-12-31"), frequency: "annual", legalBasis: "סעיף 9(2) לפקודת מס הכנסה" }),
    ci("הגשת דוח שנתי לרשות המסים", "REPORT", "TAX_APPROVALS", "WARNING", { dueDate: new Date("2026-05-31"), frequency: "annual", description: "יש להגיש עד 31 מאי" }),
    ci("אישור ניהול תקין מרשות המסים", "CERTIFICATE", "TAX_APPROVALS", "OK", { completedAt: new Date("2026-01-10"), dueDate: new Date("2026-12-31"), frequency: "annual" }),

    // 4. ניהול כספי שוטף (FINANCIAL_MGMT) — 11 items
    ci("פתיחת חשבון בנק על שם העמותה", "REGISTRATION", "FINANCIAL_MGMT", "OK", { completedAt: new Date("2020-04-01"), frequency: "one_time" }),
    ci("הגדרת מורשי חתימה", "DOCUMENT", "FINANCIAL_MGMT", "OK", { completedAt: new Date("2025-11-01"), frequency: "annual" }),
    ci("ספר קבלות ממוספר", "DOCUMENT", "FINANCIAL_MGMT", "OK", { completedAt: new Date("2026-01-01"), frequency: "annual" }),
    ci("ניהול יומן קופה", "DOCUMENT", "FINANCIAL_MGMT", "WARNING", { dueDate: new Date("2026-03-31"), frequency: "monthly", description: "נדרש עדכון שוטף" }),
    ci("מעקב תקציב שנתי", "REPORT", "FINANCIAL_MGMT", "OK", { completedAt: new Date("2026-01-15"), frequency: "annual" }),
    ci("פרוטוקול אישור תקציב שנתי", "DOCUMENT", "FINANCIAL_MGMT", "OK", { completedAt: new Date("2026-01-15"), frequency: "annual" }),
    ci("נהלי הוצאות וקבלות", "POLICY", "FINANCIAL_MGMT", "OK", { completedAt: new Date("2025-09-01"), frequency: "one_time" }),
    ci("דיווח על הכנסות ותרומות", "REPORT", "FINANCIAL_MGMT", "OK", { completedAt: new Date("2026-02-01"), frequency: "quarterly" }),
    ci("ניהול חשבוניות ותשלומים", "DOCUMENT", "FINANCIAL_MGMT", "OK", { completedAt: new Date("2026-02-01"), frequency: "monthly" }),
    ci("ביקורת פנימית כספית", "REPORT", "FINANCIAL_MGMT", "MISSING", { dueDate: new Date("2026-04-30"), frequency: "annual", description: "טרם בוצעה ביקורת פנימית לשנת 2025" }),
    ci("דוח תזרים מזומנים", "REPORT", "FINANCIAL_MGMT", "OK", { completedAt: new Date("2026-02-01"), frequency: "quarterly" }),

    // 5. תיעוד חלוקת כספים/שירותים (DISTRIBUTION_DOCS) — 10 items
    ci("רשימת מוטבים מעודכנת", "DOCUMENT", "DISTRIBUTION_DOCS", "OK", { completedAt: new Date("2026-01-20"), frequency: "annual" }),
    ci("קריטריונים לחלוקה תמיכות", "POLICY", "DISTRIBUTION_DOCS", "OK", { completedAt: new Date("2025-08-01"), frequency: "one_time" }),
    ci("פרוטוקול ועדת חלוקה", "DOCUMENT", "DISTRIBUTION_DOCS", "OK", { completedAt: new Date("2026-02-10"), frequency: "quarterly" }),
    ci("טפסי בקשה להגשה", "DOCUMENT", "DISTRIBUTION_DOCS", "OK", { completedAt: new Date("2025-09-01"), frequency: "one_time" }),
    ci("הסכמות מוטבים ואישורי קבלה", "DOCUMENT", "DISTRIBUTION_DOCS", "WARNING", { dueDate: new Date("2026-03-31"), frequency: "annual", description: "נדרש עדכון הסכמות" }),
    ci("תיעוד תשלומים בפועל", "DOCUMENT", "DISTRIBUTION_DOCS", "OK", { completedAt: new Date("2026-02-15"), frequency: "monthly" }),
    ci("נוהל מניעת ניגוד עניינים בחלוקה", "POLICY", "DISTRIBUTION_DOCS", "OK", { completedAt: new Date("2025-07-01"), frequency: "one_time" }),
    ci("דיווח על חלוקה לרשויות", "REPORT", "DISTRIBUTION_DOCS", "MISSING", { dueDate: new Date("2026-04-30"), frequency: "annual", description: "נדרש דיווח לרשם על פעילות חלוקה" }),
    ci("בדיקות זכאות מוטבים", "DOCUMENT", "DISTRIBUTION_DOCS", "OK", { completedAt: new Date("2026-01-15"), frequency: "annual" }),
    ci("מסמכי סיום / סגירת תיק מוטב", "DOCUMENT", "DISTRIBUTION_DOCS", "OK", { completedAt: new Date("2026-02-01"), frequency: "annual" }),

    // 6. ממשל ופרוטוקולים (GOVERNANCE) — 7 items
    ci("ישיבות ועד מנהל תקופתיות", "DOCUMENT", "GOVERNANCE", "OK", { completedAt: new Date("2026-02-15"), frequency: "quarterly", description: "לפחות 4 ישיבות בשנה" }),
    ci("פרוטוקולי ישיבות ועד", "DOCUMENT", "GOVERNANCE", "OK", { completedAt: new Date("2026-02-15"), frequency: "quarterly" }),
    ci("אישור תקציב שנתי ע\"י ועד", "DOCUMENT", "GOVERNANCE", "OK", { completedAt: new Date("2026-01-15"), frequency: "annual" }),
    ci("נוהל ניגוד עניינים", "POLICY", "GOVERNANCE", "OK", { completedAt: new Date("2025-07-01"), frequency: "one_time", legalBasis: "חוק העמותות, סעיף 27א" }),
    ci("הצהרות חברי ועד על ניגוד עניינים", "DOCUMENT", "GOVERNANCE", "WARNING", { dueDate: new Date("2026-04-01"), frequency: "annual", description: "נדרשות הצהרות מחודשות לשנת 2026" }),
    ci("מדיניות שכר והטבות", "POLICY", "GOVERNANCE", "OK", { completedAt: new Date("2025-06-01"), frequency: "one_time" }),
    ci("ביקורת חיצונית (רואה חשבון)", "CERTIFICATE", "GOVERNANCE", "OK", { completedAt: new Date("2026-02-01"), frequency: "annual" }),

    // 7. עובדים ומתנדבים (EMPLOYEES_VOLUNTEERS) — 8 items
    ci("חוזי עבודה חתומים", "DOCUMENT", "EMPLOYEES_VOLUNTEERS", "OK", { completedAt: new Date("2025-12-01"), frequency: "one_time" }),
    ci("תלושי שכר חודשיים", "DOCUMENT", "EMPLOYEES_VOLUNTEERS", "OK", { completedAt: new Date("2026-02-01"), frequency: "monthly" }),
    ci("הפרשות לפנסיה / ביטוח מנהלים", "CERTIFICATE", "EMPLOYEES_VOLUNTEERS", "OK", { completedAt: new Date("2026-02-01"), frequency: "monthly" }),
    ci("ביטוח לאומי ומס הכנסה ניכויים", "DOCUMENT", "EMPLOYEES_VOLUNTEERS", "OK", { completedAt: new Date("2026-02-01"), frequency: "monthly" }),
    ci("חוזי התנדבות / הסכמי מתנדבים", "DOCUMENT", "EMPLOYEES_VOLUNTEERS", "WARNING", { dueDate: new Date("2026-03-31"), frequency: "annual", description: "נדרש חידוש חוזי מתנדבים" }),
    ci("ביטוח תאונות אישיות לעובדים", "CERTIFICATE", "EMPLOYEES_VOLUNTEERS", "OK", { completedAt: new Date("2026-01-01"), dueDate: new Date("2026-12-31"), frequency: "annual" }),
    ci("הדרכת עובדים / מתנדבים", "DOCUMENT", "EMPLOYEES_VOLUNTEERS", "OK", { completedAt: new Date("2025-12-15"), frequency: "annual" }),
    ci("נוהל קבלה ופיטורים", "POLICY", "EMPLOYEES_VOLUNTEERS", "OK", { completedAt: new Date("2025-06-01"), frequency: "one_time" }),

    // 8. ביטוח (INSURANCE) — 6 items
    ci("ביטוח צד ג' כללי", "CERTIFICATE", "INSURANCE", "OK", { completedAt: new Date("2026-01-01"), dueDate: new Date("2026-12-31"), frequency: "annual" }),
    ci("ביטוח אחריות מנהלים ונושאי משרה", "CERTIFICATE", "INSURANCE", "WARNING", { dueDate: new Date("2026-04-15"), frequency: "annual", description: "פוליסה מתחדשת באפריל" }),
    ci("ביטוח רכוש ותכולה", "CERTIFICATE", "INSURANCE", "OK", { completedAt: new Date("2026-01-01"), dueDate: new Date("2026-12-31"), frequency: "annual" }),
    ci("ביטוח תאונות אישיות למתנדבים", "CERTIFICATE", "INSURANCE", "OK", { completedAt: new Date("2026-01-01"), dueDate: new Date("2026-12-31"), frequency: "annual" }),
    ci("חידוש שנתי ביטוחים", "DOCUMENT", "INSURANCE", "OK", { completedAt: new Date("2026-01-10"), frequency: "annual", description: "תיאום עם סוכן הביטוח" }),
    ci("ביטוח סייבר / אחריות מקצועית", "CERTIFICATE", "INSURANCE", "MISSING", { dueDate: new Date("2026-06-30"), frequency: "annual", description: "מומלץ בהתאם לגודל הארגון" }),

    // 9. גמ\"ח כספים (GEMACH) — 10 items
    ci("רישיון / אישור הפעלת גמ\"ח", "CERTIFICATE", "GEMACH", "OK", { completedAt: new Date("2020-06-01"), frequency: "one_time", legalBasis: "חוק הלוואות חוץ-בנקאיות" }),
    ci("היתר עסקה מרבנות / בד\"ץ", "DOCUMENT", "GEMACH", "OK", { completedAt: new Date("2020-08-01"), frequency: "one_time", description: "היתר עסקה להלוואות ריבית" }),
    ci("חוזי הלוואה חתומים", "DOCUMENT", "GEMACH", "OK", { completedAt: new Date("2026-02-01"), frequency: "one_time" }),
    ci("לוח סילוקין ותיעוד פירעונות", "DOCUMENT", "GEMACH", "OK", { completedAt: new Date("2026-02-15"), frequency: "monthly" }),
    ci("רשימת לווים עדכנית", "DOCUMENT", "GEMACH", "OK", { completedAt: new Date("2026-02-15"), frequency: "monthly" }),
    ci("נוהל מתן הלוואות", "POLICY", "GEMACH", "OK", { completedAt: new Date("2021-01-01"), frequency: "one_time" }),
    ci("ביטוח הלוואות / ערבויות", "CERTIFICATE", "GEMACH", "WARNING", { dueDate: new Date("2026-05-01"), frequency: "annual", description: "נדרש חידוש ביטוח הלוואות" }),
    ci("דיווח שנתי על פעילות הגמ\"ח", "REPORT", "GEMACH", "MISSING", { dueDate: new Date("2026-06-30"), frequency: "annual", description: "נדרש דיווח שנתי לרשויות" }),
    ci("ועדת הלוואות ופרוטוקולים", "DOCUMENT", "GEMACH", "OK", { completedAt: new Date("2026-01-20"), frequency: "quarterly" }),
    ci("נוהל גביית חובות", "POLICY", "GEMACH", "OK", { completedAt: new Date("2021-01-01"), frequency: "one_time" }),
  ]);
  console.log("Created 74 compliance items (9 categories)");

  // ==================== COMPLIANCE CERTIFICATES ====================
  await prisma.complianceCertificate.create({
    data: {
      organizationId: org.id, name: "אישור ניהול תקין 2026",
      issuedBy: "רשם העמותות", issuedAt: new Date("2026-01-10"),
      expiresAt: new Date("2026-12-31"), status: "OK",
    },
  });

  // ==================== DOCUMENTS ====================
  await Promise.all([
    prisma.organizationDocument.create({ data: { organizationId: org.id, name: "תקנון העמותה", category: "FOUNDING", description: "תקנון מעודכן" } }),
    prisma.organizationDocument.create({ data: { organizationId: org.id, name: "אישור ניהול תקין 2026", category: "COMPLIANCE" } }),
    prisma.organizationDocument.create({ data: { organizationId: org.id, name: "דוח כספי 2025", category: "FINANCIAL" } }),
    prisma.organizationDocument.create({ data: { organizationId: org.id, name: "פרוטוקול ישיבה ינואר 2026", category: "BOARD" } }),
    prisma.organizationDocument.create({ data: { organizationId: org.id, name: "רשימת חברי ועד", category: "BOARD" } }),
  ]);
  console.log("Created 5 documents");

  // ==================== VOLUNTEERS ====================
  await Promise.all([
    prisma.volunteer.create({
      data: {
        organizationId: org.id, name: "יעל גולדשטיין", email: "yael@example.com",
        phone: "050-9998877", role: "מתנדבת הוראה", totalHours: 48,
        hours: {
          create: [
            { date: new Date("2026-02-10"), hours: 4, description: "שיעור מתמטיקה", approved: true },
            { date: new Date("2026-02-12"), hours: 3, description: "חונכות", approved: true },
          ],
        },
      },
    }),
    prisma.volunteer.create({
      data: { organizationId: org.id, name: "אליהו ברקוביץ", email: "eli@example.com", phone: "052-6665544", role: "מתנדב לוגיסטיקה", totalHours: 32 },
    }),
    prisma.volunteer.create({
      data: { organizationId: org.id, name: "נועה שמיר", email: "noa@example.com", role: "מתנדבת שיווק", totalHours: 20 },
    }),
  ]);
  console.log("Created 3 volunteers");

  // ==================== WORKFLOWS ====================
  const wf1 = await prisma.workflow.create({
    data: {
      organizationId: org.id, name: "קבלה אוטומטית לתרומה",
      description: "שליחת קבלה אוטומטית כשמתקבלת תרומה חדשה",
      triggerType: "EVENT", triggerConfig: { eventType: "donation.created" },
      status: "ACTIVE", templateId: "donation-receipt", runCount: 12, lastRunAt: new Date("2026-02-18"),
      steps: {
        create: [
          { order: 1, actionType: "SEND_EMAIL", actionConfig: { to: "{{donorEmail}}", subject: "קבלה על תרומתך", html: "<div dir='rtl'><h2>תודה!</h2><p>סכום: {{amount}}</p></div>" } },
          { order: 2, actionType: "SEND_NOTIFICATION", actionConfig: { type: "SUCCESS", title: "תרומה חדשה", message: "{{amount}} מאת {{donorName}}" } },
        ],
      },
    },
  });

  const wf2 = await prisma.workflow.create({
    data: {
      organizationId: org.id, name: "תזכורת ניהול תקין",
      description: "שליחת תזכורת 30 יום לפני תום תוקף",
      triggerType: "SCHEDULE", triggerConfig: { cron: "0 9 * * 0" },
      status: "ACTIVE", templateId: "compliance-reminder-30", runCount: 4, lastRunAt: new Date("2026-02-16"),
      steps: {
        create: [
          { order: 1, actionType: "SEND_NOTIFICATION", actionConfig: { type: "WARNING", title: "תזכורת", message: "{{itemName}} יפוג בעוד {{daysLeft}} ימים" } },
          { order: 2, actionType: "SEND_EMAIL", actionConfig: { to: "{{managerEmail}}", subject: "תזכורת: {{itemName}}", html: "<div dir='rtl'>{{itemName}} יפוג בתאריך {{dueDate}}</div>" } },
        ],
      },
    },
  });

  const wf3 = await prisma.workflow.create({
    data: {
      organizationId: org.id, name: "סיכום ישיבת ועד",
      description: "שליחת סיכום אוטומטי בסיום ישיבת ועד",
      triggerType: "EVENT", triggerConfig: { eventType: "meeting.completed" },
      status: "ACTIVE", templateId: "meeting-summary", runCount: 1,
      steps: {
        create: [
          { order: 1, actionType: "SEND_EMAIL", actionConfig: { to: "{{attendeesEmails}}", subject: "סיכום: {{meetingTitle}}", html: "<div dir='rtl'>{{summary}}</div>" } },
          { order: 2, actionType: "CREATE_DOCUMENT", actionConfig: { name: "פרוטוקול - {{meetingTitle}}", category: "BOARD" } },
        ],
      },
    },
  });

  await prisma.workflow.create({
    data: {
      organizationId: org.id, name: "התראת חריגה מתקציב",
      description: "התראה כשההוצאות עוברות 80%",
      triggerType: "EVENT", triggerConfig: { eventType: "budget.threshold", conditions: { operator: "AND", rules: [{ field: "percentage", op: "gte", value: 80 }] } },
      status: "ACTIVE", templateId: "budget-threshold",
      steps: {
        create: [
          { order: 1, actionType: "SEND_NOTIFICATION", actionConfig: { type: "WARNING", title: "חריגה מתקציב", message: "ההוצאות הגיעו ל-{{percentage}}%" } },
        ],
      },
    },
  });

  await prisma.workflow.create({
    data: {
      organizationId: org.id, name: "דוח חודשי אוטומטי",
      description: "יצירת דוח בתחילת כל חודש",
      triggerType: "SCHEDULE", triggerConfig: { cron: "0 9 1 * *" },
      status: "INACTIVE", templateId: "monthly-report",
      steps: {
        create: [
          { order: 1, actionType: "CREATE_DOCUMENT", actionConfig: { name: "דוח חודשי", category: "FINANCIAL" } },
          { order: 2, actionType: "SEND_NOTIFICATION", actionConfig: { type: "INFO", title: "דוח חודשי מוכן", message: "הדוח החודשי מוכן" } },
        ],
      },
    },
  });
  console.log("Created 5 workflows");

  // ==================== WORKFLOW EXECUTIONS ====================
  for (let i = 0; i < 8; i++) {
    const wf = [wf1, wf2, wf3][i % 3];
    const daysAgo = Math.floor(Math.random() * 30);
    await prisma.workflowExecution.create({
      data: {
        organizationId: org.id, workflowId: wf.id,
        status: i === 5 ? "FAILED" : "SUCCESS",
        triggerData: { source: "seed" },
        startedAt: new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000),
        completedAt: new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000 + 2000),
        error: i === 5 ? "SMTP connection timeout" : null,
      },
    });
  }
  console.log("Created 8 workflow executions");

  // ==================== BANKING DATA ====================
  // Bank accounts, transactions, expenses, and transfers are NOT seeded.
  // Real data comes from bank scraper sync (/portal/bank-sync) and manual entry.

  // ==================== ADMIN EVENTS ====================
  await Promise.all([
    prisma.adminEvent.create({
      data: {
        organizationId: org.id, title: "פגישה עם רואה חשבון", description: "סקירת דוחות רבעון 1",
        type: "MEETING", date: new Date("2026-03-05T10:00:00"), time: "10:00", endTime: "11:30",
        location: "משרדי רו\"ח כהן ושות'", status: "SCHEDULED", createdBy: admin.id,
      },
    }),
    prisma.adminEvent.create({
      data: {
        organizationId: org.id, title: "ישיבת צוות שבועית", description: "סקירת משימות ועדכונים",
        type: "TEAM_MEETING", date: new Date("2026-03-02T09:00:00"), time: "09:00", endTime: "10:00",
        location: "משרדי העמותה", status: "SCHEDULED", createdBy: admin.id,
      },
    }),
    prisma.adminEvent.create({
      data: {
        organizationId: org.id, title: "הדרכת מתנדבים חדשים", description: "הדרכה ראשונית למתנדבים שהצטרפו",
        type: "TRAINING", date: new Date("2026-03-10T14:00:00"), time: "14:00", endTime: "16:00",
        location: "אולם הכנסים", status: "SCHEDULED", createdBy: admin.id,
      },
    }),
    prisma.adminEvent.create({
      data: {
        organizationId: org.id, title: "אירוע גיוס כספים שנתי", description: "ארוחת ערב לגיוס תרומות",
        type: "FUNDRAISING", date: new Date("2026-03-25T19:00:00"), time: "19:00", endTime: "22:00",
        location: "מלון דוד המלך, ירושלים", status: "SCHEDULED", createdBy: admin.id,
      },
    }),
    prisma.adminEvent.create({
      data: {
        organizationId: org.id, title: "דדליין הגשת דוח שנתי", description: "מועד אחרון להגשת דוח שנתי לרשם",
        type: "DEADLINE", date: new Date("2026-06-30T23:59:00"), status: "SCHEDULED", createdBy: admin.id,
      },
    }),
    prisma.adminEvent.create({
      data: {
        organizationId: org.id, title: "ביקורת פנימית רבעונית", description: "ביקורת על ניהול כספי רבעון 1",
        type: "AUDIT", date: new Date("2026-04-15T10:00:00"), time: "10:00", endTime: "13:00",
        location: "משרדי העמותה", status: "SCHEDULED", createdBy: admin.id,
      },
    }),
    prisma.adminEvent.create({
      data: {
        organizationId: org.id, title: "יום התנדבות קהילתי", description: "יום פעילות קהילתית עם מתנדבים",
        type: "VOLUNTEER_EVENT", date: new Date("2026-03-20T08:00:00"), time: "08:00", endTime: "14:00",
        location: "מרכז קהילתי אור לציון", status: "SCHEDULED", createdBy: admin.id,
      },
    }),
    prisma.adminEvent.create({
      data: {
        organizationId: org.id, title: "תזכורת: חידוש ביטוח", description: "לחדש ביטוח אחריות מנהלים",
        type: "REMINDER", date: new Date("2026-04-01T09:00:00"), status: "SCHEDULED", createdBy: admin.id,
      },
    }),
  ]);
  console.log("Created 8 admin events");

  // ==================== NOTIFICATIONS ====================
  await Promise.all([
    prisma.notification.create({
      data: { organizationId: org.id, userId: manager.id, type: "SUCCESS", title: "תרומה חדשה התקבלה", message: "תרומה בסך 5,000 ש\"ח מאת אברהם כהן" },
    }),
    prisma.notification.create({
      data: { organizationId: org.id, userId: manager.id, type: "WARNING", title: "תזכורת ניהול תקין", message: "דוח שנתי לרשם העמותות — נותרו 39 ימים" },
    }),
    prisma.notification.create({
      data: { organizationId: org.id, type: "INFO", title: "ישיבת ועד קרובה", message: "ישיבת ועד מנהל — רבעון 1 ב-15.03.2026" },
    }),
    prisma.notification.create({
      data: { organizationId: org.id, type: "SUCCESS", title: "דוח כספי אושר", message: "הדוח הכספי המבוקר לשנת 2025 אושר", isRead: true },
    }),
  ]);
  console.log("Created 4 notifications");

  // ==================== AUDIT LOG ====================
  await Promise.all([
    prisma.auditLog.create({ data: { organizationId: org.id, userId: manager.id, action: "create", entity: "donation", details: { amount: 5000 } } }),
    prisma.auditLog.create({ data: { organizationId: org.id, userId: manager.id, action: "update", entity: "complianceItem", details: { status: "OK" } } }),
    prisma.auditLog.create({ data: { organizationId: org.id, userId: manager.id, action: "create", entity: "boardMeeting", details: { title: "ישיבת ועד" } } }),
  ]);
  console.log("Created 3 audit logs");

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
