import { z } from "zod";

// ==================== DONORS ====================
export const createDonorSchema = z.object({
  firstName: z.string().min(1, "שם פרטי נדרש"),
  lastName: z.string().min(1, "שם משפחה נדרש"),
  email: z.string().email("אימייל לא תקין").optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  idNumber: z.string().optional(),
  notes: z.string().optional(),
});

export const updateDonorSchema = createDonorSchema.partial();

// ==================== DONATIONS ====================
export const createDonationSchema = z.object({
  donorId: z.string().optional(),
  amount: z.number().positive("סכום חייב להיות חיובי"),
  currency: z.string().default("ILS"),
  method: z.string().optional(),
  reference: z.string().optional(),
  campaignId: z.string().optional(),
  notes: z.string().optional(),
  donatedAt: z.string().datetime().optional(),
});

export const updateDonationSchema = z.object({
  status: z.enum(["PENDING", "COMPLETED", "CANCELLED", "REFUNDED"]).optional(),
  notes: z.string().optional(),
});

// ==================== COMPLIANCE ====================
const complianceCategoryEnum = z.enum(["FOUNDING_DOCS", "ANNUAL_OBLIGATIONS", "TAX_APPROVALS", "FINANCIAL_MGMT", "DISTRIBUTION_DOCS", "GOVERNANCE", "EMPLOYEES_VOLUNTEERS", "INSURANCE", "GEMACH"]);

export const createComplianceItemSchema = z.object({
  name: z.string().min(1, "שם נדרש"),
  type: z.enum(["CERTIFICATE", "REPORT", "DOCUMENT", "APPROVAL", "REGISTRATION", "POLICY"]),
  category: complianceCategoryEnum.optional(),
  description: z.string().optional(),
  dueDate: z.string().datetime().optional(),
  status: z.enum(["OK", "WARNING", "EXPIRED", "MISSING"]).optional(),
  isRequired: z.boolean().optional(),
  frequency: z.string().optional(),
  legalBasis: z.string().optional(),
});

export const updateComplianceItemSchema = z.object({
  name: z.string().optional(),
  status: z.enum(["OK", "WARNING", "EXPIRED", "MISSING"]).optional(),
  description: z.string().optional(),
  dueDate: z.string().datetime().optional().nullable(),
  completedAt: z.string().datetime().optional().nullable(),
  documentUrl: z.string().optional().nullable(),
  category: complianceCategoryEnum.optional(),
  isRequired: z.boolean().optional(),
  frequency: z.string().optional(),
  legalBasis: z.string().optional(),
});

// ==================== DOCUMENTS ====================
export const createDocumentSchema = z.object({
  name: z.string().min(1, "שם נדרש"),
  category: z.enum(["FOUNDING", "FINANCIAL", "COMPLIANCE", "BOARD", "GENERAL"]).default("GENERAL"),
  description: z.string().optional(),
  fileUrl: z.string().optional(),
});

// ==================== BOARD ====================
export const createBoardMeetingSchema = z.object({
  title: z.string().min(1, "כותרת נדרשת"),
  date: z.string().datetime(),
  location: z.string().optional(),
  summary: z.string().optional(),
});

export const updateBoardMeetingSchema = z.object({
  title: z.string().optional(),
  date: z.string().datetime().optional(),
  location: z.string().optional(),
  status: z.enum(["SCHEDULED", "IN_PROGRESS", "COMPLETED", "CANCELLED"]).optional(),
  summary: z.string().optional(),
  attendeesCount: z.number().optional(),
});

export const createBoardMemberSchema = z.object({
  name: z.string().min(1, "שם נדרש"),
  role: z.string().min(1, "תפקיד נדרש"),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  idNumber: z.string().optional(),
  startDate: z.string().datetime().optional(),
});

export const createBoardResolutionSchema = z.object({
  meetingId: z.string().optional(),
  title: z.string().min(1, "כותרת נדרשת"),
  description: z.string().optional(),
  votesFor: z.number().default(0),
  votesAgainst: z.number().default(0),
  votesAbstain: z.number().default(0),
});

// ==================== VOLUNTEERS ====================
export const createVolunteerSchema = z.object({
  name: z.string().min(1, "שם נדרש"),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  idNumber: z.string().optional(),
  role: z.string().optional(),
  startDate: z.string().datetime().optional(),
});

export const updateVolunteerSchema = createVolunteerSchema.partial().extend({
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
});

// ==================== BUDGET ====================
export const createBudgetSchema = z.object({
  year: z.number().int(),
  name: z.string().min(1, "שם נדרש"),
  totalBudget: z.number().positive("תקציב חייב להיות חיובי"),
});

