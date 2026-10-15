import { scryptSync, randomBytes } from 'node:crypto'
import 'dotenv/config'
import { PrismaClient } from '../server/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
})

function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex')
  const hash = scryptSync(password, salt, 64).toString('hex')
  return `scrypt$${salt}$${hash}`
}

const CDN = 'https://cdn.dummyjson.com/product-images'

const categories = [
  { slug: 'mens-shirts', nameAr: 'الأزياء الرجالية', nameEn: 'Mens Shirts', icon: 'shirt', sortOrder: 1 },
  { slug: 'womens-dresses', nameAr: 'الأزياء النسائية', nameEn: 'Womens Dresses', icon: 'sparkles', sortOrder: 2 },
  { slug: 'electronics', nameAr: 'الإلكترونيات', nameEn: 'Electronics', icon: 'smartphone', sortOrder: 3 },
  { slug: 'laptops', nameAr: 'لابتوبات', nameEn: 'Laptops', icon: 'laptop', sortOrder: 4 },
  { slug: 'kitchen', nameAr: 'أدوات المطبخ', nameEn: 'Kitchen', icon: 'cooking-pot', sortOrder: 5 },
  { slug: 'beauty', nameAr: 'الصحة والجمال', nameEn: 'Beauty', icon: 'sparkles', sortOrder: 6 },
  { slug: 'fragrances', nameAr: 'العطور', nameEn: 'Fragrances', icon: 'spray-can', sortOrder: 7 },
  { slug: 'watches', nameAr: 'الساعات', nameEn: 'Watches', icon: 'watch', sortOrder: 8 },
  { slug: 'home-decoration', nameAr: 'المنزل والديكور', nameEn: 'Home Decoration', icon: 'lamp', sortOrder: 9 },
  { slug: 'sports', nameAr: 'الرياضة واللياقة', nameEn: 'Sports', icon: 'dumbbell', sortOrder: 10 },
  { slug: 'mens-shoes', nameAr: 'الأحذية الرجالية', nameEn: 'Mens Shoes', icon: 'footprints', sortOrder: 11 },
  { slug: 'sunglasses', nameAr: 'النظارات الشمسية', nameEn: 'Sunglasses', icon: 'glasses', sortOrder: 12 },
]

interface SeedVariant {
  sku: string
  size?: string
  color?: string
  colorHex?: string
  stock: number
}

interface SeedProduct {
  slug: string
  category: string
  titleAr: string
  titleEn: string
  descriptionAr: string
  priceCents: bigint
  compareAtCents?: bigint
  images: string[]
  variants: SeedVariant[]
}

