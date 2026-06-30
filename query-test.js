const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const latestOrder = await prisma.order.findFirst({
    orderBy: { createdAt: 'desc' },
    include: { items: true, bill: true, table: true }
  })
  console.log(JSON.stringify(latestOrder, null, 2))
}
main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
