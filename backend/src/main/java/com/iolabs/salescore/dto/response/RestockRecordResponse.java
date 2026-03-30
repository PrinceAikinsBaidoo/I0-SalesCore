package com.iolabs.salescore.dto.response;

import java.math.BigDecimal;
import java.time.Instant;

public record RestockRecordResponse(
        Long id,
        Long productId,
        String productName,
        Long supplierId,
        String supplierName,
        Integer quantity,
        BigDecimal unitCost,
        String referenceNumber,
        String notes,
        Long restockedById,
        String restockedByName,
        Instant createdAt
) {}
