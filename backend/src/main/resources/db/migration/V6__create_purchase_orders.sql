CREATE TABLE IF NOT EXISTS purchase_orders (
    id BIGSERIAL PRIMARY KEY,
    po_number VARCHAR(40) NOT NULL UNIQUE,
    supplier_id BIGINT NOT NULL REFERENCES suppliers(id),
    status VARCHAR(30) NOT NULL CHECK (status IN ('DRAFT', 'APPROVED', 'PARTIALLY_RECEIVED', 'RECEIVED', 'CLOSED', 'CANCELLED')),
    created_by BIGINT NOT NULL REFERENCES users(id),
    approved_by BIGINT REFERENCES users(id),
    expected_date DATE,
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS purchase_order_items (
    id BIGSERIAL PRIMARY KEY,
    purchase_order_id BIGINT NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
    product_id BIGINT NOT NULL REFERENCES products(id),
    ordered_quantity INTEGER NOT NULL CHECK (ordered_quantity > 0),
    received_quantity INTEGER NOT NULL DEFAULT 0 CHECK (received_quantity >= 0),
    unit_cost DECIMAL(12, 2),
    CHECK (received_quantity <= ordered_quantity)
);

CREATE INDEX IF NOT EXISTS idx_po_supplier ON purchase_orders(supplier_id);
CREATE INDEX IF NOT EXISTS idx_po_status ON purchase_orders(status);
CREATE INDEX IF NOT EXISTS idx_po_created_at ON purchase_orders(created_at);
CREATE INDEX IF NOT EXISTS idx_po_items_po ON purchase_order_items(purchase_order_id);
CREATE INDEX IF NOT EXISTS idx_po_items_product ON purchase_order_items(product_id);
