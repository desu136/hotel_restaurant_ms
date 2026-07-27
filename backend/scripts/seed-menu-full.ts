/// <reference types="node" />
import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { v2 as cloudinary } from 'cloudinary'
import * as path from 'path'

const prisma = new PrismaClient()

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

const BOLE_BRANCH_ID = '77f317f1-102e-4907-8d21-f840b4a28111'
const IMAGES_DIR = path.resolve(__dirname, '../../../../images')
const LOCAL_IMAGES = [
  'food1.jpeg', 'food2.jpeg', 'food3.jpeg', 'food4.jpeg',
  'food5.jpeg', 'food6.jpeg', 'food7.jpeg', 'food8.jpeg',
  'special_1.jpeg', 'special_2.jpeg',
]

// ─── Upload images once ────────────────────────────────────────────────────
async function uploadImages(): Promise<string[]> {
  const urls: string[] = []
  for (const filename of LOCAL_IMAGES) {
    const filePath = path.join(IMAGES_DIR, filename)
    console.log(`  Uploading ${filename}...`)
    const result = await cloudinary.uploader.upload(filePath, {
      folder: 'qr-menu-seed',
      public_id: `seed_${filename.replace('.', '_')}`,
      overwrite: false,
      resource_type: 'image',
    })
    urls.push(result.secure_url)
  }
  return urls
}

function img(urls: string[], idx: number) { return urls[idx % urls.length] }

// ─── Build 3 menu item definitions for any subcategory ──────────────────────
// Each item gets images on customization option values too.
function makeItems(
  catName: string,
  subcatName: string,
  catId: string,
  tenantId: string,
  restaurantId: string,
  urls: string[],
  idxOffset: number,
) {
  // Seed-stable dexel IDs derived from category+subcat name
  const base = `${catName.toLowerCase().replace(/[^a-z0-9]/g, '')}-${subcatName.toLowerCase().replace(/[^a-z0-9]/g, '')}`

  const i0 = img(urls, idxOffset)
  const i1 = img(urls, idxOffset + 1)
  const i2 = img(urls, idxOffset + 2)
  const i3 = img(urls, idxOffset + 3)
  const i4 = img(urls, idxOffset + 4)

  return [
    {
      dexel_id: `${base}-001`,
      display_name: `${subcatName} Signature`,
      description: `Our signature ${subcatName.toLowerCase()} dish crafted with premium ingredients, slow-cooked for maximum flavour and served with house-made sides. A guest favourite since opening day.`,
      price: 14.99,
      prep_time: 15,
      availability: true,
      image_url: i0,
      image_urls: [i0, i1, i2],
      customizations: [
        {
          key: 'size',
          label: 'Portion Size',
          multiple: false,
          values: [
            { name: 'Regular', extraPrice: 0, image_url: i0 },
            { name: 'Large', extraPrice: 3.50, image_url: i1 },
          ],
        },
        {
          key: 'spice',
          label: 'Spice Level',
          multiple: false,
          values: [
            { name: 'Mild', extraPrice: 0, image_url: i2 },
            { name: 'Medium', extraPrice: 0, image_url: i2 },
            { name: 'Hot 🌶️', extraPrice: 0, image_url: i3 },
          ],
        },
        {
          key: 'extras',
          label: 'Add-Ons',
          multiple: true,
          values: [
            { name: 'Extra Sauce', extraPrice: 0.75, image_url: i4 },
            { name: 'Side Salad', extraPrice: 1.50, image_url: i0 },
            { name: 'Grilled Veggies', extraPrice: 2.00, image_url: i1 },
          ],
        },
      ],
      category_id: catId,
    },
    {
      dexel_id: `${base}-002`,
      display_name: `${subcatName} Classic`,
      description: `A timeless classic in our ${catName} menu. Made fresh to order with locally-sourced ingredients, bold seasoning, and a perfectly balanced finish your guests will keep coming back for.`,
      price: 12.50,
      prep_time: 12,
      availability: true,
      image_url: i1,
      image_urls: [i1, i2, i3],
      customizations: [
        {
          key: 'prep',
          label: 'Cooking Style',
          multiple: false,
          values: [
            { name: 'Grilled', extraPrice: 0, image_url: i1 },
            { name: 'Fried', extraPrice: 0, image_url: i2 },
            { name: 'Baked', extraPrice: 0, image_url: i3 },
          ],
        },
        {
          key: 'side',
          label: 'Choose Side',
          multiple: false,
          values: [
            { name: 'French Fries', extraPrice: 0, image_url: i4 },
            { name: 'Coleslaw', extraPrice: 0, image_url: i0 },
            { name: 'Onion Rings', extraPrice: 1.00, image_url: i1 },
            { name: 'Rice Pilaf', extraPrice: 0.75, image_url: i2 },
          ],
        },
        {
          key: 'dip',
          label: 'Dipping Sauce',
          multiple: true,
          values: [
            { name: 'House Aioli', extraPrice: 0, image_url: i3 },
            { name: 'BBQ', extraPrice: 0, image_url: i4 },
            { name: 'Honey Mustard', extraPrice: 0.50, image_url: i0 },
          ],
        },
      ],
      category_id: catId,
    },
    {
      dexel_id: `${base}-003`,
      display_name: `${subcatName} Special`,
      description: `Chef's weekly special for our ${subcatName} section — a premium creation featuring seasonal ingredients, artisanal garnishes and a complementary house drink on orders over $20.`,
      price: 18.99,
      prep_time: 20,
      availability: true,
      image_url: i2,
      image_urls: [i2, i3, i4],
      customizations: [
        {
          key: 'protein',
          label: 'Protein Choice',
          multiple: false,
          values: [
            { name: 'Chicken', extraPrice: 0, image_url: i0 },
            { name: 'Beef', extraPrice: 2.00, image_url: i1 },
            { name: 'Veggie', extraPrice: -1.00, image_url: i2 },
            { name: 'Seafood', extraPrice: 4.00, image_url: i3 },
          ],
        },
        {
          key: 'sauce',
          label: 'Sauce',
          multiple: false,
          values: [
            { name: 'Classic', extraPrice: 0, image_url: i4 },
            { name: 'Garlic Cream', extraPrice: 0.75, image_url: i0 },
            { name: 'Spicy Tomato', extraPrice: 0.75, image_url: i1 },
          ],
        },
        {
          key: 'allergens',
          label: 'Dietary',
          multiple: true,
          values: [
            { name: 'Gluten-Free', extraPrice: 0.50, image_url: i2 },
            { name: 'Dairy-Free', extraPrice: 0, image_url: i3 },
            { name: 'Vegan', extraPrice: 0, image_url: i4 },
          ],
        },
      ],
      category_id: catId,
    },
  ]
}