const products: SeedProduct[] = [
  {
    slug: 'iphone-13-pro', category: 'electronics', titleAr: 'Apple iPhone 13 Pro — 256GB',
    titleEn: 'Apple iPhone 13 Pro 256GB',
    descriptionAr: 'هاتف ذكي بشاشة Super Retina XDR وكاميرا احترافية.',
    priceCents: 5290000n,
    images: [`${CDN}/smartphones/iphone-13-pro/1.webp`],
    variants: [
      { sku: 'IP13P-256-BLK', color: 'أسود', colorHex: '#1A1D23', stock: 12 },
      { sku: 'IP13P-256-GLD', color: 'ذهبي', colorHex: '#E8E4D9', stock: 8 },
      { sku: 'IP13P-256-BLU', color: 'أزرق', colorHex: '#3B4A5A', stock: 5 },
    ],
  },
  {
    slug: 'iphone-x', category: 'electronics', titleAr: 'Apple iPhone X — 64GB',
    titleEn: 'Apple iPhone X 64GB',
    descriptionAr: 'تصميم كلاسيكي بشاشة OLED.',
    priceCents: 1899900n,
    compareAtCents: 2299900n,
    images: [`${CDN}/smartphones/iphone-x/1.webp`],
    variants: [
      { sku: 'IPX-64-SLV', color: 'فضي', colorHex: '#C0C0C0', stock: 6 },
      { sku: 'IPX-64-GRY', color: 'رمادي', colorHex: '#6B7280', stock: 4 },
    ],
  },
  {
    slug: 'iphone-6', category: 'electronics', titleAr: 'Apple iPhone 6 — 16GB',
    titleEn: 'Apple iPhone 6',
    descriptionAr: 'هاتف خفيف وأنيق للاستخدام اليومي.',
    priceCents: 899900n,
    images: [`${CDN}/smartphones/iphone-6/1.webp`],
    variants: [{ sku: 'IP6-16-GLD', color: 'ذهبي', colorHex: '#D4AF37', stock: 3 }],
  },
  {
    slug: 'oppo-a57', category: 'electronics', titleAr: 'Oppo A57',
    titleEn: 'Oppo A57',
    descriptionAr: 'هاتف اقتصادي بشاشة كبيرة وبطارية تدوم.',
    priceCents: 649900n,
    images: [`${CDN}/smartphones/oppo-a57/1.webp`],
    variants: [{ sku: 'OPPO-A57-BLK', color: 'أسود', colorHex: '#111827', stock: 15 }],
  },
  {
    slug: 'apple-airpods', category: 'electronics', titleAr: 'Apple AirPods',
    titleEn: 'Apple AirPods',
    descriptionAr: 'سماعات لاسلكية بجودة صوت نظيفة.',
    priceCents: 429900n,
    images: [`${CDN}/mobile-accessories/apple-airpods/1.webp`],
    variants: [{ sku: 'AIRPODS-STD', stock: 20 }],
  },
  {
    slug: 'airpods-max-silver', category: 'electronics', titleAr: 'AirPods Max — فضي',
    titleEn: 'Apple AirPods Max Silver',
    descriptionAr: 'سماعة رأس لاسلكية فاخرة.',
    priceCents: 1299900n,
    images: [`${CDN}/mobile-accessories/apple-airpods-max-silver/1.webp`],
    variants: [{ sku: 'APM-SLV', color: 'فضي', colorHex: '#D1D5DB', stock: 4 }],
  },
  {
    slug: 'amazon-echo-plus', category: 'electronics', titleAr: 'Amazon Echo Plus',
    titleEn: 'Amazon Echo Plus',
    descriptionAr: 'مساعد ذكي بصوت عالي.',
    priceCents: 349900n,
    images: [`${CDN}/mobile-accessories/amazon-echo-plus/1.webp`],
    variants: [{ sku: 'ECHO-PLUS', color: 'أسود', colorHex: '#1F2937', stock: 9 }],
  },
  {
    slug: 'macbook-pro-14', category: 'laptops', titleAr: 'Apple MacBook Pro 14 بوصة — رمادي فضي',
    titleEn: 'Apple MacBook Pro 14 Inch Space Grey',
    descriptionAr: 'لابتوب احترافي بشاشة Liquid Retina XDR.',
    priceCents: 9499900n,
    compareAtCents: 10999900n,
    images: [`${CDN}/laptops/apple-macbook-pro-14-inch-space-grey/1.webp`],
    variants: [
      { sku: 'MBP14-512', size: '512GB', stock: 5 },
      { sku: 'MBP14-1TB', size: '1TB', stock: 3 },
    ],
  },
  {
    slug: 'asus-zenbook-pro-dual', category: 'laptops', titleAr: 'Asus Zenbook Pro Dual Screen',
    titleEn: 'Asus Zenbook Pro Dual Screen Laptop',
    descriptionAr: 'لابتوب بشاشتين للإنتاجية.',
    priceCents: 8450000n,
    images: [`${CDN}/laptops/asus-zenbook-pro-dual-screen-laptop/1.webp`],
    variants: [{ sku: 'ASUS-ZEN-DUAL', stock: 4 }],
  },
  {
    slug: 'huawei-matebook-x-pro', category: 'laptops', titleAr: 'Huawei Matebook X Pro',
    titleEn: 'Huawei Matebook X Pro',
    descriptionAr: 'لابتوب خفيف بشاشة عالية الدقة.',
    priceCents: 6799900n,
    images: [`${CDN}/laptops/huawei-matebook-x-pro/1.webp`],
    variants: [{ sku: 'HW-MBXPRO', stock: 6 }],
  },
  {
    slug: 'lenovo-yoga-920', category: 'laptops', titleAr: 'Lenovo Yoga 920',
    titleEn: 'Lenovo Yoga 920',
    descriptionAr: 'لابتوب 2-in-1 مرن للاستخدام اليومي.',
    priceCents: 5899900n,
    images: [`${CDN}/laptops/lenovo-yoga-920/1.webp`],
    variants: [{ sku: 'LEN-YOGA-920', stock: 2 }],
  },
  {
    slug: 'dell-xps-13-9300', category: 'laptops', titleAr: 'New Dell XPS 13 9300',
    titleEn: 'New DELL XPS 13 9300 Laptop',
    descriptionAr: 'لابتوب مدمج للأعمال والدراسة.',
    priceCents: 7299900n,
    images: [`${CDN}/laptops/new-dell-xps-13-9300-laptop/1.webp`],
    variants: [{ sku: 'DELL-XPS-13', stock: 7 }],
  },
  {
    slug: 'man-plaid-shirt', category: 'mens-shirts', titleAr: 'قميص بلوشن قطن بقصة أنيقة',
    titleEn: 'Man Plaid Shirt',
    descriptionAr: 'قميص قطن مريح للاستخدام اليومي.',
    priceCents: 40500n,
    compareAtCents: 54000n,
    images: [`${CDN}/mens-shirts/man-plaid-shirt/1.webp`],
    variants: [
      { sku: 'PLAID-M-RED', size: 'M', color: 'أحمر', colorHex: '#B91C1C', stock: 14 },
      { sku: 'PLAID-L-RED', size: 'L', color: 'أحمر', colorHex: '#B91C1C', stock: 10 },
      { sku: 'PLAID-M-BLU', size: 'M', color: 'أزرق', colorHex: '#1E3A8A', stock: 8 },
    ],
  },
  {
    slug: 'men-check-shirt', category: 'mens-shirts', titleAr: 'قميص بقلم رصاص',
    titleEn: 'Men Check Shirt',
    descriptionAr: 'قميص كاجوال بنقشة كلاسيكية.',
    priceCents: 35000n,
    images: [`${CDN}/mens-shirts/men-check-shirt/1.webp`],
    variants: [
      { sku: 'CHK-M', size: 'M', stock: 12 },
      { sku: 'CHK-L', size: 'L', stock: 9 },
    ],
  },
  {
    slug: 'man-short-sleeve-shirt', category: 'mens-shirts', titleAr: 'قميص بأكمام قصيرة',
    titleEn: 'Man Short Sleeve Shirt',
    descriptionAr: 'قميص صيفي خفيف.',
    priceCents: 28500n,
    images: [`${CDN}/mens-shirts/man-short-sleeve-shirt/1.webp`],
    variants: [{ sku: 'SS-M-WHT', size: 'M', color: 'أبيض', colorHex: '#F9FAFB', stock: 11 }],
  },
  {
    slug: 'blue-black-check-shirt', category: 'mens-shirts', titleAr: 'قميص تشيء أزرق وأسود',
    titleEn: 'Blue & Black Check Shirt',
    descriptionAr: 'قميص بattern جريء.',
    priceCents: 42000n,
    images: [`${CDN}/mens-shirts/blue-&-black-check-shirt/1.webp`],
    variants: [{ sku: 'BBCHK-L', size: 'L', stock: 7 }],
  },
  {
    slug: 'gigabyte-aorus-tshirt', category: 'mens-shirts', titleAr: 'تيشيرت Gigabyte Aorus',
    titleEn: 'Gigabyte Aorus Men Tshirt',
    descriptionAr: 'تيشيرت قطن بطباعة ألعاب.',
    priceCents: 22000n,
    images: [`${CDN}/mens-shirts/gigabyte-aorus-men-tshirt/1.webp`],
    variants: [
      { sku: 'AORUS-M', size: 'M', stock: 16 },
      { sku: 'AORUS-L', size: 'L', stock: 12 },
    ],
  },
  {
    slug: 'tartan-dress', category: 'womens-dresses', titleAr: 'فستان تارتان',
    titleEn: 'Tartan Dress',
    descriptionAr: 'فستان أنيق بنقشة تارتان.',
    priceCents: 55000n,
    compareAtCents: 72000n,
    images: [`${CDN}/tops/tartan-dress/1.webp`],
    variants: [
      { sku: 'TART-S', size: 'S', stock: 6 },
      { sku: 'TART-M', size: 'M', stock: 8 },
    ],
  },
  {
    slug: 'gray-dress', category: 'womens-dresses', titleAr: 'فستان رمادي',
    titleEn: 'Gray Dress',
    descriptionAr: 'فستان بسيط لأي مناسبة.',
    priceCents: 48000n,
    images: [`${CDN}/tops/gray-dress/1.webp`],
    variants: [{ sku: 'GRD-M', size: 'M', stock: 9 }],
  },
  {
    slug: 'blue-frock', category: 'womens-dresses', titleAr: 'فستان أزرق',
    titleEn: 'Blue Frock',
    descriptionAr: 'فستان كاجوال أزرق.',
    priceCents: 43000n,
    images: [`${CDN}/tops/blue-frock/1.webp`],
    variants: [{ sku: 'BLF-M', size: 'M', stock: 5 }],
  },
  {
    slug: 'black-womens-gown', category: 'womens-dresses', titleAr: 'فستان سهرة أسود',
    titleEn: "Black Women's Gown",
    descriptionAr: 'فستان سهرة أنيق.',
    priceCents: 95000n,
    images: [`${CDN}/womens-dresses/black-women's-gown/1.webp`],
    variants: [{ sku: 'GOWN-M', size: 'M', stock: 3 }],
  },
  {
    slug: 'dress-pea', category: 'womens-dresses', titleAr: 'فستان Pea',
    titleEn: 'Dress Pea',
    descriptionAr: 'تصميم عصري مريح.',
    priceCents: 62000n,
    images: [`${CDN}/womens-dresses/dress-pea/1.webp`],
    variants: [{ sku: 'PEA-M', size: 'M', stock: 4 }],
  },
  {
    slug: 'chef-knife', category: 'kitchen', titleAr: 'سكين مطبخ شيف — فولاذ مقاوم للصدأ',
    titleEn: 'Chef Knife',
    descriptionAr: 'سكين شيف احترافي.',
    priceCents: 43200n,
    images: [`${CDN}/kitchen-accessories/knife/1.webp`],
    variants: [{ sku: 'KNIFE-01', stock: 22 }],
  },
  {
    slug: 'chopping-board', category: 'kitchen', titleAr: 'لوح تقطيع خشبي',
    titleEn: 'Chopping Board',
    descriptionAr: 'لوح تقطيع عملي للمطبخ.',
    priceCents: 18500n,
    images: [`${CDN}/kitchen-accessories/chopping-board/1.webp`],
    variants: [{ sku: 'BOARD-01', stock: 30 }],
  },
  {
    slug: 'boxed-blender', category: 'kitchen', titleAr: 'خلاط مكعب',
    titleEn: 'Boxed Blender',
    descriptionAr: 'خلاط قوي للعصائر والسلطات.',
    priceCents: 89900n,
    images: [`${CDN}/kitchen-accessories/boxed-blender/1.webp`],
    variants: [{ sku: 'BLEND-01', stock: 10 }],
  },
  {
    slug: 'microwave-oven', category: 'kitchen', titleAr: 'ميكروويف',
    titleEn: 'Microwave Oven',
    descriptionAr: 'جهاز ميكروويف بسعة مناسبة للعائلة.',
    priceCents: 459900n,
    images: [`${CDN}/kitchen-accessories/microwave-oven/1.webp`],
    variants: [{ sku: 'MW-01', stock: 6 }],
  },
  {
    slug: 'carbon-steel-wok', category: 'kitchen', titleAr: 'قِدر ووك فولاذ كربوني',
    titleEn: 'Carbon Steel Wok',
    descriptionAr: 'ووك للطبخ السريع.',
    priceCents: 32000n,
    images: [`${CDN}/kitchen-accessories/carbon-steel-wok/1.webp`],
    variants: [{ sku: 'WOK-01', stock: 14 }],
  },
  {
    slug: 'red-lipstick', category: 'beauty', titleAr: 'أحمر شفاه أحمر',
    titleEn: 'Red Lipstick',
    descriptionAr: 'أحمر شفاه بلون ثابت.',
    priceCents: 12500n,
    images: [`${CDN}/beauty/red-lipstick/1.webp`],
    variants: [{ sku: 'LIP-RED', color: 'أحمر', colorHex: '#DC2626', stock: 25 }],
  },
  {
    slug: 'eyeshadow-palette', category: 'beauty', titleAr: 'باليت ظلال بمرآة — 18 درجة',
    titleEn: 'Eyeshadow Palette with Mirror',
    descriptionAr: 'باليت ألوان متكامل مع مرآة.',
    priceCents: 95000n,
    images: [`${CDN}/beauty/eyeshadow-palette-with-mirror/1.webp`],
    variants: [{ sku: 'EYE-18', stock: 18 }],
  },
  {
    slug: 'red-nail-polish', category: 'beauty', titleAr: 'طلاء أظافر أحمر',
    titleEn: 'Red Nail Polish',
    descriptionAr: 'طلاء أظافر عالي الجودة.',
    priceCents: 8500n,
    images: [`${CDN}/beauty/red-nail-polish/1.webp`],
    variants: [{ sku: 'NAIL-RED', color: 'أحمر', colorHex: '#B91C1C', stock: 40 }],
  },
  {
    slug: 'essence-mascara', category: 'beauty', titleAr: 'ماسكارا Essence Princess',
    titleEn: 'Essence Mascara Lash Princess',
    descriptionAr: 'ماسكارا لرموش أكثر كثافة.',
    priceCents: 15000n,
    compareAtCents: 21000n,
    images: [`${CDN}/beauty/essence-mascara-lash-princess/1.webp`],
    variants: [{ sku: 'MASC-01', stock: 28 }],
  },
  {
    slug: 'ck-one', category: 'fragrances', titleAr: 'Calvin Klein CK One — 100ml',
    titleEn: 'Calvin Klein CK One',
    descriptionAr: 'عطر منعش للجنسين.',
    priceCents: 320000n,
    compareAtCents: 420000n,
    images: [`${CDN}/fragrances/calvin-klein-ck-one/1.webp`],
    variants: [{ sku: 'CKONE-100', stock: 15 }],
  },
  {
    slug: 'chanel-coco-noir', category: 'fragrances', titleAr: 'Chanel Coco Noir Eau De — 100ml',
    titleEn: 'Chanel Coco Noir Eau De',
    descriptionAr: 'عطر فاخر برائحة دافئة.',
    priceCents: 615000n,
    images: [`${CDN}/fragrances/chanel-coco-noir-eau-de/1.webp`],
    variants: [{ sku: 'CHNOIR-100', stock: 8 }],
  },
  {
    slug: 'dior-jadore', category: 'fragrances', titleAr: "Dior J'adore",
    titleEn: "Dior J'adore",
    descriptionAr: 'عطر نسائي كلاسيكي.',
    priceCents: 720000n,
    images: [`${CDN}/fragrances/dior-j'adore/1.webp`],
    variants: [{ sku: 'DIOR-JAD', stock: 5 }],
  },
  {
    slug: 'gucci-bloom', category: 'fragrances', titleAr: 'Gucci Bloom Eau de',
    titleEn: 'Gucci Bloom Eau de',
    descriptionAr: 'عطر زهري ناعم.',
    priceCents: 680000n,
    images: [`${CDN}/fragrances/gucci-bloom-eau-de/1.webp`],
    variants: [{ sku: 'GUC-BLOOM', stock: 6 }],
  },
  {
    slug: 'rolex-datejust', category: 'watches', titleAr: 'Rolex Datejust — ساعة فاخرة',
    titleEn: 'Rolex Datejust',
    descriptionAr: 'ساعة فاخرة بحزام جلد.',
    priceCents: 12500000n,
    images: [`${CDN}/mens-watches/rolex-datejust/1.webp`],
    variants: [
      { sku: 'RLEX-DJ-BLK', color: 'أسود', colorHex: '#1A1A1A', stock: 2 },
      { sku: 'RLEX-DJ-GLD', color: 'ذهبي', colorHex: '#C9A96E', stock: 1 },
    ],
  },
  {
    slug: 'longines-master', category: 'watches', titleAr: 'Longines Master Collection',
    titleEn: 'Longines Master Collection',
    descriptionAr: 'ساعة كلاسيكية بحركةسويسرية.',
    priceCents: 4500000n,
    images: [`${CDN}/mens-watches/longines-master-collection/1.webp`],
    variants: [{ sku: 'LNG-MST', stock: 3 }],
  },
  {
    slug: 'brown-leather-belt-watch', category: 'watches', titleAr: 'ساعة بحزام جلد بني',
    titleEn: 'Brown Leather Belt Watch',
    descriptionAr: 'ساعة يومية بحزام جلد.',
    priceCents: 890000n,
    images: [`${CDN}/mens-watches/brown-leather-belt-watch/1.webp`],
    variants: [{ sku: 'BLW-01', stock: 11 }],
  },
  {
    slug: 'rolex-submariner', category: 'watches', titleAr: 'Rolex Submariner',
    titleEn: 'Rolex Submariner Watch',
    descriptionAr: 'ساعة غوص أيقونية.',
    priceCents: 15900000n,
    images: [`${CDN}/mens-watches/rolex-submariner-watch/1.webp`],
    variants: [{ sku: 'RLEX-SUB', stock: 1 }],
  },
  {
    slug: 'plant-pot', category: 'home-decoration', titleAr: 'أصيص نبات ديكوري',
    titleEn: 'Plant Pot',
    descriptionAr: 'أصيص أنيق لكل منزل.',
    priceCents: 7200n,
    images: [`${CDN}/home-decoration/plant-pot/1.webp`],
    variants: [{ sku: 'POT-01', stock: 35 }],
  },
  {
    slug: 'table-lamp', category: 'home-decoration', titleAr: 'مصباح طاولة',
    titleEn: 'Table Lamp',
    descriptionAr: 'إضاءة دافئة لغرفة المعيشة.',
    priceCents: 24900n,
    images: [`${CDN}/home-decoration/table-lamp/1.webp`],
    variants: [{ sku: 'LAMP-01', stock: 17 }],
  },
  {
    slug: 'family-tree-frame', category: 'home-decoration', titleAr: 'إطار شجرة العائلة',
    titleEn: 'Family Tree Photo Frame',
    descriptionAr: 'إطار صور عائلي.',
    priceCents: 15900n,
    images: [`${CDN}/home-decoration/family-tree-photo-frame/1.webp`],
    variants: [{ sku: 'FRAME-FT', stock: 12 }],
  },
  {
    slug: 'house-showpiece-plant', category: 'home-decoration', titleAr: 'نبتة ديكور منزلية',
    titleEn: 'House Showpiece Plant',
    descriptionAr: 'قطعة ديكور خضراء.',
    priceCents: 19900n,
    images: [`${CDN}/home-decoration/house-showpiece-plant/1.webp`],
    variants: [{ sku: 'PLANT-DEC', stock: 20 }],
  },
  {
    slug: 'basketball', category: 'sports', titleAr: 'كرة سلة',
    titleEn: 'Basketball',
    descriptionAr: 'كرة سلة تدريبية.',
    priceCents: 25000n,
    images: [`${CDN}/sports-accessories/basketball/1.webp`],
    variants: [{ sku: 'BASK-01', stock: 24 }],
  },
  {
    slug: 'baseball-ball', category: 'sports', titleAr: 'كرة بيسبول',
    titleEn: 'Baseball Ball',
    descriptionAr: 'كرة بيسبول تدريبية.',
    priceCents: 12000n,
    images: [`${CDN}/sports-accessories/baseball-ball/1.webp`],
    variants: [{ sku: 'BASE-01', stock: 30 }],
  },
  {
    slug: 'nike-air-jordan-1', category: 'mens-shoes', titleAr: 'Nike Air Jordan 1 — أحمر وأسود',
    titleEn: 'Nike Air Jordan 1 Red And Black',
    descriptionAr: 'حذاء رياضي أيقوني.',
    priceCents: 750000n,
    images: [`${CDN}/mens-shoes/nike-air-jordan-1-red-and-black/1.webp`],
    variants: [
      { sku: 'AJ1-42', size: '42', stock: 4 },
      { sku: 'AJ1-43', size: '43', stock: 6 },
      { sku: 'AJ1-44', size: '44', stock: 3 },
    ],
  },
  {
    slug: 'puma-future-rider', category: 'mens-shoes', titleAr: 'Puma Future Rider Trainers',
    titleEn: 'Puma Future Rider Trainers',
    descriptionAr: 'حذاء رياضي مريح.',
    priceCents: 320000n,
    images: [`${CDN}/mens-shoes/puma-future-rider-trainers/1.webp`],
    variants: [{ sku: 'PUMA-42', size: '42', stock: 8 }],
  },
  {
    slug: 'black-sun-glasses', category: 'sunglasses', titleAr: 'نظارة شمسية سوداء',
    titleEn: 'Black Sun Glasses',
    descriptionAr: 'نظارة شمسية بكلاسيكية.',
    priceCents: 18000n,
    compareAtCents: 25000n,
    images: [`${CDN}/sunglasses/black-sun-glasses/1.webp`],
    variants: [{ sku: 'SUN-BLK', color: 'أسود', colorHex: '#111827', stock: 26 }],
  },
  {
    slug: 'classic-sun-glasses', category: 'sunglasses', titleAr: 'نظارة شمسية كلاسيكية',
    titleEn: 'Classic Sun Glasses',
    descriptionAr: 'تصميم كلاسيكي يناسب كل الإطلالات.',
    priceCents: 22000n,
    images: [`${CDN}/sunglasses/classic-sun-glasses/1.webp`],
    variants: [{ sku: 'SUN-CLS', stock: 19 }],
  },
  {
    slug: 'green-black-glasses', category: 'sunglasses', titleAr: 'نظارة خضراء وسوداء',
    titleEn: 'Green and Black Glasses',
    descriptionAr: 'إطار أخضر جريء.',
    priceCents: 16500n,
    images: [`${CDN}/sunglasses/green-and-black-glasses/1.webp`],
    variants: [{ sku: 'SUN-GRN', color: 'أخضر', colorHex: '#166534', stock: 13 }],
  },
]

