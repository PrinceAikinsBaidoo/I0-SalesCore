-- Add a simple low-price product for demos/tests (₵1.00).
-- Idempotent via barcode.

-- Ensure category exists
INSERT INTO categories (name, description)
VALUES ('Promo', 'Promotional / demo items')
ON CONFLICT (name) DO NOTHING;

INSERT INTO products (
    name,
    category_id,
    price,
    cost_price,
    quantity,
    barcode,
    description,
    image_url,
    low_stock_threshold,
    active
)
SELECT
    'Promo Item (₵1.00)',
    c.id,
    1.00,
    0.50,
    100,
    '8400000000099',
    'Demo product priced at one Ghana cedi.',
    NULL,
    10,
    TRUE
FROM categories c
WHERE c.name = 'Promo'
ON CONFLICT (barcode) DO UPDATE SET
    name        = EXCLUDED.name,
    category_id = EXCLUDED.category_id,
    price       = EXCLUDED.price,
    cost_price  = EXCLUDED.cost_price,
    description = EXCLUDED.description,
    active      = TRUE;

