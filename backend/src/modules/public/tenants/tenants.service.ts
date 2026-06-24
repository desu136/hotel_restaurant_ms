import { prisma } from "@/modules/shared/prisma";
import { hash } from "bcrypt";
import { BusinessType } from "@prisma/client";

export interface RegisterTenantInput {
  businessName: string;
  businessType: string;
  ownerName: string;
  email: string;
  phone: string;
  password: string;
}

export async function registerTenant(input: RegisterTenantInput) {
  const { businessName, businessType, ownerName, email, phone, password } = input;
  const passwordHash = await hash(password, 10);

  return prisma.$transaction(async (tx) => {
    const tenant = await tx.tenant.create({
      data: {
        business_name: businessName,
        business_type: businessType as BusinessType,
        owner_name: ownerName,
        email,
        phone,
        status: "PENDING",
      },
    });

    await tx.user.create({
      data: {
        tenant_id: tenant.id,
        full_name: ownerName,
        email,
        phone,
        password_hash: passwordHash,
        status: "ACTIVE",
      },
    });

    // Default trial plan
    let plan = await tx.subscriptionPlan.findFirst({ where: { name: "Trial Plan" } });
    if (!plan) {
      plan = await tx.subscriptionPlan.create({
        data: { name: "Trial Plan", monthly_price: 0, annual_price: 0, trial_days: 14 },
      });
    }

    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + plan.trial_days);

    await tx.tenantSubscription.create({
      data: {
        tenant_id: tenant.id,
        plan_id: plan.id,
        start_date: startDate,
        end_date: endDate,
        status: "TRIAL",
      },
    });

    return tenant;
  }, { timeout: 30000 });
}
