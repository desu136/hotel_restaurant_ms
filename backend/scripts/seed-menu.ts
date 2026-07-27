/// <reference types="node" />
import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { v2 as cloudinary } from 'cloudinary'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

// ─── Local image paths ─────────────────────────────────────────────────────
const IMAGES_DIR = path.resolve(__dirname, '../../../../images')

const LOCAL_IMAGES = [
  'food1.jpeg', 'food2.jpeg', 'food3.jpeg', 'food4.jpeg',
  'food5.jpeg', 'food6.jpeg', 'food7.jpeg', 'food8.jpeg',
  'special_1.jpeg', 'special_2.jpeg',
]

// ─── Upload all local images once, reuse URLs ──────────────────────────────
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

// Pick image by index (wraps around)
function img(urls: string[], idx: number): string {
  return urls[idx % urls.length]
}

// ─── Category & menu item definitions ─────────────────────────────────────
function buildMenuData(urls: string[]) {
  return [
    // ════════════════ APPETIZERS ════════════════
    {
      category: 'Appetizers',
      subcategories: ['Cold Starters', 'Hot Starters', 'Soups'],
      items: [
        {
          dexel_id: 'MENU-A001',
          display_name: 'Truffle Parmesan Fries',
          description: 'Crispy golden fries tossed in truffle oil and shaved parmesan, finished with fresh herbs and a side of aioli dipping sauce.',
          price: 8.99,
          prep_time: 10,
          availability: true,
          image_url: img(urls, 0),
          image_urls: [img(urls, 0), img(urls, 1), img(urls, 8)],
          customizations: [
            {
              key: 'size',
              label: 'Portion Size',
              multiple: false,
              values: [
                { name: 'Regular', extraPrice: 0 },
                { name: 'Large', extraPrice: 2.50 },
              ],
            },
            {
              key: 'dip',
              label: 'Dipping Sauce',
              multiple: false,
              values: [
                { name: 'Aioli', extraPrice: 0 },
                { name: 'BBQ Sauce', extraPrice: 0 },
                { name: 'Cheese Sauce', extraPrice: 0.75 },
              ],
            },
          ],
          subcategory: 'Hot Starters',
        },
        {
          dexel_id: 'MENU-A002',
          display_name: 'Crispy Calamari Rings',
          description: 'Lightly breaded squid rings fried to perfection, served with marinara sauce and a squeeze of fresh lemon.',
          price: 12.50,
          prep_time: 15,
          availability: true,
          image_url: img(urls, 1),
          image_urls: [img(urls, 1), img(urls, 2), img(urls, 9)],
          customizations: [
            {
              key: 'spice',
              label: 'Spice Level',
              multiple: false,
              values: [
                { name: 'Mild', extraPrice: 0 },
                { name: 'Medium', extraPrice: 0 },
                { name: 'Hot', extraPrice: 0 },
              ],
            },
            {
              key: 'sauce',
              label: 'Extra Sauce',
              multiple: true,
              values: [
                { name: 'Marinara', extraPrice: 0 },
                { name: 'Tartar', extraPrice: 0.50 },
              ],
            },
          ],
          subcategory: 'Hot Starters',
        },
        {
          dexel_id: 'MENU-A003',
          display_name: 'Tomato Bisque Soup',
          description: 'Velvety slow-roasted tomato bisque with a drizzle of cream, fresh basil, and a toasted baguette slice.',
          price: 7.99,
          prep_time: 8,
          availability: true,
          image_url: img(urls, 2),
          image_urls: [img(urls, 2), img(urls, 3), img(urls, 8)],
          customizations: [
            {
              key: 'bread',
              label: 'Add Bread',
              multiple: false,
              values: [
                { name: 'None', extraPrice: 0 },
                { name: 'Baguette Slice', extraPrice: 0 },
                { name: 'Garlic Toast', extraPrice: 1.00 },
              ],
            },
          ],
          subcategory: 'Soups',
        },
      ],
    },

    // ════════════════ MAINS ════════════════
    {
      category: 'Mains',
      subcategories: ['Grills', 'Pasta & Risotto', 'Seafood'],
      items: [
        {
          dexel_id: 'MENU-M001',
          display_name: 'Grand Horizon Wagyu Burger',
          description: '200g wagyu beef patty, aged cheddar, caramelised onions, truffle mayo, brioche bun. Served with hand-cut fries or side salad.',
          price: 22.99,
          prep_time: 20,
          availability: true,
          image_url: img(urls, 3),
          image_urls: [img(urls, 3), img(urls, 4), img(urls, 0)],
          customizations: [
            {
              key: 'doneness',
              label: 'Burger Doneness',
              multiple: false,
              values: [
                { name: 'Medium Rare', extraPrice: 0 },
                { name: 'Medium', extraPrice: 0 },
                { name: 'Well Done', extraPrice: 0 },
              ],
            },
            {
              key: 'side',
              label: 'Side',
              multiple: false,
              values: [
                { name: 'Hand-Cut Fries', extraPrice: 0 },
                { name: 'Side Salad', extraPrice: 0 },
                { name: 'Onion Rings', extraPrice: 1.50 },
              ],
            },
            {
              key: 'extras',
              label: 'Extras',
              multiple: true,
              values: [
                { name: 'Extra Patty', extraPrice: 5.00 },
                { name: 'Bacon', extraPrice: 2.00 },
                { name: 'Avocado', extraPrice: 1.50 },
              ],
            },
          ],
          subcategory: 'Grills',
        },
        {
          dexel_id: 'MENU-M002',
          display_name: 'Pan-Seared Atlantic Salmon',
          description: 'Fresh Atlantic salmon fillet seared skin-on, served over lemon beurre blanc with seasonal vegetables and herbed new potatoes.',
          price: 27.50,
          prep_time: 22,
          availability: true,
          image_url: img(urls, 4),
          image_urls: [img(urls, 4), img(urls, 5), img(urls, 9)],
          customizations: [
            {
              key: 'sauce',
              label: 'Sauce',
              multiple: false,
              values: [
                { name: 'Lemon Beurre Blanc', extraPrice: 0 },
                { name: 'Dill Cream', extraPrice: 0 },
                { name: 'Capers & Brown Butter', extraPrice: 0 },
              ],
            },
            {
              key: 'side',
              label: 'Side',
              multiple: false,
              values: [
                { name: 'Herbed Potatoes', extraPrice: 0 },
                { name: 'Steamed Vegetables', extraPrice: 0 },
                { name: 'Wild Rice', extraPrice: 1.00 },
              ],
            },
          ],
          subcategory: 'Seafood',
        },
        {
          dexel_id: 'MENU-M003',
          display_name: 'Wild Mushroom Truffle Risotto',
          description: 'Creamy arborio rice with a medley of wild mushrooms, shaved black truffle, aged parmesan and fresh thyme. Vegetarian.',
          price: 19.99,
          prep_time: 25,
          availability: true,
          image_url: img(urls, 5),
          image_urls: [img(urls, 5), img(urls, 6), img(urls, 8)],
          customizations: [
            {
              key: 'protein',
              label: 'Add Protein',
              multiple: false,
              values: [
                { name: 'None', extraPrice: 0 },
                { name: 'Grilled Chicken', extraPrice: 5.00 },
                { name: 'Sautéed Prawns', extraPrice: 7.00 },
              ],
            },
            {
              key: 'cheese',
              label: 'Extra Parmesan',
              multiple: false,
              values: [
                { name: 'Standard', extraPrice: 0 },
                { name: 'Extra', extraPrice: 0.75 },
              ],
            },
          ],
          subcategory: 'Pasta & Risotto',
        },
      ],
    },

    // ════════════════ DRINKS ════════════════
    {
      category: 'Drinks',
      subcategories: ['Juices & Smoothies', 'Hot Beverages', 'Cocktails & Beer'],
      items: [
        {
          dexel_id: 'MENU-D001',
          display_name: 'Tropical Sunrise Smoothie',
          description: 'Blended mango, pineapple, passionfruit and coconut cream topped with chia seeds. Refreshing and naturally dairy-free.',
          price: 7.50,
          prep_time: 5,
          availability: true,
          image_url: img(urls, 6),
          image_urls: [img(urls, 6), img(urls, 7), img(urls, 9)],
          customizations: [
            {
              key: 'size',
              label: 'Cup Size',
              multiple: false,
              values: [
                { name: 'Regular (350ml)', extraPrice: 0 },
                { name: 'Large (500ml)', extraPrice: 1.50 },
              ],
            },
            {
              key: 'add_in',
              label: 'Add-Ins',
              multiple: true,
              values: [
                { name: 'Protein Powder', extraPrice: 1.50 },
                { name: 'Honey', extraPrice: 0.50 },
                { name: 'Flaxseeds', extraPrice: 0.50 },
              ],
            },
          ],
          subcategory: 'Juices & Smoothies',
        },
        {
          dexel_id: 'MENU-D002',
          display_name: 'Single Origin Arabica Coffee',
          description: 'Ethiopian Yirgacheffe single-origin espresso, served as your choice of style. Notes of blueberry and dark chocolate.',
          price: 5.99,
          prep_time: 4,
          availability: true,
          image_url: img(urls, 7),
          image_urls: [img(urls, 7), img(urls, 8), img(urls, 0)],
          customizations: [
            {
              key: 'style',
              label: 'Coffee Style',
              multiple: false,
              values: [
                { name: 'Espresso', extraPrice: 0 },
                { name: 'Americano', extraPrice: 0 },
                { name: 'Flat White', extraPrice: 0 },
                { name: 'Cappuccino', extraPrice: 0 },
                { name: 'Latte', extraPrice: 0.50 },
              ],
            },
            {
              key: 'milk',
              label: 'Milk Type',
              multiple: false,
              values: [
                { name: 'Full Cream', extraPrice: 0 },
                { name: 'Skim', extraPrice: 0 },
                { name: 'Oat Milk', extraPrice: 0.75 },
                { name: 'Almond Milk', extraPrice: 0.75 },
              ],
            },
            {
              key: 'temp',
              label: 'Temperature',
              multiple: false,
              values: [
                { name: 'Hot', extraPrice: 0 },
                { name: 'Iced', extraPrice: 0.50 },
              ],
            },
          ],
          subcategory: 'Hot Beverages',
        },
        {
          dexel_id: 'MENU-D003',
          display_name: 'Craft IPA Signature Beer',
          description: 'House-brewed India Pale Ale with citrus and pine hop notes. 5.8% ABV. Served chilled in a branded glass.',
          price: 9.50,
          prep_time: 2,
          availability: true,
          image_url: img(urls, 8),
          image_urls: [img(urls, 8), img(urls, 9), img(urls, 6)],
          customizations: [
            {
              key: 'size',
              label: 'Glass Size',
              multiple: false,
              values: [
                { name: 'Half Pint (300ml)', extraPrice: 0 },
                { name: 'Pint (600ml)', extraPrice: 3.50 },
              ],
            },
          ],
          subcategory: 'Cocktails & Beer',
        },
      ],
    },

    // ════════════════ DESSERTS ════════════════
    {
      category: 'Desserts',
      subcategories: ['Hot Desserts', 'Cold Desserts', 'Pastries'],
      items: [
        {
          dexel_id: 'MENU-DS001',
          display_name: 'Lava Chocolate Fondant',
          description: 'Warm dark chocolate fondant with a molten centre, served with Madagascar vanilla bean ice cream and fresh raspberries.',
          price: 11.99,
          prep_time: 18,
          availability: true,
          image_url: img(urls, 9),
          image_urls: [img(urls, 9), img(urls, 0), img(urls, 1)],
          customizations: [
            {
              key: 'ice_cream',
              label: 'Ice Cream Flavour',
              multiple: false,
              values: [
                { name: 'Vanilla Bean', extraPrice: 0 },
                { name: 'Salted Caramel', extraPrice: 0 },
                { name: 'Strawberry', extraPrice: 0 },
              ],
            },
            {
              key: 'extra',
              label: 'Extra Toppings',
              multiple: true,
              values: [
                { name: 'Whipped Cream', extraPrice: 0.75 },
                { name: 'Caramel Drizzle', extraPrice: 0.75 },
                { name: 'Crushed Nuts', extraPrice: 1.00 },
              ],
            },
          ],
          subcategory: 'Hot Desserts',
        },
        {
          dexel_id: 'MENU-DS002',
          display_name: 'Mango Panna Cotta',
          description: 'Silky Italian panna cotta with a fresh mango coulis, toasted coconut flakes and a sprig of fresh mint. Gluten-free.',
          price: 9.99,
          prep_time: 5,
          availability: true,
          image_url: img(urls, 0),
          image_urls: [img(urls, 0), img(urls, 8), img(urls, 9)],
          customizations: [
            {
              key: 'coulis',
              label: 'Fruit Coulis',
              multiple: false,
              values: [
                { name: 'Mango', extraPrice: 0 },
                { name: 'Strawberry', extraPrice: 0 },
                { name: 'Passionfruit', extraPrice: 0 },
              ],
            },
          ],
          subcategory: 'Cold Desserts',
        },
        {
          dexel_id: 'MENU-DS003',
          display_name: 'Flaky Almond Croissant',
          description: 'Freshly baked butter croissant filled with almond frangipane, topped with toasted flaked almonds and dusted icing sugar.',
          price: 6.50,
          prep_time: 8,
          availability: true,
          image_url: img(urls, 1),
          image_urls: [img(urls, 1), img(urls, 2), img(urls, 7)],
          customizations: [
            {
              key: 'warm',
              label: 'Serve Warm?',
              multiple: false,
              values: [
                { name: 'Warm', extraPrice: 0 },
                { name: 'Room Temperature', extraPrice: 0 },
              ],
            },
            {
              key: 'drink',
              label: 'Pair With',
              multiple: false,
              values: [
                { name: 'No Drink', extraPrice: 0 },
                { name: 'Espresso', extraPrice: 3.00 },
                { name: 'Orange Juice', extraPrice: 3.50 },
              ],
            },
          ],
          subcategory: 'Pastries',
        },
      ],
    },
  ]
}

