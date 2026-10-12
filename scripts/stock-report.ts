import 'dotenv/config'
import { PrismaClient } from '../server/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
})

async function main() {
  const products = await prisma.product.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    select: {
      slug: true,
      titleAr: true,
      variants: { select: { sku: true, stock: true } },
    },
  })
  for (const p of products) {
    console.log(p.slug, '|', p.titleAr, '|', p.variants.map(v => `${v.sku}=${v.stock}`).join(', '))
  }
  const low = await prisma.variant.findMany({
    where: { stock: { lt: 3 } },
    select: { sku: true, stock: true },
  })
  console.log('variants with stock < 3:', JSON.stringify(low))
}

main().finally(() => prisma.$disconnect())
