/**
 * Cleanup Logs Job — removes old audit logs and execution logs.
 * Runs at 23:00 every night.
 * Keeps: AuditLog for 2 years, WorkflowExecution for 90 days.
 */
import { prisma } from "../prisma";

export async function runCleanupLogs() {
  console.log("[cleanup-logs] Starting...");

  const twoYearsAgo = new Date(Date.now() - 2 * 365 * 24 * 60 * 60 * 1000);
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

  const [auditDeleted, executionDeleted] = await Promise.all([
    prisma.auditLog.deleteMany({
      where: { createdAt: { lt: twoYearsAgo } },
    }),
    prisma.workflowExecution.deleteMany({
      where: {
        createdAt: { lt: ninetyDaysAgo },
        status: { in: ["SUCCESS", "FAILED"] },
      },
    }),
  ]);

  console.log(`[cleanup-logs] Deleted: ${auditDeleted.count} audit logs, ${executionDeleted.count} execution logs`);
}
