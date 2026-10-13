import 'dotenv/config'
import { PrismaClient } from '../server/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
})

const heroEn: Record<number, { titleEn: string, subtitleEn: string, ctaLabelEn: string }> = {
  1: {
    titleEn: 'A signature presence in every step',
    subtitleEn: 'Discover the new menswear collection. Shirts, shoes, and accessories to complete every look.',
    ctaLabelEn: 'Shop the collection',
  },
  2: {
    titleEn: 'Electronics & devices',
    subtitleEn: 'The latest gadgets and tech — from laptops to phones, at the best prices.',
    ctaLabelEn: 'Shop electronics',
  },
  3: {
    titleEn: 'Beauty & care',
    subtitleEn: 'Perfumes and cosmetics from the world’s best brands.',
    ctaLabelEn: 'Shop beauty',
  },
}

async function main() {
  const slides = await prisma.heroSlide.findMany({ orderBy: { sortOrder: 'asc' } })
  for (const slide of slides) {
    const en = heroEn[slide.sortOrder]
    if (!en) continue
    await prisma.heroSlide.update({
      where: { id: slide.id },
      data: en,
    })
  }

  await prisma.siteSetting.update({
    where: { key: 'default' },
    data: {
      promoHeadingEn: 'Upgrade your kitchen with the best deals',
      promoBodyEn: 'The latest kitchen tools and appliances at unbeatable prices.',
      promoCtaLabelEn: 'Shop now',
      promoSecondHeadingEn: 'A sweeter summer… with everything you love',
      promoSecondBodyEn: 'Discover the latest summer essentials and fashion for the season.',
      promoSecondCtaLabelEn: 'Shop now',
      footerBlurbEn:
        'Your first stop for everything new and exceptional. A wide range of fashion, kitchen gear, and everyday essentials — fast delivery across all of Egypt.',
    },
  })

  console.log('i18n En content applied to', slides.length, 'hero slides + site settings')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