export const createBudgetLineSchema = z.object({
  budgetId: z.string(),
  category: z.string().min(1, "קטגוריה נדרשת"),
  planned: z.number(),
  notes: z.string().optional(),
});

// ==================== WORKFLOWS ====================
export const createWorkflowSchema = z.object({
  name: z.string().min(1, "שם נדרש"),
  description: z.string().optional(),
  triggerType: z.enum(["EVENT", "SCHEDULE", "MANUAL"]),
  triggerConfig: z.record(z.string(), z.unknown()).optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "DRAFT"]).default("DRAFT"),
  steps: z.array(z.object({
    order: z.number(),
    actionType: z.enum(["SEND_EMAIL", "CREATE_DOCUMENT", "UPDATE_RECORD", "SEND_NOTIFICATION", "WEBHOOK"]),
    actionConfig: z.record(z.string(), z.unknown()).optional(),
    conditionConfig: z.record(z.string(), z.unknown()).optional(),
  })).optional(),
});

export const updateWorkflowSchema = createWorkflowSchema.partial();

// ==================== NOTIFICATIONS ====================
export const markNotificationReadSchema = z.object({
  ids: z.array(z.string()).optional(),
  all: z.boolean().optional(),
});

// ==================== BANK ACCOUNTS ====================
export const createBankAccountSchema = z.object({
  bankName: z.string().min(1, "שם בנק נדרש"),
  bankCode: z.number().int(),
  branchNumber: z.string().min(1, "מספר סניף נדרש"),
  accountNumber: z.string().min(1, "מספר חשבון נדרש"),
  iban: z.string().optional(),
  balance: z.number().default(0),
  availableBalance: z.number().default(0),
  isPrimary: z.boolean().default(false),
});

export const updateBankAccountSchema = createBankAccountSchema.partial().extend({
  isActive: z.boolean().optional(),
});

// ==================== BANK SCRAPER ====================
export const connectBankScraperSchema = z.object({
  companyId: z.string().min(1, "יש לבחור בנק"),
  credentials: z.record(z.string(), z.string()),
});

// ==================== EXPENSES ====================
export const createExpenseSchema = z.object({
  amount: z.number().positive("סכום חייב להיות חיובי"),
  description: z.string().min(1, "תיאור נדרש"),
  category: z.enum(["SALARIES", "RENT", "ACTIVITIES", "MARKETING", "ADMINISTRATION", "TRANSPORTATION", "SUPPLIES", "PROFESSIONAL_SERVICES", "INSURANCE", "MAINTENANCE", "OTHER"]).default("OTHER"),
  vendor: z.string().optional(),
  expenseDate: z.string().datetime(),
  receiptUrl: z.string().optional(),
  invoiceNumber: z.string().optional(),
  bankAccountId: z.string().optional(),
  budgetLineId: z.string().optional(),
});

export const updateExpenseSchema = createExpenseSchema.partial().extend({
  status: z.enum(["PENDING", "APPROVED", "PAID", "REJECTED", "CANCELLED"]).optional(),
});

// ==================== BANK TRANSFERS ====================
export const createBankTransferSchema = z.object({
  fromAccountId: z.string().min(1, "חשבון מקור נדרש"),
  toAccountId: z.string().optional(),
  toExternalAccount: z.string().optional(),
  toExternalBankCode: z.string().optional(),
  toExternalName: z.string().optional(),
  amount: z.number().positive("סכום חייב להיות חיובי"),
  purpose: z.string().min(1, "מטרת ההעברה נדרשת"),
  description: z.string().optional(),
  reference: z.string().optional(),
  supportingDocUrl: z.string().optional(),
  transferDate: z.string().datetime(),
});

export const approveTransferSchema = z.object({
  signatoryId: z.string().min(1, "יש לבחור מורשה חתימה"),
  action: z.enum(["APPROVED", "REJECTED"]),
  notes: z.string().optional(),
});

// ==================== ADMIN EVENTS ====================
export const createAdminEventSchema = z.object({
  organizationId: z.string().min(1, "יש לבחור ארגון"),
  title: z.string().min(1, "כותרת נדרשת"),
  description: z.string().optional(),
  type: z.enum(["EVENT", "MEETING", "TEAM_MEETING", "BOARD_MEETING", "DEADLINE", "REMINDER", "AUDIT", "TRAINING", "FUNDRAISING", "VOLUNTEER_EVENT"]),
  date: z.string(),
  endDate: z.string().optional(),
  time: z.string().optional(),
  endTime: z.string().optional(),
  location: z.string().optional(),
  notes: z.string().optional(),
});

export const updateAdminEventSchema = createAdminEventSchema
  .partial()
  .omit({ organizationId: true })
  .extend({
    status: z.enum(["SCHEDULED", "IN_PROGRESS", "COMPLETED", "CANCELLED"]).optional(),
  });
