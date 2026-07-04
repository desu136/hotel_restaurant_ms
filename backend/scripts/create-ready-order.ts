import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const tenant = await prisma.tenant.findFirst({
    where: { email: 'owner@grandhorizon.com' }
  })
  if (!tenant) { console.error("Tenant not found"); return }

  const branch = await prisma.branch.findFirst({
    where: { tenant_id: tenant.id }
  })
  if (!branch) { console.error("Branch not found"); return }

  const waiter = await prisma.user.findFirst({
    where: { email: 'waiter@grandhorizon.com' }
  })
  if (!waiter) { console.error("Waiter not found"); return }

  let table = await prisma.restaurantTable.findFirst({
    where: { tenant_id: tenant.id, table_number: '101' }
  })
  if (!table) { console.error("Table 101 not found"); return }

  table = await prisma.restaurantTable.update({
    where: { id: table.id },
    data: { waiter_id: waiter.id }
  })

  let customer = await prisma.customer.findFirst()
  if (!customer) {
    customer = await prisma.customer.create({
      data: { full_name: 'Test Customer', phone: '1111111111' }
    })
  }

  const menuItem = await prisma.menuItem.findFirst({
    where: { tenant_id: tenant.id }
  })
  if (!menuItem) { console.error("MenuItem not found"); return }

  const order = await prisma.order.create({
    data: {
      tenant_id: tenant.id,
      branch_id: branch.id,
      customer_id: customer.id,
      table_id: table.id,
      waiter_id: waiter.id,
      order_type: 'DINE_IN',
      status: 'READY',
      total_amount: 15.50,
      items: {
        create: {
          menu_item_id: menuItem.id,
          quantity: 1,
          unit_price: 15.50
        }
      }
    }
  })

  console.log(`SUCCESS: Created READY order for table 101: ${order.id}`)
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect())
