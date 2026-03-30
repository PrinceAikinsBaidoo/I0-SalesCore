ALTER TABLE sale_items
    ADD COLUMN IF NOT EXISTS returned_quantity INTEGER NOT NULL DEFAULT 0;

ALTER TABLE sale_items
    ADD CONSTRAINT chk_sale_items_returned_quantity_non_negative
        CHECK (returned_quantity >= 0);
