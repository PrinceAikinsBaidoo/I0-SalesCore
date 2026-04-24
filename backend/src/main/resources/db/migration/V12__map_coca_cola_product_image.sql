-- Assign catalog image for Coca-Cola–named products (often added manually or renamed from generic SKUs).
-- Uses the same static asset as the seeded soft drink (see V7/V10 soft drink row).
UPDATE products
SET image_url = '/product-images/opt/soft-drink-bottle.jpg'
WHERE active = TRUE
  AND (
        name ILIKE '%coca%cola%'
     OR name ILIKE '%coca-cola%'
    );
