import { prisma } from "@/modules/shared/prisma";

export async function listSettings() {
  return prisma.platformSetting.findMany();
}

export async function updateSettings(settings: { key: string; value: string }[]) {
  const updated = [];
  for (const s of settings) {
    const result = await prisma.platformSetting.update({
      where: { key: s.key },
      data: { value: s.value.toString() },
    });
    updated.push(result);
  }
  return updated;
}
