-- ============================================================
-- I0 SalesCore — Switch seeded product images to local assets
-- V9__use_local_product_images.sql
--
-- This updates existing rows (for already-created databases) to use
-- product images stored in frontend/public/product-images.
-- Safe to run once via Flyway: rows are matched by stable barcodes.
-- ============================================================

UPDATE products
SET image_url = '/product-images/opt/samsung-galaxy-a15.jpg'
WHERE barcode = '6901210930208';

UPDATE products
SET image_url = '/product-images/opt/wireless-earbuds.jpg'
WHERE barcode = '6900000000011';

UPDATE products
SET image_url = '/product-images/opt/voltic-water-1-5l.jpg'
WHERE barcode = '6001032100302';

UPDATE products
SET image_url = '/product-images/opt/alvaro-malt-330ml.jpg'
WHERE barcode = '5900822022498';

UPDATE products
SET image_url = '/product-images/opt/indomie-chicken-noodles.jpg'
WHERE barcode = '8992388010009';

UPDATE products
SET image_url = '/product-images/opt/sunshine-bread-loaf.jpg'
WHERE barcode = '6001000163018';

UPDATE products
SET image_url = '/product-images/opt/mens-classic-polo.jpg'
WHERE barcode = '4006381333924';

UPDATE products
SET image_url = '/product-images/opt/a4-exercise-book.jpg'
WHERE barcode = '6001032400215';

UPDATE products
SET image_url = '/product-images/opt/dettol-original-soap.jpg'
WHERE barcode = '6285010054585';

UPDATE products
SET image_url = '/product-images/opt/electric-rice-cooker-1-8l.jpg'
WHERE barcode = '6920001234567';

