package com.iolabs.salescore.service;

import com.iolabs.salescore.dto.request.CreateSaleRequest;
import com.iolabs.salescore.dto.request.RefundSaleRequest;
import com.iolabs.salescore.dto.response.RefundEventResponse;
import com.iolabs.salescore.dto.response.RefundSaleResponse;
import com.iolabs.salescore.exception.ApiException;
import com.iolabs.salescore.exception.ResourceNotFoundException;
import com.iolabs.salescore.model.*;
import com.iolabs.salescore.repository.*;
import com.iolabs.salescore.security.AppUserDetails;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SaleService {

    private final SaleRepository saleRepository;
    private final ProductRepository productRepository;
    private final CustomerRepository customerRepository;
    private final UserRepository userRepository;
    private final PaymentRepository paymentRepository;
    private final RefundEventRepository refundEventRepository;
    private final InventoryService inventoryService;

    private static final AtomicInteger SEQ = new AtomicInteger(1);

    public Page<Sale> getSales(Instant from, Instant to, Long userId, Pageable pageable) {
        return saleRepository.findSales(from, to, userId, pageable);
    }

    public Sale getById(Long id) {
        return saleRepository.findByIdWithDetails(id)
                .orElseThrow(() -> new ResourceNotFoundException("Sale", id));
    }

    public Page<RefundEventResponse> getRefundHistory(Instant from, Instant to, Long saleId, Long userId, Pageable pageable) {
        return refundEventRepository.findHistory(saleId, userId, from, to, pageable);
    }

    public byte[] exportRefundHistoryCsv(Instant from, Instant to, Long saleId, Long userId) {
        var page = refundEventRepository.findHistory(
                saleId,
                userId,
                from,
                to,
                Pageable.unpaged()
        );
        String header = "id,createdAt,saleId,saleNumber,saleItemId,productId,productName,quantity,refundAmount,refundedById,refundedByName,reason";
        String body = page.getContent().stream()
                .map(this::refundCsvLine)
                .collect(Collectors.joining("\n"));
        String csv = header + (body.isEmpty() ? "" : "\n" + body);
        return csv.getBytes(java.nio.charset.StandardCharsets.UTF_8);
    }

    @Transactional
    public Sale createSale(CreateSaleRequest request) {
        AppUserDetails principal = (AppUserDetails) SecurityContextHolder
                .getContext().getAuthentication().getPrincipal();
        User user = userRepository.findById(principal.getId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found"));

        Customer customer = null;
        if (request.customerId() != null) {
            customer = customerRepository.findById(request.customerId())
                    .orElseThrow(() -> new ResourceNotFoundException("Customer", request.customerId()));
        }

        Sale sale = Sale.builder()
                .saleNumber(generateSaleNumber())
                .user(user)
                .customer(customer)
                .discountAmount(request.discountAmount() != null ? request.discountAmount() : BigDecimal.ZERO)
                .taxAmount(request.taxAmount() != null ? request.taxAmount() : BigDecimal.ZERO)
                .paymentStatus(Sale.PaymentStatus.PENDING)
                .notes(request.notes())
                .build();

        BigDecimal subtotal = BigDecimal.ZERO;

        for (CreateSaleRequest.SaleItemRequest itemReq : request.items()) {
            Product product = productRepository.findById(itemReq.productId())
                    .orElseThrow(() -> new ResourceNotFoundException("Product", itemReq.productId()));

            if (product.getQuantity() < itemReq.quantity()) {
                throw new ApiException(HttpStatus.BAD_REQUEST,
                        "Insufficient stock for: " + product.getName() + ". Available: " + product.getQuantity());
            }

            BigDecimal itemDiscount = itemReq.discount() != null ? itemReq.discount() : BigDecimal.ZERO;
            BigDecimal lineTotal = product.getPrice()
                    .multiply(BigDecimal.valueOf(itemReq.quantity()))
                    .subtract(itemDiscount);

            SaleItem item = SaleItem.builder()
                    .sale(sale)
                    .product(product)
                    .productName(product.getName())
                    .quantity(itemReq.quantity())
                    .unitPrice(product.getPrice())
                    .discount(itemDiscount)
                    .subtotal(lineTotal)
                    .build();

            sale.getItems().add(item);
            subtotal = subtotal.add(lineTotal);
        }

        BigDecimal totalAmount = subtotal
                .subtract(sale.getDiscountAmount())
                .add(sale.getTaxAmount());

        sale.setSubtotal(subtotal);
        sale.setTotalAmount(totalAmount);

        BigDecimal amountPaid = request.amountPaid();
        if (amountPaid.compareTo(totalAmount) < 0) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "Amount paid (" + amountPaid + ") is less than total (" + totalAmount + ")");
        }

        Sale savedSale = saleRepository.save(sale);

        // Deduct stock atomically
        for (CreateSaleRequest.SaleItemRequest itemReq : request.items()) {
            Product product = productRepository.findById(itemReq.productId()).orElseThrow();
            inventoryService.deductStock(product, itemReq.quantity(), user, savedSale.getId());
        }

        // Record payment
        Payment.PaymentMethod method;
        try { method = Payment.PaymentMethod.valueOf(request.paymentMethod().toUpperCase()); }
        catch (IllegalArgumentException e) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Invalid payment method: " + request.paymentMethod());
        }

        Payment payment = Payment.builder()
                .sale(savedSale)
                .paymentMethod(method)
                .amountPaid(amountPaid)
                .changeAmount(amountPaid.subtract(totalAmount))
                .referenceNumber(request.referenceNumber())
                .status(Payment.PaymentStatus.SUCCESS)
                .build();
        paymentRepository.save(payment);

        // Mark sale as completed
        savedSale.setPaymentStatus(Sale.PaymentStatus.COMPLETED);
        saleRepository.save(savedSale);

        // Award loyalty points (1 point per unit of currency)
        if (customer != null) {
            int points = totalAmount.intValue();
            customerRepository.findById(customer.getId()).ifPresent(c -> {
                c.setLoyaltyPoints(c.getLoyaltyPoints() + points);
                customerRepository.save(c);
            });
        }

        return savedSale;
    }

    @Transactional
    public RefundSaleResponse refundSale(Long saleId, RefundSaleRequest request) {
        Sale sale = getById(saleId);
        if (sale.getPaymentStatus() == Sale.PaymentStatus.REFUNDED) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Sale is already fully refunded");
        }

        AppUserDetails principal = (AppUserDetails) SecurityContextHolder
                .getContext().getAuthentication().getPrincipal();
        User user = userRepository.findById(principal.getId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found"));

        Map<Long, Integer> requested = new HashMap<>();
        if (request != null && request.items() != null && !request.items().isEmpty()) {
            for (RefundSaleRequest.RefundItemRequest itemReq : request.items()) {
                requested.merge(itemReq.saleItemId(), itemReq.quantity(), Integer::sum);
            }
        }

        BigDecimal refundAmount = BigDecimal.ZERO;
        int refundedItemsCount = 0;

        for (SaleItem item : sale.getItems()) {
            int alreadyReturned = item.getReturnedQuantity() == null ? 0 : item.getReturnedQuantity();
            int refundableQty = item.getQuantity() - alreadyReturned;
            if (refundableQty <= 0) continue;

            int returnQty;
            if (requested.isEmpty()) {
                returnQty = refundableQty;
            } else {
                Integer requestedQty = requested.get(item.getId());
                if (requestedQty == null || requestedQty <= 0) continue;
                if (requestedQty > refundableQty) {
                    throw new ApiException(HttpStatus.BAD_REQUEST,
                            "Refund quantity exceeds available for item: " + item.getProductName());
                }
                returnQty = requestedQty;
            }

            BigDecimal unitLineAmount = item.getSubtotal()
                    .divide(BigDecimal.valueOf(item.getQuantity()), 2, RoundingMode.HALF_UP);
            refundAmount = refundAmount.add(unitLineAmount.multiply(BigDecimal.valueOf(returnQty)));

            item.setReturnedQuantity(alreadyReturned + returnQty);
            inventoryService.restockFromReturn(
                    item.getProduct(),
                    returnQty,
                    user,
                    sale.getId(),
                    item.getId(),
                    request != null ? request.reason() : null
            );

            RefundEvent event = RefundEvent.builder()
                    .sale(sale)
                    .saleItem(item)
                    .product(item.getProduct())
                    .refundedBy(user)
                    .quantity(returnQty)
                    .refundAmount(unitLineAmount.multiply(BigDecimal.valueOf(returnQty)))
                    .reason(request != null ? request.reason() : null)
                    .build();
            refundEventRepository.save(event);
            refundedItemsCount++;
        }

        if (refundedItemsCount == 0) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "No refundable items selected");
        }

        boolean fullyRefunded = sale.getItems().stream()
                .allMatch(i -> (i.getReturnedQuantity() == null ? 0 : i.getReturnedQuantity()) >= i.getQuantity());

        if (fullyRefunded) {
            sale.setPaymentStatus(Sale.PaymentStatus.REFUNDED);
        }

        String notePrefix = "Refunded " + refundAmount + " by " + user.getFullName();
        String reasonText = request != null && request.reason() != null && !request.reason().isBlank()
                ? " (Reason: " + request.reason().trim() + ")"
                : "";
        String newNote = notePrefix + reasonText;
        if (sale.getNotes() == null || sale.getNotes().isBlank()) {
            sale.setNotes(newNote);
        } else {
            sale.setNotes(sale.getNotes() + "\n" + newNote);
        }

        saleRepository.save(sale);

        if (sale.getCustomer() != null) {
            Customer customer = sale.getCustomer();
            int pointsToDeduct = refundAmount.intValue();
            customer.setLoyaltyPoints(Math.max(0, customer.getLoyaltyPoints() - pointsToDeduct));
            customerRepository.save(customer);
        }

        return new RefundSaleResponse(sale, refundAmount, fullyRefunded, refundedItemsCount);
    }

    private String generateSaleNumber() {
        String date = DateTimeFormatter.ofPattern("yyyyMMdd")
                .withZone(ZoneId.systemDefault())
                .format(Instant.now());
        String seq;
        do {
            seq = String.format("%04d", SEQ.getAndIncrement());
        } while (saleRepository.existsBySaleNumber("SL-" + date + "-" + seq));
        return "SL-" + date + "-" + seq;
    }

    private String refundCsvLine(RefundEventResponse r) {
        return String.join(",",
                csv(r.id()),
                csv(r.createdAt()),
                csv(r.saleId()),
                csv(r.saleNumber()),
                csv(r.saleItemId()),
                csv(r.productId()),
                csv(r.productName()),
                csv(r.quantity()),
                csv(r.refundAmount()),
                csv(r.refundedById()),
                csv(r.refundedByName()),
                csv(r.reason())
        );
    }

    private String csv(Object v) {
        if (v == null) return "";
        String s = String.valueOf(v);
        if (s.contains("\"")) s = s.replace("\"", "\"\"");
        if (s.contains(",") || s.contains("\n") || s.contains("\r")) return "\"" + s + "\"";
        return s;
    }
}