function normalizeAr(input: string) {
  return input
    .replace(/[ً-ْٰ]/g, '')
    .replace(/ـ/g, '')
    .replace(/[آأإٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/[٠-٩]/g, d => String(d.charCodeAt(0) - 0x0660))
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}

async function main() {
  console.log('Seeding Nimbus Mart…')

  await prisma.orderItem.deleteMany()
  await prisma.order.deleteMany()
  await prisma.cartItem.deleteMany()
  await prisma.wishlist.deleteMany()
  await prisma.auditLog.deleteMany()
  await prisma.session.deleteMany()
  await prisma.variant.deleteMany()
  await prisma.productImage.deleteMany()
  await prisma.product.deleteMany()
  await prisma.category.deleteMany()
  await prisma.heroSlide.deleteMany()
  await prisma.siteSetting.deleteMany()
  await prisma.currencyRate.deleteMany()
  await prisma.user.deleteMany()

  const admin = await prisma.user.create({
    data: {
      email: 'admin@nimbus.app',
      passwordHash: hashPassword('admin1234'),
      name: 'مدير نِمبوس',
      role: 'ADMIN',
    },
  })
  await prisma.user.create({
    data: {
      email: 'demo@nimbus.app',
      passwordHash: hashPassword('demo1234'),
      name: 'أحمد مصطفى',
      phone: '01000000000',
      role: 'CUSTOMER',
    },
  })
  await prisma.user.create({
    data: {
      email: 'sara@nimbus.app',
      passwordHash: hashPassword('demo1234'),
      name: 'سارة أحمد',
      phone: '01111111111',
      role: 'CUSTOMER',
    },
  })

  const catMap: Record<string, string> = {}
  for (const c of categories) {
    const row = await prisma.category.create({ data: c })
    catMap[c.slug] = row.id
  }

  for (const p of products) {
    await prisma.product.create({
      data: {
        slug: p.slug,
        categoryId: catMap[p.category],
        titleAr: p.titleAr,
        titleEn: p.titleEn,
        descriptionAr: p.descriptionAr,
        priceCents: p.priceCents,
        compareAtCents: p.compareAtCents ?? null,
        status: 'ACTIVE',
        searchNormalized: normalizeAr(`${p.titleAr} ${p.titleEn ?? ''}`),
        images: {
          create: p.images.map((url, i) => ({ url, sort: i })),
        },
        variants: {
          create: p.variants.map(v => ({
            sku: v.sku,
            size: v.size ?? null,
            color: v.color ?? null,
            colorHex: v.colorHex ?? null,
            stock: v.stock,
            imageUrl: p.images[0] ?? null,
          })),
        },
      },
    })
  }

  await prisma.heroSlide.createMany({
    data: [
      {
        titleAr: 'حضور مميز في كل خطوة',
        titleEn: 'A signature presence in every step',
        subtitleAr: 'اكتشف تشكيلة الأزياء الرجالية الجديدة. قمصان، أحذية، وإكسسوارات تكمل إطلالتك في كل مناسبة.',
        subtitleEn: 'Discover the new menswear collection. Shirts, shoes, and accessories to complete every look.',
        ctaLabelAr: 'تسوق الكوليكشن',
        ctaLabelEn: 'Shop the collection',
        ctaHref: '/categories/mens-shirts',
        imageUrl: `${CDN}/mens-shirts/man-plaid-shirt/1.webp`,
        bgStyle: 'BLUE',
        sortOrder: 1,
        enabled: true,
      },
      {
        titleAr: 'إلكترونيات وأجهزة',
        titleEn: 'Electronics & devices',
        subtitleAr: 'أحدث الأجهزة والتقنيات — من لابتوبات إلى هواتف، بأفضل الأسعار.',
        subtitleEn: 'The latest gadgets and tech — from laptops to phones, at the best prices.',
        ctaLabelAr: 'تسوق الإلكترونيات',
        ctaLabelEn: 'Shop electronics',
        ctaHref: '/categories/electronics',
        imageUrl: `${CDN}/laptops/apple-macbook-pro-14-inch-space-grey/1.webp`,
        bgStyle: 'INK',
        sortOrder: 2,
        enabled: true,
      },
      {
        titleAr: 'الجمال والعناية',
        titleEn: 'Beauty & care',
        subtitleAr: 'عطور ومستحضرات تجميل من أفضل الماركات العالمية.',
        subtitleEn: 'Perfumes and cosmetics from the world’s best brands.',
        ctaLabelAr: 'تسوق الجمال',
        ctaLabelEn: 'Shop beauty',
        ctaHref: '/categories/beauty',
        imageUrl: `${CDN}/fragrances/calvin-klein-ck-one/1.webp`,
        bgStyle: 'AMBER',
        sortOrder: 3,
        enabled: true,
      },
    ],
  })

  await prisma.siteSetting.create({
    data: {
      key: 'default',
      promoHeadingAr: 'جديد مطبخك بأفضل العروض',
      promoHeadingEn: 'Upgrade your kitchen with the best deals',
      promoBodyAr: 'أحدث أدوات المطبخ والأجهزة الكهربائية بأسعار لا تُنافس.',
      promoBodyEn: 'The latest kitchen tools and appliances at unbeatable prices.',
      promoCtaLabelAr: 'تسوق الآن',
      promoCtaLabelEn: 'Shop now',
      promoCtaHref: '/categories/kitchen',
      promoGradient: 'navy',
      promoImageUrl: `${CDN}/kitchen-accessories/microwave-oven/1.webp`,
      promoSecondHeadingAr: 'صيف أحلى… مع كل اللي تحبه',
      promoSecondHeadingEn: 'A sweeter summer… with everything you love',
      promoSecondBodyAr: 'اكتشف أحدث أدوات الصيف والموضة لموسم الحرارة.',
      promoSecondBodyEn: 'Discover the latest summer essentials and fashion for the season.',
      promoSecondCtaLabelAr: 'تسوق الآن',
      promoSecondCtaLabelEn: 'Shop now',
      promoSecondCtaHref: '/categories/sunglasses',
      promoSecondGradient: 'amber',
      promoSecondImageUrl: `${CDN}/sunglasses/black-sun-glasses/1.webp`,
      footerBlurbAr:
        'وجهتكم الأولى لكل ما هو جديد ومتميز. تشكيلة واسعة من الملابس، تجهيزات المطبخ، والأدوات اليومية — توصيل سريع لكل محافظات مصر.',
      footerBlurbEn:
        'Your first stop for everything new and exceptional. A wide range of fashion, kitchen gear, and everyday essentials — fast delivery across all of Egypt.',
    },
  })

  await prisma.currencyRate.createMany({
    data: [
      { code: 'EGP', rate: 1, symbol: 'ج.م', position: 'AFTER', decimals: 2, roundingStepCents: null, enabled: true, isBase: true },
      { code: 'USD', rate: 0.0206, symbol: '$', position: 'BEFORE', decimals: 2, roundingStepCents: null, enabled: true, isBase: false },
      { code: 'EUR', rate: 0.0189, symbol: '€', position: 'BEFORE', decimals: 2, roundingStepCents: null, enabled: true, isBase: false },
      { code: 'SAR', rate: 0.0773, symbol: 'ر.س', position: 'AFTER', decimals: 2, roundingStepCents: null, enabled: true, isBase: false },
      { code: 'AED', rate: 0.0757, symbol: 'د.إ', position: 'AFTER', decimals: 2, roundingStepCents: null, enabled: true, isBase: false },
    ],
  })

  await prisma.auditLog.create({
    data: {
      actorUserId: admin.id,
      action: 'SEED',
      entity: 'system',
      entityId: null,
      after: { note: 'initial seed' },
    },
  })

  const counts = {
    users: await prisma.user.count(),
    categories: await prisma.category.count(),
    products: await prisma.product.count(),
    variants: await prisma.variant.count(),
    images: await prisma.productImage.count(),
    heroSlides: await prisma.heroSlide.count(),
    currencies: await prisma.currencyRate.count(),
  }
  console.log('Seed done:', counts)
}

main()
  .catch((e: unknown) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
