-- ============================================================
-- I0 SalesCore — Product Seed Data (15 Products with Images)
-- V7__seed_products.sql
-- ============================================================
-- Note: Flyway runs all migrations in order (V1–V7) on a fresh database.
-- This migration depends on V2 categories being present.
-- Image URLs point to static files served by the frontend (see frontend/public/product-images/opt).
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
    -- 1. Samsung Galaxy A15
    (
        'Samsung Galaxy A15',
        'Electronics',
        1200.00,
        980.00,
        35,
        '6901210930208',
        '6.5" FHD+ display, 50MP camera, 5000mAh battery. Ideal for everyday smartphone use.',
        '/product-images/opt/samsung-galaxy-a15.jpg',
        5
    ),
    -- 2. Wireless Earbuds
    (
        'Wireless Bluetooth Earbuds',
        'Electronics',
        350.00,
        210.00,
        50,
        '6900000000011',
        'True wireless stereo earbuds with noise isolation, 6-hour playtime, charging case included.',
        '/product-images/opt/wireless-earbuds.jpg',
        8
    ),
    -- 3. Voltic Water 1.5L
    (
        'Voltic Pure Water 1.5L',
        'Beverages',
        8.50,
        5.00,
        200,
        '6001032100302',
        'Purified drinking water. Refreshing and safe for all ages. 1.5 litre bottle.',
        '/product-images/opt/voltic-water-1-5l.jpg',
        30
    ),
    -- 4. Alvaro Malt Drink 330ml
    (
        'Alvaro Malt Drink 330ml',
        'Beverages',
        12.00,
        8.00,
        120,
        '5900822022498',
        'Premium non-alcoholic malt beverage with a rich, smooth flavour. Great chilled.',
        '/product-images/opt/alvaro-malt-330ml.jpg',
        20
    ),
    -- 5. Indomie Chicken Noodles
    (
        'Indomie Chicken Instant Noodles',
        'Food',
        4.50,
        2.80,
        300,
        '8992388010009',
        'Quick-cook chicken-flavoured instant noodles. Ready in 3 minutes. Popular household staple.',
        '/product-images/opt/indomie-chicken-noodles.jpg',
        40
    ),
    -- 6. Sunshine Bread Loaf
    (
        'Sunshine Sliced Bread Loaf',
        'Food',
        18.00,
        12.00,
        60,
        '6001000163018',
        'Soft, freshly baked sliced white bread. 700g loaf. Perfect for sandwiches and toast.',
        '/product-images/opt/sunshine-bread-loaf.jpg',
        10
    ),
    -- 7. Men's Classic Polo Shirt
    (
        'Men''s Classic Polo Shirt',
        'Clothing',
        75.00,
        45.00,
        80,
        '4006381333924',
        'Premium cotton polo shirt. Available in multiple colours. Comfortable and stylish for everyday wear.',
        '/product-images/opt/mens-classic-polo.jpg',
        10
    ),
    -- 8. A4 Exercise Book 80 Leaves
    (
        'A4 Exercise Book (80 Leaves)',
        'Stationery',
        12.00,
        7.00,
        150,
        '6001032400215',
        'Ruled A4 exercise book with 80 leaves (160 pages). Sturdy cover. Suitable for school and office.',
        '/product-images/opt/a4-exercise-book.jpg',
        20
    ),
    -- 9. Dettol Original Bar Soap
    (
        'Dettol Original Bar Soap 120g',
        'Health & Beauty',
        15.00,
        9.50,
        100,
        '6285010054585',
        'Antibacterial bar soap that kills 99.9% of germs. Dermatologically tested. 120g bar.',
        '/product-images/opt/dettol-original-soap.jpg',
        15
    ),
    -- 10. Electric Rice Cooker 1.8L
    (
        'Electric Rice Cooker 1.8L',
        'Household',
        280.00,
        190.00,
        25,
        '6920001234567',
        'Automatic 1.8-litre electric rice cooker with steaming tray and keep-warm function. Easy to use.',
        '/product-images/opt/electric-rice-cooker-1-8l.jpg',
        4
    ),
    -- 11. USB Flash Drive 32GB
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
    -- 12. Toothpaste Tube
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
    -- 13. Laundry Detergent
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
    -- 14. Cooking Oil
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
    -- 15. Soft Drink Bottle
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
