import 'dotenv/config'
import { PrismaClient } from '../server/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
})

async function main() {
  const productImages = await prisma.$executeRaw`
    UPDATE product_images
    SET url = replace(url, '/thumbnail.webp', '/1.webp')
    WHERE url LIKE '%/thumbnail.webp'
  `
  const variants = await prisma.$executeRaw`
    UPDATE variants
    SET image_url = replace(image_url, '/thumbnail.webp', '/1.webp')
    WHERE image_url LIKE '%/thumbnail.webp'
  `
  const heroSlides = await prisma.$executeRaw`
    UPDATE hero_slides
    SET image_url = replace(image_url, '/thumbnail.webp', '/1.webp')
    WHERE image_url LIKE '%/thumbnail.webp'
  `
  const promos = await prisma.$executeRaw`
    UPDATE site_settings
    SET promo_image_url = replace(promo_image_url, '/thumbnail.webp', '/1.webp')
    WHERE promo_image_url LIKE '%/thumbnail.webp'
  `
  const promosSecond = await prisma.$executeRaw`
    UPDATE site_settings
    SET promo_second_image_url = replace(promo_second_image_url, '/thumbnail.webp', '/1.webp')
    WHERE promo_second_image_url LIKE '%/thumbnail.webp'
  `

  console.log(`product_images: ${productImages}`)
  console.log(`variants: ${variants}`)
  console.log(`hero_slides: ${heroSlides}`)
  console.log(`site_settings promo: ${promos}`)
  console.log(`site_settings promo_second: ${promosSecond}`)
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
