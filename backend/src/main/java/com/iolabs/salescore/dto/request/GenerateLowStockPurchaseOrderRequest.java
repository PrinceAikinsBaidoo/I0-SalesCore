package com.iolabs.salescore.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.util.List;

public record GenerateLowStockPurchaseOrderRequest(
        @NotNull(message = "Supplier ID is required")
        Long supplierId,
        LocalDate expectedDate,
        String notes,
        List<@Valid Item> items
) {
    public record Item(
            @NotNull(message = "Product ID is required")
            Long productId,
            @NotNull(message = "Quantity is required")
            @Min(value = 1, message = "Quantity must be >= 1")
            Integer quantity
    ) {}
}
