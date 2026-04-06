CREATE UNIQUE INDEX IF NOT EXISTS uq_payments_reference_number_non_null
    ON payments(reference_number)
    WHERE reference_number IS NOT NULL;