// ─── MAIN ──────────────────────────────────────────────────────────────────
async function main() {
  console.log('🌱 Starting rich menu seed...\n')

  // ── Resolve tenant & branch ──
  const hotelTenant = await prisma.tenant.findFirst({
    where: { email: 'owner@grandhorizon.com' },
  })
  if (!hotelTenant) throw new Error('Tenant owner@grandhorizon.com not found. Run the main seed first.')

  // Target: Bole Branch (the primary/first branch of Grand Horizon)
  const defaultBranch = await prisma.branch.findFirst({
    where: { tenant_id: hotelTenant.id, deleted_at: null },
    orderBy: { created_at: 'asc' },
  })
  if (!defaultBranch) throw new Error('No branch found for this tenant. Create a branch first.')

  const demoRestaurant = await prisma.restaurant.findFirst({
    where: { tenant_id: hotelTenant.id, deleted_at: null },
  })
  if (!demoRestaurant) throw new Error('Restaurant not found. Run the main seed first.')

  console.log(`✅ Tenant:  ${hotelTenant.business_name}`)
  console.log(`✅ Branch:  ${defaultBranch.name}  (${defaultBranch.id})`)
  console.log(`✅ Restaurant: ${demoRestaurant.name}\n`)

  // ── Upload images ──
  console.log('📸 Uploading images to Cloudinary...')
  const imageUrls = await uploadImages()
  console.log(`   Uploaded ${imageUrls.length} images.\n`)

  const menuData = buildMenuData(imageUrls)

  // ── Seed each category group ──
  for (const group of menuData) {
    console.log(`\n📂 Category: ${group.category}`)

    // Upsert MasterCategory
    let masterCat = await prisma.masterCategory.findFirst({
      where: { tenant_id: hotelTenant.id, restaurant_id: demoRestaurant.id, name: group.category, deleted_at: null },
    })
    if (!masterCat) {
      masterCat = await prisma.masterCategory.create({
        data: { tenant_id: hotelTenant.id, restaurant_id: demoRestaurant.id, name: group.category },
      })
    }

    // Upsert branch Category
    let branchCat = await prisma.category.findFirst({
      where: { tenant_id: hotelTenant.id, branch_id: defaultBranch.id, name: group.category, deleted_at: null },
    })
    if (!branchCat) {
      branchCat = await prisma.category.create({
        data: { tenant_id: hotelTenant.id, branch_id: defaultBranch.id, master_category_id: masterCat.id, name: group.category },
      })
    }

    // Upsert subcategories
    const subcatIdMap: Record<string, string> = {}
    for (const subName of group.subcategories) {
      let masterSub = await prisma.masterCategory.findFirst({
        where: { tenant_id: hotelTenant.id, restaurant_id: demoRestaurant.id, name: subName, parent_id: masterCat.id, deleted_at: null },
      })
      if (!masterSub) {
        masterSub = await prisma.masterCategory.create({
          data: { tenant_id: hotelTenant.id, restaurant_id: demoRestaurant.id, name: subName, parent_id: masterCat.id },
        })
      }

      let branchSub = await prisma.category.findFirst({
        where: { tenant_id: hotelTenant.id, branch_id: defaultBranch.id, name: subName, parent_id: branchCat.id, deleted_at: null },
      })
      if (!branchSub) {
        branchSub = await prisma.category.create({
          data: { tenant_id: hotelTenant.id, branch_id: defaultBranch.id, name: subName, parent_id: branchCat.id, master_category_id: masterSub.id },
        })
      }

      subcatIdMap[subName] = branchSub.id
      console.log(`   └─ Subcategory: ${subName}`)
    }

    // Upsert menu items
    for (const item of group.items) {
      const subcatId = subcatIdMap[item.subcategory] ?? branchCat.id

      // MasterMenuItem
      let masterItem = await prisma.masterMenuItem.findFirst({
        where: { tenant_id: hotelTenant.id, dexel_product_id: item.dexel_id },
      })
      if (!masterItem) {
        const masterSubCat = await prisma.masterCategory.findFirst({
          where: { tenant_id: hotelTenant.id, name: item.subcategory, parent_id: masterCat.id, deleted_at: null },
        })
        masterItem = await prisma.masterMenuItem.create({
          data: {
            tenant_id: hotelTenant.id,
            restaurant_id: demoRestaurant.id,
            master_category_id: masterSubCat?.id ?? masterCat.id,
            dexel_product_id: item.dexel_id,
            display_name: item.display_name,
            description: item.description,
            price: item.price,
            prep_time: item.prep_time,
            availability: item.availability,
            image_url: item.image_url,
            image_urls: item.image_urls,
            customizations: item.customizations,
          },
        })
      }

      // Branch MenuItem
      const existingBranchItem = await prisma.menuItem.findFirst({
        where: { tenant_id: hotelTenant.id, branch_id: defaultBranch.id, dexel_product_id: item.dexel_id },
      })
      if (!existingBranchItem) {
        await prisma.menuItem.create({
          data: {
            tenant_id: hotelTenant.id,
            branch_id: defaultBranch.id,
            category_id: subcatId,
            master_menu_item_id: masterItem.id,
            dexel_product_id: item.dexel_id,
            display_name: item.display_name,
            description: item.description,
            price: item.price,
            prep_time: item.prep_time,
            availability: item.availability,
            image_url: item.image_url,
            image_urls: item.image_urls,
            customizations: item.customizations,
          },
        })
        console.log(`      🍽️  Created: ${item.display_name} ($${item.price})`)
      } else {
        console.log(`      ⏭️  Skipped (exists): ${item.display_name}`)
      }
    }
  }

  console.log('\n✅ Rich menu seed complete!')
  console.log(`   Branch: ${defaultBranch.name}  (${defaultBranch.id})`)
  console.log(`   ${menuData.length} categories, ${menuData.reduce((a, g) => a + g.subcategories.length, 0)} subcategories, ${menuData.reduce((a, g) => a + g.items.length, 0)} menu items`)
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
