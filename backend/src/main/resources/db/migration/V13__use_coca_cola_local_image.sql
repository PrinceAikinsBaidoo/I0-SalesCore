-- Prefer the dedicated Coca-Cola bottle asset when present.
-- (Static file served by the frontend: /public/product-images/opt/Coca-Cola_200ml.jpg)
UPDATE products
SET image_url = '/product-images/opt/Coca-Cola_200ml.jpg'
WHERE active = TRUE
  AND (
        name ILIKE '%coca%cola%'
     OR name ILIKE '%coca-cola%'
    );

