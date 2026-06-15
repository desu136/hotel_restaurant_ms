import { prisma } from "@/modules/shared/prisma";

export async function listAuditLogs(params: { page?: number; limit?: number }) {
  const { page = 1, limit = 20 } = params;

  const [total, logs] = await Promise.all([
    prisma.auditLog.count(),
    prisma.auditLog.findMany({
      skip: (page - 1) * limit,
      take: limit,
      include: {
        user: { select: { full_name: true, email: true } },
        tenant: { select: { business_name: true } },
      },
      orderBy: { timestamp: "desc" },
    }),
  ]);

  return {
    data: logs,
    meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
  };
}
