package com.iolabs.salescore.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.iolabs.salescore.exception.ApiException;
import com.iolabs.salescore.model.*;
import com.iolabs.salescore.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.*;

@Service
@RequiredArgsConstructor
public class BackupImportService {

    private final ObjectMapper objectMapper;
    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;
    private final CustomerRepository customerRepository;
    private final SaleRepository saleRepository;
    private final PaymentRepository paymentRepository;
    private final InventoryLogRepository inventoryLogRepository;

    @Transactional
    public ImportSummary importJson(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Backup file is required");
        }

        try {
            JsonNode root = objectMapper.readTree(file.getBytes());

            Map<Long, User> userByLegacyId = importUsers(root.path("users"));
            Map<Long, Category> categoryByLegacyId = importCategories(root.path("categories"));
            Map<Long, Product> productByLegacyId = importProducts(root.path("products"), categoryByLegacyId);
            Map<Long, Customer> customerByLegacyId = importCustomers(root.path("customers"));

            ImportCounters saleCounters = importSales(
                    root.path("sales"),
                    userByLegacyId,
                    customerByLegacyId,
                    productByLegacyId
            );

            int importedPayments = importPayments(
                    root.path("payments"),
                    saleCounters.saleByLegacyId(),
                    saleCounters.importedSaleNumbers()
            );

            int importedInventoryLogs = importInventoryLogs(
                    root.path("inventoryLogs"),
                    userByLegacyId,
                    productByLegacyId
            );

            return new ImportSummary(
                    userByLegacyId.size(),
                    categoryByLegacyId.size(),
                    productByLegacyId.size(),
                    customerByLegacyId.size(),
                    saleCounters.importedSales(),
                    importedPayments,
                    importedInventoryLogs,
                    saleCounters.skippedSales(),
                    saleCounters.skippedSaleItems()
            );
        } catch (ApiException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Invalid backup JSON format");
        }
    }

    private Map<Long, User> importUsers(JsonNode usersNode) {
        Map<Long, User> byLegacyId = new HashMap<>();
        if (!usersNode.isArray()) return byLegacyId;

        for (JsonNode node : usersNode) {
            String username = text(node, "username");
            String email = text(node, "email");
            if (username == null || email == null) continue;

            User user = userRepository.findByUsername(username)
                    .or(() -> userRepository.findByEmail(email))
                    .orElseGet(User::new);

            user.setUsername(username);
            user.setEmail(email);
            user.setFullName(text(node, "fullName", "Unknown User"));
            user.setPhone(text(node, "phone"));
            user.setPasswordHash(text(node, "passwordHash", user.getPasswordHash()));
            user.setRole(parseEnum(User.Role.class, text(node, "role"), User.Role.CASHIER));
            user.setActive(node.path("active").asBoolean(true));
            user.setCreatedAt(parseInstant(node.path("createdAt").asText(null), user.getCreatedAt()));
            user.setUpdatedAt(parseInstant(node.path("updatedAt").asText(null), user.getUpdatedAt()));

            User saved = userRepository.save(user);
            Long legacyId = longVal(node, "id");
            if (legacyId != null) byLegacyId.put(legacyId, saved);
        }
        return byLegacyId;
    }

    private Map<Long, Category> importCategories(JsonNode categoriesNode) {
        Map<Long, Category> byLegacyId = new HashMap<>();
        if (!categoriesNode.isArray()) return byLegacyId;

        for (JsonNode node : categoriesNode) {
            String name = text(node, "name");
            if (name == null) continue;

            Category category = categoryRepository.findByName(name).orElseGet(Category::new);
            category.setName(name);
            category.setDescription(text(node, "description"));
            category.setCreatedAt(parseInstant(node.path("createdAt").asText(null), category.getCreatedAt()));

            Category saved = categoryRepository.save(category);
            Long legacyId = longVal(node, "id");
            if (legacyId != null) byLegacyId.put(legacyId, saved);
        }
        return byLegacyId;
    }

    private Map<Long, Product> importProducts(JsonNode productsNode, Map<Long, Category> categoryByLegacyId) {
        Map<Long, Product> byLegacyId = new HashMap<>();
        if (!productsNode.isArray()) return byLegacyId;

        for (JsonNode node : productsNode) {
            String name = text(node, "name");
            if (name == null) continue;

            Long legacyCategoryId = longVal(node, "categoryId");
            Category category = legacyCategoryId != null ? categoryByLegacyId.get(legacyCategoryId) : null;

            String barcode = text(node, "barcode");
            Optional<Product> existing = Optional.empty();
            if (barcode != null && !barcode.isBlank()) {
                existing = productRepository.findByBarcode(barcode);
            }
            if (existing.isEmpty() && category != null) {
                existing = productRepository.findByNameAndCategory_Id(name, category.getId());
            }

            Product product = existing.orElseGet(Product::new);
            product.setName(name);
            product.setCategory(category);
            product.setPrice(decimalVal(node, "price", BigDecimal.ZERO));
            product.setCostPrice(decimalVal(node, "costPrice", BigDecimal.ZERO));
            product.setQuantity(intVal(node, "quantity", 0));
            product.setBarcode(blankToNull(barcode));
            product.setDescription(text(node, "description"));
            product.setImageUrl(text(node, "imageUrl"));
            product.setLowStockThreshold(intVal(node, "lowStockThreshold", 10));
            product.setActive(node.path("active").asBoolean(true));
            product.setCreatedAt(parseInstant(node.path("createdAt").asText(null), product.getCreatedAt()));
            product.setUpdatedAt(parseInstant(node.path("updatedAt").asText(null), product.getUpdatedAt()));

            Product saved = productRepository.save(product);
            Long legacyId = longVal(node, "id");
            if (legacyId != null) byLegacyId.put(legacyId, saved);
        }

        return byLegacyId;
    }

    private Map<Long, Customer> importCustomers(JsonNode customersNode) {
        Map<Long, Customer> byLegacyId = new HashMap<>();
        if (!customersNode.isArray()) return byLegacyId;

        for (JsonNode node : customersNode) {
            String name = text(node, "name");
            if (name == null) continue;

            String email = text(node, "email");
            String phone = text(node, "phone");

            Optional<Customer> existing = Optional.empty();
            if (email != null && !email.isBlank()) {
                existing = customerRepository.findByEmail(email);
            }
            if (existing.isEmpty() && phone != null && !phone.isBlank()) {
                existing = customerRepository.findByNameAndPhone(name, phone);
            }

            Customer customer = existing.orElseGet(Customer::new);
            customer.setName(name);
            customer.setEmail(blankToNull(email));
            customer.setPhone(blankToNull(phone));
            customer.setAddress(text(node, "address"));
            customer.setLoyaltyPoints(intVal(node, "loyaltyPoints", 0));
            customer.setCreatedAt(parseInstant(node.path("createdAt").asText(null), customer.getCreatedAt()));
            customer.setUpdatedAt(parseInstant(node.path("updatedAt").asText(null), customer.getUpdatedAt()));

            Customer saved = customerRepository.save(customer);
            Long legacyId = longVal(node, "id");
            if (legacyId != null) byLegacyId.put(legacyId, saved);
        }

        return byLegacyId;
    }

    private ImportCounters importSales(
            JsonNode salesNode,
            Map<Long, User> userByLegacyId,
            Map<Long, Customer> customerByLegacyId,
            Map<Long, Product> productByLegacyId
    ) {
        Map<Long, Sale> saleByLegacyId = new HashMap<>();
        Set<String> importedSaleNumbers = new HashSet<>();
        int importedSales = 0;
        int skippedSales = 0;
        int skippedItems = 0;

        if (!salesNode.isArray()) {
            return new ImportCounters(saleByLegacyId, importedSaleNumbers, 0, 0, 0);
        }

        for (JsonNode node : salesNode) {
            String saleNumber = text(node, "saleNumber");
            if (saleNumber == null) {
                skippedSales++;
                continue;
            }

            Optional<Sale> existing = saleRepository.findBySaleNumber(saleNumber);
            if (existing.isPresent()) {
                Long legacyId = longVal(node, "id");
                if (legacyId != null) saleByLegacyId.put(legacyId, existing.get());
                skippedSales++;
                continue;
            }

            Long userLegacyId = longVal(node, "userId");
            User user = userLegacyId != null ? userByLegacyId.get(userLegacyId) : null;
            if (user == null) {
                skippedSales++;
                continue;
            }

            Sale sale = new Sale();
            sale.setSaleNumber(saleNumber);
            sale.setUser(user);

            Long customerLegacyId = longVal(node, "customerId");
            if (customerLegacyId != null) {
                sale.setCustomer(customerByLegacyId.get(customerLegacyId));
            }

            sale.setSubtotal(decimalVal(node, "subtotal", BigDecimal.ZERO));
            sale.setDiscountAmount(decimalVal(node, "discountAmount", BigDecimal.ZERO));
            sale.setTaxAmount(decimalVal(node, "taxAmount", BigDecimal.ZERO));
            sale.setTotalAmount(decimalVal(node, "totalAmount", BigDecimal.ZERO));
            sale.setPaymentStatus(parseEnum(Sale.PaymentStatus.class, text(node, "paymentStatus"), Sale.PaymentStatus.COMPLETED));
            sale.setNotes(text(node, "notes"));
            sale.setCreatedAt(parseInstant(node.path("createdAt").asText(null), sale.getCreatedAt()));

            JsonNode itemsNode = node.path("items");
            if (itemsNode.isArray()) {
                for (JsonNode itemNode : itemsNode) {
                    Long productLegacyId = longVal(itemNode, "productId");
                    Product product = productLegacyId != null ? productByLegacyId.get(productLegacyId) : null;
                    if (product == null) {
                        skippedItems++;
                        continue;
                    }
                    SaleItem item = new SaleItem();
                    item.setSale(sale);
                    item.setProduct(product);
                    item.setProductName(text(itemNode, "productName", product.getName()));
                    item.setQuantity(intVal(itemNode, "quantity", 1));
                    item.setUnitPrice(decimalVal(itemNode, "unitPrice", product.getPrice()));
                    item.setDiscount(decimalVal(itemNode, "discount", BigDecimal.ZERO));
                    item.setSubtotal(decimalVal(itemNode, "subtotal", product.getPrice()));
                    sale.getItems().add(item);
                }
            }

            Sale saved = saleRepository.save(sale);
            Long legacyId = longVal(node, "id");
            if (legacyId != null) saleByLegacyId.put(legacyId, saved);
            importedSales++;
            importedSaleNumbers.add(saved.getSaleNumber());
        }

        return new ImportCounters(saleByLegacyId, importedSaleNumbers, importedSales, skippedSales, skippedItems);
    }

    private int importPayments(JsonNode paymentsNode, Map<Long, Sale> saleByLegacyId, Set<String> importedSaleNumbers) {
        if (!paymentsNode.isArray()) return 0;
        int imported = 0;
        for (JsonNode node : paymentsNode) {
            Long saleLegacyId = longVal(node, "saleId");
            if (saleLegacyId == null) continue;
            Sale sale = saleByLegacyId.get(saleLegacyId);
            if (sale == null || !importedSaleNumbers.contains(sale.getSaleNumber())) continue;

            Payment.PaymentMethod method = parseEnum(Payment.PaymentMethod.class, text(node, "paymentMethod"), Payment.PaymentMethod.CASH);
            BigDecimal amountPaid = decimalVal(node, "amountPaid", BigDecimal.ZERO);
            Instant createdAt = parseInstant(node.path("createdAt").asText(null), null);

            if (createdAt != null && paymentRepository.existsBySaleIdAndPaymentMethodAndAmountPaidAndCreatedAt(
                    sale.getId(), method, amountPaid, createdAt
            )) {
                continue;
            }

            Payment payment = new Payment();
            payment.setSale(sale);
            payment.setPaymentMethod(method);
            payment.setAmountPaid(amountPaid);
            payment.setChangeAmount(decimalVal(node, "changeAmount", BigDecimal.ZERO));
            payment.setReferenceNumber(text(node, "referenceNumber"));
            payment.setStatus(parseEnum(Payment.PaymentStatus.class, text(node, "status"), Payment.PaymentStatus.SUCCESS));
            payment.setCreatedAt(createdAt);
            paymentRepository.save(payment);
            imported++;
        }
        return imported;
    }

    private int importInventoryLogs(
            JsonNode logsNode,
            Map<Long, User> userByLegacyId,
            Map<Long, Product> productByLegacyId
    ) {
        if (!logsNode.isArray()) return 0;
        int imported = 0;
        for (JsonNode node : logsNode) {
            Long productLegacyId = longVal(node, "productId");
            Long userLegacyId = longVal(node, "userId");
            Product product = productLegacyId != null ? productByLegacyId.get(productLegacyId) : null;
            User user = userLegacyId != null ? userByLegacyId.get(userLegacyId) : null;
            if (product == null || user == null) continue;

            InventoryLog.AdjustmentType type = parseEnum(
                    InventoryLog.AdjustmentType.class,
                    text(node, "adjustmentType"),
                    InventoryLog.AdjustmentType.ADJUSTMENT
            );

            int quantityChange = intVal(node, "quantityChange", 0);
            int previousQuantity = intVal(node, "previousQuantity", 0);
            int newQuantity = intVal(node, "newQuantity", 0);
            String reason = blankToNull(text(node, "reason"));

            boolean exists = inventoryLogRepository
                    .existsByProductIdAndUserIdAndAdjustmentTypeAndQuantityChangeAndPreviousQuantityAndNewQuantityAndReason(
                            product.getId(),
                            user.getId(),
                            type,
                            quantityChange,
                            previousQuantity,
                            newQuantity,
                            reason
                    );
            if (exists) continue;

            InventoryLog log = new InventoryLog();
            log.setProduct(product);
            log.setUser(user);
            log.setAdjustmentType(type);
            log.setQuantityChange(quantityChange);
            log.setPreviousQuantity(previousQuantity);
            log.setNewQuantity(newQuantity);
            log.setReason(reason);
            log.setCreatedAt(parseInstant(node.path("createdAt").asText(null), null));
            inventoryLogRepository.save(log);
            imported++;
        }
        return imported;
    }

    private String text(JsonNode node, String field) {
        JsonNode value = node.path(field);
        if (value.isMissingNode() || value.isNull()) return null;
        String s = value.asText();
        return s.isBlank() ? null : s;
    }

    private String text(JsonNode node, String field, String fallback) {
        String value = text(node, field);
        return value == null ? fallback : value;
    }

    private Integer intVal(JsonNode node, String field, int fallback) {
        JsonNode value = node.path(field);
        if (value.isMissingNode() || value.isNull()) return fallback;
        return value.asInt(fallback);
    }

    private Long longVal(JsonNode node, String field) {
        JsonNode value = node.path(field);
        if (value.isMissingNode() || value.isNull()) return null;
        if (value.isNumber()) return value.asLong();
        try {
            return Long.parseLong(value.asText());
        } catch (Exception ignored) {
            return null;
        }
    }

    private BigDecimal decimalVal(JsonNode node, String field, BigDecimal fallback) {
        JsonNode value = node.path(field);
        if (value.isMissingNode() || value.isNull()) return fallback;
        try {
            return new BigDecimal(value.asText());
        } catch (Exception ignored) {
            return fallback;
        }
    }

    private Instant parseInstant(String value, Instant fallback) {
        if (value == null || value.isBlank()) return fallback;
        try {
            return Instant.parse(value);
        } catch (Exception ignored) {
            return fallback;
        }
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value;
    }

    private <E extends Enum<E>> E parseEnum(Class<E> enumType, String value, E fallback) {
        if (value == null || value.isBlank()) return fallback;
        try {
            return Enum.valueOf(enumType, value.trim().toUpperCase(Locale.ROOT));
        } catch (Exception ignored) {
            return fallback;
        }
    }

    public record ImportSummary(
            int usersMapped,
            int categoriesMapped,
            int productsMapped,
            int customersMapped,
            int salesImported,
            int paymentsImported,
            int inventoryLogsImported,
            int salesSkipped,
            int saleItemsSkipped
    ) {}

    private record ImportCounters(
            Map<Long, Sale> saleByLegacyId,
            Set<String> importedSaleNumbers,
            int importedSales,
            int skippedSales,
            int skippedSaleItems
    ) {}
}
