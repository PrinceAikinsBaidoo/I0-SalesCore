package com.iolabs.salescore.dto.response;

import com.iolabs.salescore.model.Sale;

import java.math.BigDecimal;

public record RefundSaleResponse(
        Sale sale,
        BigDecimal refundAmount,
        boolean fullyRefunded,
        int refundedItemsCount
) {}
