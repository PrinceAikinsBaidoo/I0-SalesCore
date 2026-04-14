-- ============================================================
-- I0 SalesCore — Add more seeded products (for existing DBs)
-- V10__seed_more_products_with_images.sql
--
-- V7 seeds products on fresh DBs. This migration adds 5 additional
-- products and sets their image URLs for already-running databases.
-- ============================================================

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
    p.name,
    c.id AS category_id,
    p.price,
    p.cost_price,
    p.quantity,
    p.barcode,
    p.description,
    p.image_url,
    p.low_stock_threshold,
    TRUE
FROM (VALUES
    (
        'USB Flash Drive 32GB',
        'Electronics',
        45.00,
        28.00,
        120,
        '8400000000001',
        'USB 3.0 flash drive for quick file transfer and backups. 32GB capacity.',
        '/product-images/opt/usb-flash-drive-32gb.jpg',
        20
    ),
    (
        'Pepsodent Toothpaste (100ml)',
        'Health & Beauty',
        18.00,
        11.00,
        90,
        '8400000000002',
        'Pepsodent toothpaste for daily oral care. Freshens breath and helps fight plaque.',
        '/product-images/opt/toothpaste-tube.jpg',
        15
    ),
    (
        'Laundry Detergent Powder 1kg',
        'Household',
        65.00,
        45.00,
        60,
        '8400000000003',
        'All-purpose laundry detergent powder for hand-wash or machine wash. 1kg pack.',
        '/product-images/opt/laundry-detergent.jpg',
        10
    ),
    (
        'Cooking Oil 1L',
        'Food',
        55.00,
        40.00,
        70,
        '8400000000004',
        'Refined cooking oil suitable for frying and baking. 1 litre bottle.',
        '/product-images/opt/cooking-oil-1l.jpg',
        12
    ),
    (
        'Soft Drink Bottle 500ml',
        'Beverages',
        10.00,
        6.50,
        150,
        '8400000000005',
        'Chilled bottled soft drink. 500ml.',
        '/product-images/opt/soft-drink-bottle.jpg',
        25
    )
) AS p(name, category_name, price, cost_price, quantity, barcode, description, image_url, low_stock_threshold)
JOIN categories c ON c.name = p.category_name
ON CONFLICT (barcode) DO UPDATE SET
    name          = EXCLUDED.name,
    price         = EXCLUDED.price,
    cost_price    = EXCLUDED.cost_price,
    description   = EXCLUDED.description,
    image_url     = EXCLUDED.image_url,
    low_stock_threshold = EXCLUDED.low_stock_threshold;

