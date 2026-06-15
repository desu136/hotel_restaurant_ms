import { prisma } from "@/modules/shared/prisma";

export async function listModules() {
  return prisma.module.findMany({ orderBy: { created_at: "asc" } });
}

export async function createModule(input: {
  code: string;
  name: string;
  description?: string;
  is_active?: boolean;
}) {
  return prisma.module.create({ data: { ...input, is_active: input.is_active ?? true } });
}

export async function updateModule(
  id: string,
  input: { name?: string; description?: string; is_active?: boolean }
) {
  return prisma.module.update({ where: { id }, data: input });
}
