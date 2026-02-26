/**
 * Scheduler — BullMQ Repeatable Jobs for 100% automation
 * Called once at worker startup to register all cron jobs.
 */
import { Queue } from "bullmq";

const redisUrl = process.env.REDIS_URL;

function makeConnection() {
  if (!redisUrl) return undefined;
  try {
    const url = new URL(redisUrl);
    return {
      host: url.hostname,
      port: Number(url.port) || 6379,
      password: url.password || undefined,
      username: url.username || undefined,
    };
  } catch {
    return undefined;
  }
}

export type CronJobType =
  | "BANK_SYNC"
  | "MORNING_DIGEST"
  | "COMPLIANCE_REMINDERS"
  | "CLEANUP_LOGS"
  | "WEEKLY_REPORT"
  | "MONTHLY_REPORT";

interface CronJobDef {
  name: string;
  type: CronJobType;
  /** cron expression — minute hour dayOfMonth month dayOfWeek (Israel time UTC+2) */
  pattern: string;
  description: string;
}

export const CRON_JOBS: CronJobDef[] = [
  {
    name: "bank-sync",
    type: "BANK_SYNC",
    pattern: "45 5 * * *", // 07:45 IL = 05:45 UTC
    description: "סנכרון בנק יומי — שליפת יתרות ותנועות",
  },
  {
    name: "morning-digest",
    type: "MORNING_DIGEST",
    pattern: "0 6 * * *", // 08:00 IL = 06:00 UTC
    description: "דיג׳סט בוקר — מייל + WhatsApp למנהלים",
  },
  {
    name: "compliance-reminders",
    type: "COMPLIANCE_REMINDERS",
    pattern: "30 6 * * *", // 08:30 IL = 06:30 UTC
    description: "תזכורות ניהול תקין — דדליינים קרובים",
  },
  {
    name: "cleanup-logs",
    type: "CLEANUP_LOGS",
    pattern: "0 21 * * *", // 23:00 IL = 21:00 UTC
    description: "ניקוי לוגים ישנים",
  },
  {
    name: "weekly-report",
    type: "WEEKLY_REPORT",
    pattern: "0 7 * * 0", // Sunday 09:00 IL = 07:00 UTC
    description: "דוח שבועי לוועד",
  },
  {
    name: "monthly-report",
    type: "MONTHLY_REPORT",
    pattern: "0 7 1 * *", // 1st of month 09:00 IL = 07:00 UTC
    description: "דוח חודשי פעילות",
  },
];

/**
 * Register all cron jobs as BullMQ repeatable jobs.
 * Safe to call multiple times — BullMQ upserts by name.
 */
export async function registerCronJobs() {
  const connection = makeConnection();
  if (!connection) {
    console.warn("[scheduler] REDIS_URL not set — cron jobs not registered");
    return;
  }

  const queue = new Queue("scheduled", { connection });

  for (const job of CRON_JOBS) {
    await queue.upsertJobScheduler(
      job.name,
      { pattern: job.pattern },
      {
        name: job.name,
        data: { type: job.type },
        opts: {
          attempts: 3,
          backoff: { type: "exponential", delay: 10_000 },
        },
      }
    );
    console.log(`[scheduler] ✓ Registered: ${job.name} (${job.pattern}) — ${job.description}`);
  }

  await queue.close();
}
