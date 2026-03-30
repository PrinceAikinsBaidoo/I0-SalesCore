package com.iolabs.salescore.dto.request;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;

public record ProductRequest(
        @NotBlank(message = "Product name is required")
        @Size(max = 200)
        String name,

        Long categoryId,

        @NotNull(message = "Price is required")
        @DecimalMin(value = "0.0", inclusive = false, message = "Price must be greater than 0")
        BigDecimal price,

        @NotNull(message = "Cost price is required")
        @DecimalMin(value = "0.0", message = "Cost price must be >= 0")
        BigDecimal costPrice,

        @Min(value = 0, message = "Quantity must be >= 0")
        Integer quantity,

        String barcode,
        String description,
        String imageUrl,

        @Min(value = 0, message = "Low stock threshold must be >= 0")
        Integer lowStockThreshold
) {}
