package com.iolabs.salescore.dto.request;

import jakarta.validation.constraints.NotNull;

public record InventoryAdjustRequest(
        @NotNull(message = "Product ID is required")
        Long productId,

        @NotNull(message = "Quantity change is required")
        Integer quantityChange,

        @NotNull(message = "Adjustment type is required")
        String adjustmentType,

        String reason
) {}
