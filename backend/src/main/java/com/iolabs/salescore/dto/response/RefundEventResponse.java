package com.iolabs.salescore.dto.response;

import java.math.BigDecimal;
import java.time.Instant;

public record RefundEventResponse(
        Long id,
        Long saleId,
        String saleNumber,
        Long saleItemId,
        Long productId,
        String productName,
        Integer quantity,
        BigDecimal refundAmount,
        String reason,
        Long refundedById,
        String refundedByName,
        Instant createdAt
) {}
