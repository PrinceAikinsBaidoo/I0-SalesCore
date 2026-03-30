package com.iolabs.salescore.dto.response;

import java.math.BigDecimal;

public record LowStockReorderSuggestionResponse(
        Long productId,
        String productName,
        Integer currentStock,
        Integer lowStockThreshold,
        Integer suggestedOrderQuantity,
        BigDecimal estimatedUnitCost
) {}
