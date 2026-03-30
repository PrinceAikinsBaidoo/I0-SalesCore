package com.iolabs.salescore.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.util.List;

public record CreateSaleRequest(
        Long customerId,

        @NotEmpty(message = "Sale must have at least one item")
        @Valid
        List<SaleItemRequest> items,

        @DecimalMin(value = "0.0")
        BigDecimal discountAmount,

        @DecimalMin(value = "0.0")
        BigDecimal taxAmount,

        @NotNull(message = "Payment method is required")
        String paymentMethod,

        @NotNull(message = "Amount paid is required")
        @DecimalMin(value = "0.0", message = "Amount paid must be >= 0")
        BigDecimal amountPaid,

        String referenceNumber,
        String notes
) {
    public record SaleItemRequest(
            @NotNull(message = "Product ID is required")
            Long productId,

            @NotNull @Min(value = 1, message = "Quantity must be >= 1")
            Integer quantity,

            @DecimalMin(value = "0.0")
            BigDecimal discount
    ) {}
}
