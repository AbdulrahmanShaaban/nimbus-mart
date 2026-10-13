-- Add English content columns to hero_slides
ALTER TABLE "hero_slides" ADD COLUMN "title_en" TEXT;
ALTER TABLE "hero_slides" ADD COLUMN "subtitle_en" TEXT;
ALTER TABLE "hero_slides" ADD COLUMN "cta_label_en" TEXT;

-- Add English content columns to site_settings
ALTER TABLE "site_settings" ADD COLUMN "promo_heading_en" TEXT;
ALTER TABLE "site_settings" ADD COLUMN "promo_body_en" TEXT;
ALTER TABLE "site_settings" ADD COLUMN "promo_cta_label_en" TEXT;
ALTER TABLE "site_settings" ADD COLUMN "promo_second_heading_en" TEXT;
ALTER TABLE "site_settings" ADD COLUMN "promo_second_body_en" TEXT;
ALTER TABLE "site_settings" ADD COLUMN "promo_second_cta_label_en" TEXT;
ALTER TABLE "site_settings" ADD COLUMN "footer_blurb_en" TEXT;
