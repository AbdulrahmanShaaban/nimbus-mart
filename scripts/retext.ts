import 'dotenv/config'
import { PrismaClient } from '../server/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
})

const NEW_BLURB =
  'وجهتكم الأولى لكل ما هو جديد ومتميز. تشكيلة واسعة من الملابس، تجهيزات المطبخ، والأدوات اليومية — توصيل سريع لكل محافظات مصر.'

function cleanDescription(desc: string): string {
  let d = desc
  d = d.replace('. صورة تجريبية من DummyJSON.', '.')
  d = d.replace('صورة تجريبية من DummyJSON.', '')
  d = d.replace('. صورة تجريبية.', '.')
  d = d.replace('نموذج كلاسيكي للعرض التجريبي.', 'هاتف خفيف وأنيق للاستخدام اليومي.')
  d = d.replace('هاتف ekonomik', 'هاتف اقتصادي')
  d = d.replace(/\s+/g, ' ').trim()
  if (d.replace(/[.\s]/g, '').length < 8) {
    d = 'منتج مختار بعناية من نِمبوس مارت — جودة أصلية وسعر منافس.'
  }
  return d
}

async function main() {
  const setting = await prisma.siteSetting.findUnique({ where: { key: 'default' } })
  if (setting && setting.footerBlurbAr !== NEW_BLURB) {
    await prisma.siteSetting.update({
      where: { key: 'default' },
      data: { footerBlurbAr: NEW_BLURB },
    })
    console.log('updated footer blurb')
  }

  const products = await prisma.product.findMany({
    select: { id: true, slug: true, descriptionAr: true },
  })
  let updated = 0
  for (const p of products) {
    const next = cleanDescription(p.descriptionAr)
    if (next !== p.descriptionAr) {
      await prisma.product.update({ where: { id: p.id }, data: { descriptionAr: next } })
      updated += 1
    }
  }
  console.log(`updated ${updated} product descriptions`)

  const user = await prisma.user.findUnique({ where: { email: 'demo@nimbus.app' } })
  if (user && user.name !== 'أحمد مصطفى') {
    await prisma.user.update({ where: { id: user.id }, data: { name: 'أحمد مصطفى' } })
    console.log('renamed demo user')
  }
}

main().finally(() => prisma.$disconnect())
