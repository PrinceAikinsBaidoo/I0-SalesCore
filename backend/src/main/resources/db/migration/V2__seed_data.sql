-- ============================================================
-- I0 SalesCore — Seed Data
-- V2__seed_data.sql
-- ============================================================

-- Default admin user (password: Admin@123)
-- BCrypt hash for "Admin@123"
INSERT INTO users (username, email, password_hash, full_name, phone, role)
VALUES (
    'admin',
    'admin@iolabs.com',
    '$2a$12$UnLvt9XnXJYaFKHNRXiskuZCU0.IoKPuIV/5K6B6Aoy1mG/Vl.Tfe',
    'System Administrator',
    '+1000000000',
    'ADMIN'
) ON CONFLICT (username) DO UPDATE SET
    password_hash = EXCLUDED.password_hash,
    email = EXCLUDED.email;

-- Default categories
INSERT INTO categories (name, description) VALUES
    ('Electronics', 'Electronic devices and accessories'),
    ('Beverages', 'Drinks and beverages'),
    ('Food', 'Food items and snacks'),
    ('Clothing', 'Apparel and clothing'),
    ('Stationery', 'Office and school supplies'),
    ('Health & Beauty', 'Personal care and health products'),
    ('Household', 'Home and household items'),
    ('Other', 'Miscellaneous items')
ON CONFLICT (name) DO NOTHING;
