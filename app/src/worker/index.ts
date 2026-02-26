import "dotenv/config";
import { Worker } from "bullmq";
import { processAutomationJob } from "./processors/automation";
import { processEmailJob } from "./processors/email";
import { processScheduledJob } from "./processors/scheduled";
import { registerCronJobs } from "../lib/scheduler";

const redisUrl = process.env.REDIS_URL;
if (!redisUrl) {
  console.error("REDIS_URL not set — worker cannot start");
  process.exit(1);
}

// Parse Redis URL to avoid ioredis version conflicts with BullMQ
const url = new URL(redisUrl);
const connection = {
  host: url.hostname,
  port: Number(url.port) || 6379,
  password: url.password || undefined,
  username: url.username || undefined,
};

console.log("🚀 Starting Ma'atafet workers...");

// ── Register all repeatable cron jobs ─────────────────────────────────────────
await registerCronJobs();

// ── Workers ───────────────────────────────────────────────────────────────────
const automationWorker = new Worker("automation", processAutomationJob, {
  connection,
  concurrency: 5,
});

const emailWorker = new Worker("email", processEmailJob, {
  connection,
  concurrency: 10,
});

const scheduledWorker = new Worker("scheduled", processScheduledJob, {
  connection,
  concurrency: 1,
});

// ── Event listeners ───────────────────────────────────────────────────────────
automationWorker.on("completed", (job) => {
  console.log(`[automation] ✓ Job ${job.id} completed`);
});
automationWorker.on("failed", (job, err) => {
  console.error(`[automation] ✗ Job ${job?.id} failed:`, err.message);
});

emailWorker.on("completed", (job) => {
  console.log(`[email] ✓ Job ${job.id} completed`);
});
emailWorker.on("failed", (job, err) => {
  console.error(`[email] ✗ Job ${job?.id} failed:`, err.message);
});

scheduledWorker.on("completed", (job) => {
  console.log(`[scheduled] ✓ ${job.data?.type ?? job.id}`);
});
scheduledWorker.on("failed", (job, err) => {
  console.error(`[scheduled] ✗ ${job?.data?.type ?? job?.id}:`, err.message);
});

console.log("✅ All workers started. Waiting for jobs...");
console.log("📅 Cron schedule (Israel time UTC+2):");
console.log("   07:45 — Bank sync");
console.log("   08:00 — Morning digest (email + WhatsApp)");
console.log("   08:30 — Compliance deadline reminders");
console.log("   23:00 — Log cleanup");
console.log("   Sunday 09:00 — Weekly report");
console.log("   1st of month 09:00 — Monthly report");

// ── Graceful shutdown ─────────────────────────────────────────────────────────
process.on("SIGTERM", async () => {
  console.log("Shutting down workers...");
  await automationWorker.close();
  await emailWorker.close();
  await scheduledWorker.close();
  process.exit(0);
});
