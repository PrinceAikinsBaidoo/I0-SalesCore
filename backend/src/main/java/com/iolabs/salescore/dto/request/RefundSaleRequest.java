package com.iolabs.salescore.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public record RefundSaleRequest(
        @Valid List<RefundItemRequest> items,
        String reason
) {
    public record RefundItemRequest(
            @NotNull(message = "Sale item ID is required")
            Long saleItemId,
            @NotNull(message = "Refund quantity is required")
            @Min(value = 1, message = "Refund quantity must be >= 1")
            Integer quantity
    ) {}
}
