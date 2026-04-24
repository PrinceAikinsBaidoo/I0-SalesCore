-- Rename the ₵1.00 demo product to "TomTom" (barcode is stable).
UPDATE products
SET name = 'TomTom'
WHERE barcode = '8400000000099';