// ─── MAIN ──────────────────────────────────────────────────────────────────
async function main() {
  console.log('🌱 Full Bole Branch menu seed starting...\n')

  // Resolve tenant
  const tenant = await prisma.tenant.findFirst({ where: { email: 'owner@grandhorizon.com' } })
  if (!tenant) throw new Error('Tenant not found. Run the main seed first.')

  const restaurant = await prisma.restaurant.findFirst({ where: { tenant_id: tenant.id, deleted_at: null } })
  if (!restaurant) throw new Error('Restaurant not found.')

  const branch = await prisma.branch.findUnique({ where: { id: BOLE_BRANCH_ID } })
  if (!branch) throw new Error('Bole Branch not found.')

  console.log(`✅ Tenant: ${tenant.business_name}`)
  console.log(`✅ Branch: ${branch.name}`)
  console.log(`✅ Restaurant: ${restaurant.name}\n`)

  // Upload images
  console.log('📸 Uploading images to Cloudinary...')
  const urls = await uploadImages()
  console.log(`   Uploaded ${urls.length} images.\n`)

  // Fetch all subcategories (non-root categories) for Bole Branch
  const subcategories = await prisma.category.findMany({
    where: { branch_id: BOLE_BRANCH_ID, parent_id: { not: null }, deleted_at: null },
    include: { parent: true },
    orderBy: { created_at: 'asc' },
  })

  console.log(`Found ${subcategories.length} subcategories to seed.\n`)

  let totalCreated = 0
  let totalSkipped = 0

  for (let i = 0; i < subcategories.length; i++) {
    const subcat = subcategories[i]
    const parentName = subcat.parent?.name ?? 'Unknown'
    const idxOffset = i * 2  // shift image selection per subcat for variety

    console.log(`📂 [${parentName}] → ${subcat.name}`)

    const itemDefs = makeItems(
      parentName,
      subcat.name,
      subcat.id,
      tenant.id,
      restaurant.id,
      urls,
      idxOffset,
    )

    for (const def of itemDefs) {
      // Check if already exists by dexel_id for this branch
      const existing = await prisma.menuItem.findFirst({
        where: { tenant_id: tenant.id, branch_id: BOLE_BRANCH_ID, dexel_product_id: def.dexel_id },
      })

      if (existing) {
        totalSkipped++
        process.stdout.write(`   ⏭️  Skip: ${def.display_name}\n`)
        continue
      }

      // Also upsert a MasterMenuItem (for traceability)
      let masterItem = await prisma.masterMenuItem.findFirst({
        where: { tenant_id: tenant.id, dexel_product_id: def.dexel_id },
      })
      if (!masterItem) {
        masterItem = await prisma.masterMenuItem.create({
          data: {
            tenant_id: tenant.id,
            restaurant_id: restaurant.id,
            dexel_product_id: def.dexel_id,
            display_name: def.display_name,
            description: def.description,
            price: def.price,
            prep_time: def.prep_time,
            availability: def.availability,
            image_url: def.image_url,
            image_urls: def.image_urls,
            customizations: def.customizations,
          },
        })
      }

      await prisma.menuItem.create({
        data: {
          tenant_id: tenant.id,
          branch_id: BOLE_BRANCH_ID,
          category_id: def.category_id,
          master_menu_item_id: masterItem.id,
          dexel_product_id: def.dexel_id,
          display_name: def.display_name,
          description: def.description,
          price: def.price,
          prep_time: def.prep_time,
          availability: def.availability,
          image_url: def.image_url,
          image_urls: def.image_urls,
          customizations: def.customizations,
        },
      })

      totalCreated++
      console.log(`   🍽️  Created: ${def.display_name}  ($${def.price})`)
    }
  }

  console.log(`\n✅ Seed complete!`)
  console.log(`   Created : ${totalCreated} menu items`)
  console.log(`   Skipped : ${totalSkipped} (already existed)`)
  console.log(`   Branch  : ${branch.name}  (${branch.id})`)
}

main()
  .catch((e) => { console.error('❌ Seed failed:', e); process.exit(1) })
  .finally(() => prisma.$disconnect())
