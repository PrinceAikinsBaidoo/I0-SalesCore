package com.iolabs.salescore.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public record ReceivePurchaseOrderRequest(
        String referenceNumber,
        String notes,
        @NotEmpty(message = "At least one received item is required")
        List<@Valid Item> items
) {
    public record Item(
            @NotNull(message = "PO item ID is required")
            Long purchaseOrderItemId,
            @NotNull(message = "Received quantity is required")
            @Min(value = 1, message = "Received quantity must be >= 1")
            Integer quantityReceived
    ) {}
}
