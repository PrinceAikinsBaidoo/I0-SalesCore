package com.iolabs.salescore.dto.response;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

public record PurchaseOrderResponse(
        Long id,
        String poNumber,
        String status,
        Long supplierId,
        String supplierName,
        LocalDate expectedDate,
        /** True when expected date is before today and status is still in-flight (approved / partial). */
        boolean overdue,
        String notes,
        Long createdById,
        String createdByName,
        Long approvedById,
        String approvedByName,
        Instant createdAt,
        Instant updatedAt,
        List<Item> items
) {
    public record Item(
            Long id,
            Long productId,
            String productName,
            Integer orderedQuantity,
            Integer receivedQuantity,
            Integer remainingQuantity,
            BigDecimal unitCost
    ) {}
}
