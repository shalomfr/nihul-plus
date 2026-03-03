import { Queue } from "bullmq";

const redisUrl = process.env.REDIS_URL;

function makeConnection() {
  if (!redisUrl) return undefined;
  // Parse Redis URL for BullMQ connection to avoid ioredis version conflicts
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

const connection = makeConnection();

export const automationQueue = connection
  ? new Queue("automation", { connection })
  : null;

export const emailQueue = connection
  ? new Queue("email", { connection })
  : null;

export const scheduledQueue = connection
  ? new Queue("scheduled", { connection })
  : null;

export async function enqueueAutomation(data: {
  workflowId: string;
  executionId: string;
  organizationId: string;
  triggerData?: Record<string, unknown>;
}) {
  if (!automationQueue) {
    return null;
  }
  return automationQueue.add("run-workflow", data, {
    attempts: 3,
    backoff: { type: "exponential", delay: 5000 },
  });
}

export async function enqueueEmail(data: {
  to: string;
  subject: string;
  html: string;
  from?: string;
}) {
  if (!emailQueue) {
    return null;
  }
  return emailQueue.add("send-email", data, { attempts: 3 });
}
