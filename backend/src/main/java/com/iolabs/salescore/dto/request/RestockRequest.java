package com.iolabs.salescore.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record RestockRequest(
        @NotNull(message = "Product ID is required")
        Long productId,
        @NotNull(message = "Supplier ID is required")
        Long supplierId,
        @NotNull(message = "Quantity is required")
        @Min(value = 1, message = "Quantity must be >= 1")
        Integer quantity,
        @DecimalMin(value = "0.0", message = "Unit cost must be >= 0")
        BigDecimal unitCost,
        String referenceNumber,
        String notes
) {}
