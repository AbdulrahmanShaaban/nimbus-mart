import 'dotenv/config'
import { PrismaClient } from '../server/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
})

async function main() {
  const restored = await prisma.variant.updateMany({
    where: { stock: { lt: 3 } },
    data: { stock: 5 },
  })
  const zero = await prisma.variant.count({ where: { stock: 0 } })
  console.log(`restocked ${restored.count} variants (stock < 3 -> 5); remaining zero-stock: ${zero}`)
}

main().finally(() => prisma.$disconnect())
