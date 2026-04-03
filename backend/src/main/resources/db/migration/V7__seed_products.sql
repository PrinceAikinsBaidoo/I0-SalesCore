-- ============================================================
-- I0 SalesCore — Product Seed Data (10 Products with Images)
-- V7__seed_products.sql
-- ============================================================
-- Note: Flyway runs all migrations in order (V1–V7) on a fresh database.
-- This migration depends on V2 categories being present.
-- Image URLs use Unsplash CDN (no API key required for direct photo URLs).
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
        'https://images.unsplash.com/photo-1610945415253-d7e0c7ea3c92?w=400&h=400&fit=crop&q=80',
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
        'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=400&h=400&fit=crop&q=80',
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
        'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=400&h=400&fit=crop&q=80',
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
        'https://images.unsplash.com/photo-1551538827-9c037cb4f32a?w=400&h=400&fit=crop&q=80',
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
        'https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=400&h=400&fit=crop&q=80',
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
        'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&h=400&fit=crop&q=80',
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
        'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop&q=80',
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
        'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&h=400&fit=crop&q=80',
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
        'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=400&h=400&fit=crop&q=80',
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
        'https://images.unsplash.com/photo-1534483509719-3feaee7c30da?w=400&h=400&fit=crop&q=80',
        4
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
