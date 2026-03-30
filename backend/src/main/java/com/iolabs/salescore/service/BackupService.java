package com.iolabs.salescore.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.iolabs.salescore.exception.ApiException;
import com.iolabs.salescore.model.InventoryLog;
import com.iolabs.salescore.model.Payment;
import com.iolabs.salescore.model.Sale;
import com.iolabs.salescore.model.SaleItem;
import com.iolabs.salescore.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BackupService {

    private final ObjectMapper objectMapper;
    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;
    private final CustomerRepository customerRepository;
    private final SaleRepository saleRepository;
    private final PaymentRepository paymentRepository;
    private final InventoryLogRepository inventoryLogRepository;

    public byte[] exportJsonBytes() {
        BackupSnapshot snapshot = buildSnapshot();
        try {
            return objectMapper.writerWithDefaultPrettyPrinter().writeValueAsBytes(snapshot);
        } catch (Exception ex) {
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to generate backup JSON");
        }
    }

    public byte[] exportCsvBytes(String entityRaw) {
        String entity = normalizeEntity(entityRaw);
        String csv = switch (entity) {
            case "users" -> usersCsv();
            case "categories" -> categoriesCsv();
            case "products" -> productsCsv();
            case "customers" -> customersCsv();
            case "sales" -> salesCsv();
            case "sale_items" -> saleItemsCsv();
            case "payments" -> paymentsCsv();
            case "inventory_logs" -> inventoryLogsCsv();
            default -> throw new ApiException(HttpStatus.BAD_REQUEST, "Unsupported CSV entity: " + entityRaw);
        };
        return csv.getBytes(StandardCharsets.UTF_8);
    }

    private BackupSnapshot buildSnapshot() {
        Instant exportedAt = Instant.now();
        return new BackupSnapshot(
                exportedAt,
                userRepository.findAll(Sort.by("id")).stream()
                        .map(u -> new UserRow(u.getId(), u.getUsername(), u.getEmail(), u.getFullName(),
                                u.getPhone(), u.getPasswordHash(), u.getRole().name(), u.isActive(), u.getCreatedAt(), u.getUpdatedAt()))
                        .toList(),
                categoryRepository.findAll(Sort.by("id")).stream()
                        .map(c -> new CategoryRow(c.getId(), c.getName(), c.getDescription(), c.getCreatedAt()))
                        .toList(),
                productRepository.findAllWithCategory().stream()
                        .map(p -> new ProductRow(
                                p.getId(),
                                p.getName(),
                                p.getCategory() != null ? p.getCategory().getId() : null,
                                p.getCategory() != null ? p.getCategory().getName() : null,
                                p.getPrice(),
                                p.getCostPrice(),
                                p.getQuantity(),
                                p.getBarcode(),
                                p.getDescription(),
                                p.getImageUrl(),
                                p.getLowStockThreshold(),
                                p.isActive(),
                                p.getCreatedAt(),
                                p.getUpdatedAt()
                        ))
                        .toList(),
                customerRepository.findAll(Sort.by("id")).stream()
                        .map(c -> new CustomerRow(c.getId(), c.getName(), c.getEmail(), c.getPhone(), c.getAddress(),
                                c.getLoyaltyPoints(), c.getCreatedAt(), c.getUpdatedAt()))
                        .toList(),
                saleRepository.findAllWithDetails().stream()
                        .map(this::toSaleRow)
                        .toList(),
                paymentRepository.findAllWithSale().stream()
                        .map(p -> new PaymentRow(
                                p.getId(),
                                p.getSale() != null ? p.getSale().getId() : null,
                                p.getPaymentMethod().name(),
                                p.getAmountPaid(),
                                p.getChangeAmount(),
                                p.getReferenceNumber(),
                                p.getStatus().name(),
                                p.getCreatedAt()
                        ))
                        .toList(),
                inventoryLogRepository.findAllWithDetails().stream()
                        .map(l -> new InventoryLogRow(
                                l.getId(),
                                l.getProduct() != null ? l.getProduct().getId() : null,
                                l.getProduct() != null ? l.getProduct().getName() : null,
                                l.getAdjustmentType().name(),
                                l.getQuantityChange(),
                                l.getPreviousQuantity(),
                                l.getNewQuantity(),
                                l.getReason(),
                                l.getUser() != null ? l.getUser().getId() : null,
                                l.getUser() != null ? l.getUser().getFullName() : null,
                                l.getCreatedAt()
                        ))
                        .toList()
        );
    }

    private SaleRow toSaleRow(Sale s) {
        List<SaleItemRow> items = s.getItems().stream()
                .map(i -> new SaleItemRow(
                        i.getId(),
                        i.getProduct() != null ? i.getProduct().getId() : null,
                        i.getProductName(),
                        i.getQuantity(),
                        i.getUnitPrice(),
                        i.getDiscount(),
                        i.getSubtotal()
                ))
                .toList();
        return new SaleRow(
                s.getId(),
                s.getSaleNumber(),
                s.getUser() != null ? s.getUser().getId() : null,
                s.getUser() != null ? s.getUser().getFullName() : null,
                s.getCustomer() != null ? s.getCustomer().getId() : null,
                s.getCustomer() != null ? s.getCustomer().getName() : null,
                s.getSubtotal(),
                s.getDiscountAmount(),
                s.getTaxAmount(),
                s.getTotalAmount(),
                s.getPaymentStatus().name(),
                s.getNotes(),
                s.getCreatedAt(),
                items
        );
    }

    private String usersCsv() {
        List<List<Object>> rows = new ArrayList<>();
        rows.add(List.of("id", "username", "email", "fullName", "phone", "role", "active", "createdAt", "updatedAt"));
        userRepository.findAll(Sort.by("id")).forEach(u -> rows.add(List.of(
                u.getId(), u.getUsername(), u.getEmail(), u.getFullName(), n(u.getPhone()),
                u.getRole().name(), u.isActive(), u.getCreatedAt(), u.getUpdatedAt()
        )));
        return toCsv(rows);
    }

    private String categoriesCsv() {
        List<List<Object>> rows = new ArrayList<>();
        rows.add(List.of("id", "name", "description", "createdAt"));
        categoryRepository.findAll(Sort.by("id")).forEach(c -> rows.add(List.of(
                c.getId(), c.getName(), n(c.getDescription()), c.getCreatedAt()
        )));
        return toCsv(rows);
    }

    private String productsCsv() {
        List<List<Object>> rows = new ArrayList<>();
        rows.add(List.of("id", "name", "categoryId", "categoryName", "price", "costPrice", "quantity",
                "barcode", "description", "imageUrl", "lowStockThreshold", "active", "createdAt", "updatedAt"));
        productRepository.findAllWithCategory().forEach(p -> rows.add(List.of(
                p.getId(), p.getName(),
                p.getCategory() != null ? p.getCategory().getId() : "",
                p.getCategory() != null ? p.getCategory().getName() : "",
                p.getPrice(), p.getCostPrice(), p.getQuantity(),
                n(p.getBarcode()), n(p.getDescription()), n(p.getImageUrl()),
                p.getLowStockThreshold(), p.isActive(), p.getCreatedAt(), p.getUpdatedAt()
        )));
        return toCsv(rows);
    }

    private String customersCsv() {
        List<List<Object>> rows = new ArrayList<>();
        rows.add(List.of("id", "name", "email", "phone", "address", "loyaltyPoints", "createdAt", "updatedAt"));
        customerRepository.findAll(Sort.by("id")).forEach(c -> rows.add(List.of(
                c.getId(), c.getName(), n(c.getEmail()), n(c.getPhone()), n(c.getAddress()),
                c.getLoyaltyPoints(), c.getCreatedAt(), c.getUpdatedAt()
        )));
        return toCsv(rows);
    }

    private String salesCsv() {
        List<List<Object>> rows = new ArrayList<>();
        rows.add(List.of("id", "saleNumber", "userId", "userName", "customerId", "customerName",
                "subtotal", "discountAmount", "taxAmount", "totalAmount", "paymentStatus", "notes", "createdAt"));
        saleRepository.findAllWithDetails().forEach(s -> rows.add(List.of(
                s.getId(), s.getSaleNumber(),
                s.getUser() != null ? s.getUser().getId() : "",
                s.getUser() != null ? s.getUser().getFullName() : "",
                s.getCustomer() != null ? s.getCustomer().getId() : "",
                s.getCustomer() != null ? s.getCustomer().getName() : "",
                s.getSubtotal(), s.getDiscountAmount(), s.getTaxAmount(), s.getTotalAmount(),
                s.getPaymentStatus().name(), n(s.getNotes()), s.getCreatedAt()
        )));
        return toCsv(rows);
    }

    private String saleItemsCsv() {
        List<List<Object>> rows = new ArrayList<>();
        rows.add(List.of("id", "saleId", "saleNumber", "productId", "productName", "quantity", "unitPrice", "discount", "subtotal"));
        saleRepository.findAllWithDetails().forEach(s -> {
            for (SaleItem i : s.getItems()) {
                rows.add(List.of(
                        i.getId(), s.getId(), s.getSaleNumber(),
                        i.getProduct() != null ? i.getProduct().getId() : "",
                        i.getProductName(),
                        i.getQuantity(),
                        i.getUnitPrice(),
                        i.getDiscount(),
                        i.getSubtotal()
                ));
            }
        });
        return toCsv(rows);
    }

    private String paymentsCsv() {
        List<List<Object>> rows = new ArrayList<>();
        rows.add(List.of("id", "saleId", "paymentMethod", "amountPaid", "changeAmount", "referenceNumber", "status", "createdAt"));
        paymentRepository.findAllWithSale().forEach(p -> rows.add(List.of(
                p.getId(),
                p.getSale() != null ? p.getSale().getId() : "",
                p.getPaymentMethod().name(),
                p.getAmountPaid(),
                p.getChangeAmount(),
                n(p.getReferenceNumber()),
                p.getStatus().name(),
                p.getCreatedAt()
        )));
        return toCsv(rows);
    }

    private String inventoryLogsCsv() {
        List<List<Object>> rows = new ArrayList<>();
        rows.add(List.of("id", "productId", "productName", "adjustmentType", "quantityChange", "previousQuantity",
                "newQuantity", "reason", "userId", "userName", "createdAt"));
        List<InventoryLog> logs = inventoryLogRepository.findAllWithDetails();
        logs.forEach(l -> rows.add(List.of(
                l.getId(),
                l.getProduct() != null ? l.getProduct().getId() : "",
                l.getProduct() != null ? l.getProduct().getName() : "",
                l.getAdjustmentType().name(),
                l.getQuantityChange(),
                l.getPreviousQuantity(),
                l.getNewQuantity(),
                n(l.getReason()),
                l.getUser() != null ? l.getUser().getId() : "",
                l.getUser() != null ? l.getUser().getFullName() : "",
                l.getCreatedAt()
        )));
        return toCsv(rows);
    }

    private String normalizeEntity(String raw) {
        if (raw == null || raw.isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "CSV entity is required");
        }
        return raw.trim().toLowerCase(Locale.ROOT);
    }

    private String toCsv(List<List<Object>> rows) {
        return rows.stream()
                .map(this::csvLine)
                .collect(Collectors.joining("\n"));
    }

    private String csvLine(List<Object> values) {
        return values.stream()
                .map(this::escapeCsv)
                .collect(Collectors.joining(","));
    }

    private String escapeCsv(Object value) {
        if (value == null) return "";
        String s = String.valueOf(value);
        if (s.contains("\"")) s = s.replace("\"", "\"\"");
        if (s.contains(",") || s.contains("\n") || s.contains("\r")) {
            return "\"" + s + "\"";
        }
        return s;
    }

    private String n(String s) {
        return s == null ? "" : s;
    }

    public record BackupSnapshot(
            Instant exportedAt,
            List<UserRow> users,
            List<CategoryRow> categories,
            List<ProductRow> products,
            List<CustomerRow> customers,
            List<SaleRow> sales,
            List<PaymentRow> payments,
            List<InventoryLogRow> inventoryLogs
    ) {}

    public record UserRow(
            Long id,
            String username,
            String email,
            String fullName,
            String phone,
            String passwordHash,
            String role,
            boolean active,
            Instant createdAt,
            Instant updatedAt
    ) {}

    public record CategoryRow(
            Long id,
            String name,
            String description,
            Instant createdAt
    ) {}

    public record ProductRow(
            Long id,
            String name,
            Long categoryId,
            String categoryName,
            Object price,
            Object costPrice,
            Integer quantity,
            String barcode,
            String description,
            String imageUrl,
            Integer lowStockThreshold,
            boolean active,
            Instant createdAt,
            Instant updatedAt
    ) {}

    public record CustomerRow(
            Long id,
            String name,
            String email,
            String phone,
            String address,
            Integer loyaltyPoints,
            Instant createdAt,
            Instant updatedAt
    ) {}

    public record SaleRow(
            Long id,
            String saleNumber,
            Long userId,
            String userName,
            Long customerId,
            String customerName,
            Object subtotal,
            Object discountAmount,
            Object taxAmount,
            Object totalAmount,
            String paymentStatus,
            String notes,
            Instant createdAt,
            List<SaleItemRow> items
    ) {}

    public record SaleItemRow(
            Long id,
            Long productId,
            String productName,
            Integer quantity,
            Object unitPrice,
            Object discount,
            Object subtotal
    ) {}

    public record PaymentRow(
            Long id,
            Long saleId,
            String paymentMethod,
            Object amountPaid,
            Object changeAmount,
            String referenceNumber,
            String status,
            Instant createdAt
    ) {}

    public record InventoryLogRow(
            Long id,
            Long productId,
            String productName,
            String adjustmentType,
            Integer quantityChange,
            Integer previousQuantity,
            Integer newQuantity,
            String reason,
            Long userId,
            String userName,
            Instant createdAt
    ) {}
}
