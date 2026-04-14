-- ============================================================
-- I0 SalesCore — Polish catalog + switch to optimized images
-- V11__polish_catalog_and_use_optimized_images.sql
--
-- For existing databases:
-- - Use optimized 800x800 images under /product-images/opt
-- - Ensure toothpaste product is branded as Pepsodent
-- ============================================================

-- Core seeded products (match by barcode)
UPDATE products SET image_url = '/product-images/opt/samsung-galaxy-a15.jpg' WHERE barcode = '6901210930208';
UPDATE products SET image_url = '/product-images/opt/wireless-earbuds.jpg' WHERE barcode = '6900000000011';
UPDATE products SET image_url = '/product-images/opt/voltic-water-1-5l.jpg' WHERE barcode = '6001032100302';
UPDATE products SET image_url = '/product-images/opt/alvaro-malt-330ml.jpg' WHERE barcode = '5900822022498';
UPDATE products SET image_url = '/product-images/opt/indomie-chicken-noodles.jpg' WHERE barcode = '8992388010009';
UPDATE products SET image_url = '/product-images/opt/sunshine-bread-loaf.jpg' WHERE barcode = '6001000163018';
UPDATE products SET image_url = '/product-images/opt/mens-classic-polo.jpg' WHERE barcode = '4006381333924';
UPDATE products SET image_url = '/product-images/opt/a4-exercise-book.jpg' WHERE barcode = '6001032400215';
UPDATE products SET image_url = '/product-images/opt/dettol-original-soap.jpg' WHERE barcode = '6285010054585';
UPDATE products SET image_url = '/product-images/opt/electric-rice-cooker-1-8l.jpg' WHERE barcode = '6920001234567';

-- Additional products (added via V10)
UPDATE products SET image_url = '/product-images/opt/usb-flash-drive-32gb.jpg' WHERE barcode = '8400000000001';
UPDATE products
SET
  name = 'Pepsodent Toothpaste (100ml)',
  description = 'Pepsodent toothpaste for daily oral care. Freshens breath and helps fight plaque.',
  image_url = '/product-images/opt/toothpaste-tube.jpg'
WHERE barcode = '8400000000002';
UPDATE products SET image_url = '/product-images/opt/laundry-detergent.jpg' WHERE barcode = '8400000000003';
UPDATE products SET image_url = '/product-images/opt/cooking-oil-1l.jpg' WHERE barcode = '8400000000004';
UPDATE products SET image_url = '/product-images/opt/soft-drink-bottle.jpg' WHERE barcode = '8400000000005';

