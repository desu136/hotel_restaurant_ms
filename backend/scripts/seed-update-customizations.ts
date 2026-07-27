/// <reference types="node" />
import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const BOLE_BRANCH_ID = '77f317f1-102e-4907-8d21-f840b4a28111'

// ─── Text-only customization groups added to every menu item ─────────────────
// These have NO image_url on values. First value in each group is default.
const TEXT_CUSTOMIZATIONS = [
  {
    key: 'serving',
    label: 'Serving Style',
    multiple: false,
    values: [
      { name: 'Dine In', extraPrice: 0, default: true },
      { name: 'Takeaway Box', extraPrice: 0.50, default: false },
      { name: 'Sharing Platter', extraPrice: 1.00, default: false },
    ],
  },
  {
    key: 'notes',
    label: 'Special Instructions',
    multiple: true,
    values: [
      { name: 'No special notes', extraPrice: 0, default: true },
      { name: 'Less salt', extraPrice: 0, default: false },
      { name: 'No onions', extraPrice: 0, default: false },
      { name: 'Extra crispy', extraPrice: 0, default: false },
      { name: 'Well done', extraPrice: 0, default: false },
      { name: 'Sauce on the side', extraPrice: 0, default: false },
    ],
  },
  {
    key: 'allergens',
    label: 'Allergen / Dietary',
    multiple: true,
    values: [
      { name: 'None', extraPrice: 0, default: true },
      { name: 'Gluten-Free', extraPrice: 0.50, default: false },
      { name: 'Dairy-Free', extraPrice: 0, default: false },
      { name: 'Nut-Free', extraPrice: 0, default: false },
      { name: 'Vegan', extraPrice: 0, default: false },
    ],
  },
]

// ─── Add default:true to first value of each existing group ──────────────────
function markDefaults(customizations: any[]): any[] {
  return customizations.map((group: any) => ({
    ...group,
    values: (group.values ?? []).map((v: any, idx: number) => ({
      ...v,
      default: idx === 0 ? true : false,
    })),
  }))
}

// ─── Merge: existing (with defaults) + text-only groups ──────────────────────
function mergeCustomizations(existing: any[]): any[] {
  const withDefaults = markDefaults(existing)

  // Only add text groups that aren't already present (by key)
  const existingKeys = new Set(withDefaults.map((g: any) => g.key))
  const newGroups = TEXT_CUSTOMIZATIONS.filter(g => !existingKeys.has(g.key))

  return [...withDefaults, ...newGroups]
}

// ─── MAIN ────────────────────────────────────────────────────────────────────
async function main() {
  console.log('🔧 Updating customizations for all Bole Branch menu items...\n')

  const items = await prisma.menuItem.findMany({
    where: { branch_id: BOLE_BRANCH_ID },
    select: { id: true, display_name: true, customizations: true },
  })

  console.log(`Found ${items.length} menu items to update.\n`)

  let updated = 0

  for (const item of items) {
    let existing: any[] = []
    try {
      existing = Array.isArray(item.customizations)
        ? item.customizations
        : typeof item.customizations === 'string'
          ? JSON.parse(item.customizations)
          : []
    } catch {
      existing = []
    }

    const merged = mergeCustomizations(existing)

    await prisma.menuItem.update({
      where: { id: item.id },
      data: { customizations: merged },
    })

    updated++
    if (updated % 20 === 0 || updated === items.length) {
      console.log(`  ✅  ${updated}/${items.length} updated...`)
    }
  }

  console.log(`\n✅ Done! Updated ${updated} menu items.`)
  console.log(`   Each item now has:`)
  console.log(`   • Existing image-based customization groups — first value marked default: true`)
  console.log(`   • + "Serving Style" text group (3 options, default: Dine In)`)
  console.log(`   • + "Special Instructions" text group (6 options, default: No special notes)`)
  console.log(`   • + "Allergen / Dietary" text group (5 options, default: None)`)
}

main()
  .catch((e) => { console.error('❌ Update failed:', e); process.exit(1) })
  .finally(() => prisma.$disconnect())
