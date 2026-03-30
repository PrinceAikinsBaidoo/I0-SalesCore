CREATE TABLE IF NOT EXISTS refund_events (
    id BIGSERIAL PRIMARY KEY,
    sale_id BIGINT NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    sale_item_id BIGINT NOT NULL REFERENCES sale_items(id) ON DELETE CASCADE,
    product_id BIGINT NOT NULL REFERENCES products(id),
    refunded_by BIGINT NOT NULL REFERENCES users(id),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    refund_amount DECIMAL(12, 2) NOT NULL CHECK (refund_amount >= 0),
    reason TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_refund_events_sale ON refund_events(sale_id);
CREATE INDEX IF NOT EXISTS idx_refund_events_created_at ON refund_events(created_at);
CREATE INDEX IF NOT EXISTS idx_refund_events_refunded_by ON refund_events(refunded_by);
