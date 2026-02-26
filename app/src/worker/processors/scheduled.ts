import type { Job } from "bullmq";
import { checkScheduledTasks } from "../../lib/automation/scheduler";
import { runBankSync } from "../../lib/jobs/bank-sync";
import { runMorningDigest } from "../../lib/jobs/morning-digest";
import { runComplianceReminders } from "../../lib/jobs/compliance-reminders";
import { runCleanupLogs } from "../../lib/jobs/cleanup-logs";
import { runWeeklyReport } from "../../lib/jobs/weekly-report";
import { runMonthlyReport } from "../../lib/jobs/monthly-report";
import { runClassifyTransactions } from "../../lib/jobs/classify-transactions";
import type { CronJobType } from "../../lib/scheduler";

type ScheduledJobData = {
  type?: CronJobType;
  [key: string]: unknown;
};

export async function processScheduledJob(job: Job<ScheduledJobData>) {
  const type = job.data?.type;

  if (!type) {
    // Legacy: check DB-driven scheduled tasks
    console.log("[scheduled] Running legacy task check...");
    const count = await checkScheduledTasks();
    console.log(`[scheduled] Processed ${count} legacy tasks`);
    return;
  }

  console.log(`[scheduled] Running: ${type}`);

  switch (type) {
    case "BANK_SYNC":
      await runBankSync();
      break;
    case "MORNING_DIGEST":
      await runMorningDigest();
      break;
    case "COMPLIANCE_REMINDERS":
      await runComplianceReminders();
      break;
    case "CLEANUP_LOGS":
      await runCleanupLogs();
      break;
    case "WEEKLY_REPORT":
      await runWeeklyReport();
      break;
    case "MONTHLY_REPORT":
      await runMonthlyReport();
      break;
    case "CLASSIFY_TRANSACTIONS":
      await runClassifyTransactions();
      break;
    default:
      console.warn(`[scheduled] Unknown job type: ${type}`);
  }
}
