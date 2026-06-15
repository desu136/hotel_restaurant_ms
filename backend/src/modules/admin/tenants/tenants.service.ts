import { prisma } from "@/modules/shared/prisma";
import bcrypt from "bcrypt";
import { BusinessType, TenantStatus } from "@prisma/client";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ListTenantsParams {
  search?: string;
  status?: string;
  business_type?: string;
  page?: number;
  limit?: number;
}

export interface CreateTenantInput {
  business_name: string;
  owner_name: string;
  email: string;
  phone: string;
  business_type: string;
  address?: string;
  license_info?: string;
  tax_info?: string;
}

export interface UpdateTenantInput {
  business_name?: string;
  owner_name?: string;
  email?: string;
  phone?: string;
  business_type?: string;
  address?: string;
  license_info?: string;
  tax_info?: string;
  status?: string;
}

// ─── Service Functions ────────────────────────────────────────────────────────

export async function listTenants(params: ListTenantsParams) {
  const { search = "", status, business_type, page = 1, limit = 10 } = params;

  const where: any = {};

  if (search) {
    where.OR = [
      { business_name: { contains: search, mode: "insensitive" } },
      { owner_name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
    ];
  }
  if (status) where.status = status;
  if (business_type) where.business_type = business_type;

  const [total, tenants] = await Promise.all([
    prisma.tenant.count({ where }),
    prisma.tenant.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      include: {
        subscriptions: {
          include: { plan: true },
          orderBy: { created_at: "desc" },
          take: 1,
        },
      },
      orderBy: { created_at: "desc" },
    }),
  ]);

  return {
    data: tenants,
    meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
  };
}

export async function getTenant(id: string) {
  return prisma.tenant.findUnique({
    where: { id },
    include: {
      subscriptions: { include: { plan: true }, orderBy: { created_at: "desc" } },
      modules: { include: { module: true } },
      users: { where: { status: "ACTIVE" }, take: 1 },
    },
  });
}

export async function createTenant(input: CreateTenantInput) {
  return prisma.tenant.create({
    data: {
      ...input,
      business_type: input.business_type as BusinessType,
      status: "PENDING" as TenantStatus,
    },
  });
}

export async function updateTenant(id: string, input: UpdateTenantInput) {
  return prisma.tenant.update({
    where: { id },
    data: {
      ...(input.business_name !== undefined && { business_name: input.business_name }),
      ...(input.owner_name !== undefined && { owner_name: input.owner_name }),
      ...(input.email !== undefined && { email: input.email }),
      ...(input.phone !== undefined && { phone: input.phone }),
      ...(input.address !== undefined && { address: input.address }),
      ...(input.license_info !== undefined && { license_info: input.license_info }),
      ...(input.tax_info !== undefined && { tax_info: input.tax_info }),
      ...(input.business_type !== undefined && { business_type: input.business_type as BusinessType }),
      ...(input.status !== undefined && { status: input.status as TenantStatus }),
    },
  });
}

export async function approveTenant(tenantId: string, planId: string | undefined, actorUserId: string) {
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant) throw Object.assign(new Error("Tenant not found"), { statusCode: 404 });
  if (tenant.status === "ACTIVE") throw Object.assign(new Error("Tenant is already active"), { statusCode: 400 });

  // Resolve plan
  const plan = planId
    ? await prisma.subscriptionPlan.findUnique({ where: { id: planId }, include: { modules: true } })
    : await prisma.subscriptionPlan.findFirst({ where: { name: "Trial Plan" }, include: { modules: true } });

  if (!plan) throw Object.assign(new Error("Subscription plan not found"), { statusCode: 404 });

  // Resolve role
  const ownerRole = await prisma.role.findUnique({ where: { code: "HOTEL_OWNER" } });
  const tenantAdminRole = await prisma.role.findUnique({ where: { code: "TENANT_ADMIN" } });
  const roleIdToAssign = ownerRole?.id || tenantAdminRole?.id;
  if (!roleIdToAssign) throw Object.assign(new Error("System roles not configured"), { statusCode: 500 });

  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + (plan.trial_days > 0 ? plan.trial_days : 30));

  const result = await prisma.$transaction(async (tx) => {
    // 1. Activate tenant
    const updatedTenant = await tx.tenant.update({
      where: { id: tenantId },
      data: { status: "ACTIVE" },
    });

    // 2. Create subscription
    await tx.tenantSubscription.create({
      data: {
        tenant_id: tenantId,
        plan_id: plan.id,
        start_date: startDate,
        end_date: endDate,
        status: plan.trial_days > 0 ? "TRIAL" : "ACTIVE",
      },
    });

    // 3. Assign modules (skip duplicates)
    for (const planModule of plan.modules) {
      const exists = await tx.tenantModule.findFirst({
        where: { tenant_id: tenantId, module_id: planModule.module_id },
      });
      if (!exists) {
        await tx.tenantModule.create({
          data: { tenant_id: tenantId, module_id: planModule.module_id, enabled: true },
        });
      }
    }

    // 4. User: activate existing or create new
    let tempPassword: string | null = null;
    const existingUser = await tx.user.findUnique({ where: { email: tenant.email } });

    if (existingUser) {
      await tx.user.update({
        where: { id: existingUser.id },
        data: { status: "ACTIVE", tenant_id: tenantId },
      });
    } else {
      tempPassword = Math.random().toString(36).slice(-10);
      const passwordHash = await bcrypt.hash(tempPassword, 10);
      await tx.user.create({
        data: {
          tenant_id: tenantId,
          full_name: tenant.owner_name,
          email: tenant.email,
          phone: tenant.phone,
          password_hash: passwordHash,
          status: "ACTIVE",
          roles: { create: { role_id: roleIdToAssign } },
        },
      });
    }

    // 5. Audit log
    await tx.auditLog.create({
      data: {
        user_id: actorUserId,
        tenant_id: tenantId,
        action: "TENANT_APPROVED",
        resource: "Tenant",
      },
    });

    return { updatedTenant, userEmail: tenant.email, tempPassword };
  });

  return {
    tenant: result.updatedTenant,
    credentials: result.tempPassword
      ? { email: result.userEmail, password: result.tempPassword }
      : null,
  };
}
