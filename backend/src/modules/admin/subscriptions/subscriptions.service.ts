import { prisma } from "@/modules/shared/prisma";

export interface CreatePlanInput {
  name: string;
  description?: string;
  monthly_price: number;
  annual_price: number;
  trial_days: number;
  module_ids?: string[];
}

export interface UpdatePlanInput extends Partial<CreatePlanInput> {}

export async function listPlans() {
  return prisma.subscriptionPlan.findMany({
    include: { modules: { include: { module: true } } },
    orderBy: { created_at: "desc" },
  });
}

export async function createPlan(input: CreatePlanInput) {
  const { module_ids, ...data } = input;
  return prisma.subscriptionPlan.create({
    data: {
      ...data,
      modules: module_ids?.length
        ? { create: module_ids.map((id) => ({ module_id: id })) }
        : undefined,
    },
    include: { modules: { include: { module: true } } },
  });
}

export async function updatePlan(id: string, input: UpdatePlanInput) {
  const { module_ids, ...data } = input;

  return prisma.$transaction(async (tx) => {
    if (module_ids !== undefined) {
      // Replace module associations
      await tx.planModule.deleteMany({ where: { plan_id: id } });
      if (module_ids.length > 0) {
        await tx.planModule.createMany({
          data: module_ids.map((mid) => ({ plan_id: id, module_id: mid })),
        });
      }
    }
    return tx.subscriptionPlan.update({
      where: { id },
      data,
      include: { modules: { include: { module: true } } },
    });
  });
}

export async function deletePlan(id: string) {
  return prisma.subscriptionPlan.delete({ where: { id } });
}
