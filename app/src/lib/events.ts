import { Prisma } from "@prisma/client";
import { redis } from "./redis";
import { prisma } from "./prisma";

export type AppEvent = {
  type: string;
  organizationId: string;
  entityId?: string;
  data?: Record<string, unknown>;
  userId?: string;
  timestamp?: string;
};

const CHANNEL = "maatafet:events";

const listeners: Array<(event: AppEvent) => void | Promise<void>> = [];

export function onEvent(listener: (event: AppEvent) => void | Promise<void>) {
  listeners.push(listener);
}

export async function publishEvent(event: AppEvent) {
  const enriched = { ...event, timestamp: event.timestamp ?? new Date().toISOString() };

  // Publish to Redis if available
  if (redis) {
    try {
      await redis.publish(CHANNEL, JSON.stringify(enriched));
    } catch {
      // Redis unavailable — fall through to local
    }
  }

  // Always run local listeners (for in-process automation matching)
  for (const fn of listeners) {
    try {
      await fn(enriched);
    } catch {
      // event listener error handled silently
    }
  }
}

// Auto-register automation engine as event listener
let automationRegistered = false;
export function registerAutomationListener() {
  if (automationRegistered) return;
  automationRegistered = true;
  onEvent(async (event) => {
    try {
      const { matchAndExecuteWorkflows } = await import("./automation/engine");
      await matchAndExecuteWorkflows(event);
    } catch {
      // automation matching error handled silently
    }
  });
}

// Auto-register on first import in server context
if (typeof window === "undefined") {
  registerAutomationListener();
}

export async function logAudit(params: {
  organizationId?: string;
  userId?: string;
  action: string;
  entity: string;
  entityId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        action: params.action,
        entity: params.entity,
        entityId: params.entityId,
        details: params.details as Prisma.InputJsonValue | undefined,
        ipAddress: params.ipAddress,
        ...(params.organizationId ? { organization: { connect: { id: params.organizationId } } } : {}),
        ...(params.userId ? { user: { connect: { id: params.userId } } } : {}),
      },
    });
  } catch {
    // audit log write failed silently
  }
}
