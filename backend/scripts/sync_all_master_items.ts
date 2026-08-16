/**
 * Sync all existing master categories & master menu items to all branches for all tenants.
 * Run once: npx tsx scripts/sync_all_master_items.ts
 */
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const branches = await prisma.branch.findMany({
    where: { deleted_at: null },
    select: { id: true, tenant_id: true, restaurant_id: true, name: true }
  });

  console.log(`Found ${branches.length} branches. Syncing master menu items and master categories...`);

  for (const branch of branches) {
    const masterCategories = await prisma.masterCategory.findMany({
      where: { tenant_id: branch.tenant_id, deleted_at: null }
    });

    const existingBranchCats = await prisma.category.findMany({
      where: { branch_id: branch.id, deleted_at: null }
    });

    const categoryMap = new Map<string, string>();
    for (const bc of existingBranchCats) {
      if (bc.master_category_id) {
        categoryMap.set(bc.master_category_id, bc.id);
      }
    }

    const existingMasterCatIds = new Set(existingBranchCats.map(c => c.master_category_id).filter(Boolean));
    const missingMasterCats = masterCategories.filter(mc => !existingMasterCatIds.has(mc.id));

    for (const mc of missingMasterCats) {
      const created = await prisma.category.create({
        data: {
          name: mc.name,
          tenant_id: branch.tenant_id,
          branch_id: branch.id,
          master_category_id: mc.id
        }
      });
      categoryMap.set(mc.id, created.id);
    }

    const masterMenuItems = await prisma.masterMenuItem.findMany({
      where: { tenant_id: branch.tenant_id, deleted_at: null }
    });

    const existingBranchMenuItems = await prisma.menuItem.findMany({
      where: { branch_id: branch.id }
    });
    const existingMasterMenuIds = new Set(existingBranchMenuItems.map(m => m.master_menu_item_id).filter(Boolean));
    const missingMasterMenuItems = masterMenuItems.filter(mmi => !existingMasterMenuIds.has(mmi.id));

    for (const mmi of missingMasterMenuItems) {
      const localCatId = mmi.master_category_id ? categoryMap.get(mmi.master_category_id) : null;
      await prisma.menuItem.create({
        data: {
          tenant_id: branch.tenant_id,
          branch_id: branch.id,
          master_menu_item_id: mmi.id,
          category_id: localCatId || null,
          display_name: mmi.display_name,
          description: mmi.description,
          price: mmi.price,
          availability: mmi.availability,
          customizations: mmi.customizations || undefined,
          image_url: mmi.image_url,
          image_urls: mmi.image_urls || undefined,
          prep_time: mmi.prep_time || 0
        }
      });
    }

    console.log(`✅ Synced branch "${branch.name}" (${branch.id}): +${missingMasterCats.length} categories, +${missingMasterMenuItems.length} menu items.`);
  }

  console.log("Master sync finished successfully!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
