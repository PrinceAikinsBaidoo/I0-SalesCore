package com.iolabs.salescore.service;

import com.iolabs.salescore.dto.request.InventoryAdjustRequest;
import com.iolabs.salescore.dto.request.RestockRequest;
import com.iolabs.salescore.dto.response.RestockRecordResponse;
import com.iolabs.salescore.exception.ApiException;
import com.iolabs.salescore.model.InventoryLog;
import com.iolabs.salescore.model.Product;
import com.iolabs.salescore.model.RestockRecord;
import com.iolabs.salescore.model.Supplier;
import com.iolabs.salescore.model.User;
import com.iolabs.salescore.repository.InventoryLogRepository;
import com.iolabs.salescore.repository.ProductRepository;
import com.iolabs.salescore.repository.RestockRecordRepository;
import com.iolabs.salescore.repository.SupplierRepository;
import com.iolabs.salescore.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class InventoryService {

    private final InventoryLogRepository inventoryLogRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final SupplierRepository supplierRepository;
    private final RestockRecordRepository restockRecordRepository;

    public Page<InventoryLog> getLogs(Long productId, String type, Pageable pageable) {
        InventoryLog.AdjustmentType adjustmentType = null;
        if (type != null) {
            try { adjustmentType = InventoryLog.AdjustmentType.valueOf(type.toUpperCase()); }
            catch (IllegalArgumentException ignored) {}
        }
        return inventoryLogRepository.findLogs(productId, adjustmentType, pageable);
    }

    @Transactional
    public InventoryLog adjust(InventoryAdjustRequest request, Long userId) {
        Product product = productRepository.findById(request.productId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Product not found"));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found"));

        InventoryLog.AdjustmentType type;
        try { type = InventoryLog.AdjustmentType.valueOf(request.adjustmentType().toUpperCase()); }
        catch (IllegalArgumentException e) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Invalid adjustment type: " + request.adjustmentType());
        }

        int previous = product.getQuantity();
        int newQty = previous + request.quantityChange();
        if (newQty < 0) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Insufficient stock. Available: " + previous);
        }

        product.setQuantity(newQty);
        productRepository.save(product);

        InventoryLog log = InventoryLog.builder()
                .product(product)
                .adjustmentType(type)
                .quantityChange(request.quantityChange())
                .previousQuantity(previous)
                .newQuantity(newQty)
                .reason(request.reason())
                .user(user)
                .build();

        return inventoryLogRepository.save(log);
    }

    @Transactional
    public void deductStock(Product product, int quantity, User user, Long saleId) {
        int previous = product.getQuantity();
        int newQty = previous - quantity;
        if (newQty < 0) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "Insufficient stock for product: " + product.getName() + ". Available: " + previous);
        }
        product.setQuantity(newQty);
        productRepository.save(product);

        InventoryLog log = InventoryLog.builder()
                .product(product)
                .adjustmentType(InventoryLog.AdjustmentType.SALE)
                .quantityChange(-quantity)
                .previousQuantity(previous)
                .newQuantity(newQty)
                .reason("Sale #" + saleId)
                .user(user)
                .build();
        inventoryLogRepository.save(log);
    }

    @Transactional
    public void restockFromReturn(Product product, int quantity, User user, Long saleId, Long saleItemId, String reason) {
        int previous = product.getQuantity();
        int newQty = previous + quantity;
        product.setQuantity(newQty);
        productRepository.save(product);

        String finalReason = reason != null && !reason.isBlank()
                ? "Refund #" + saleId + " item#" + saleItemId + " - " + reason
                : "Refund #" + saleId + " item#" + saleItemId;

        InventoryLog log = InventoryLog.builder()
                .product(product)
                .adjustmentType(InventoryLog.AdjustmentType.RETURN)
                .quantityChange(quantity)
                .previousQuantity(previous)
                .newQuantity(newQty)
                .reason(finalReason)
                .user(user)
                .build();
        inventoryLogRepository.save(log);
    }

    public Page<RestockRecordResponse> getRestockHistory(Long productId, Long supplierId, Pageable pageable) {
        return restockRecordRepository.findHistory(productId, supplierId, pageable)
                .map(this::toRestockResponse);
    }

    @Transactional
    public RestockRecordResponse restock(RestockRequest request, Long userId) {
        Product product = productRepository.findById(request.productId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Product not found"));
        Supplier supplier = supplierRepository.findById(request.supplierId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Supplier not found"));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found"));

        int previous = product.getQuantity();
        int newQty = previous + request.quantity();
        product.setQuantity(newQty);
        if (request.unitCost() != null && request.unitCost().signum() >= 0) {
            product.setCostPrice(request.unitCost());
        }
        productRepository.save(product);

        RestockRecord record = RestockRecord.builder()
                .product(product)
                .supplier(supplier)
                .quantity(request.quantity())
                .unitCost(request.unitCost())
                .referenceNumber(request.referenceNumber())
                .notes(request.notes())
                .restockedBy(user)
                .build();
        RestockRecord saved = restockRecordRepository.save(record);

        String reason = "Supplier restock: " + supplier.getName()
                + (request.referenceNumber() != null && !request.referenceNumber().isBlank()
                ? " (ref: " + request.referenceNumber().trim() + ")"
                : "");
        InventoryLog log = InventoryLog.builder()
                .product(product)
                .adjustmentType(InventoryLog.AdjustmentType.RESTOCK)
                .quantityChange(request.quantity())
                .previousQuantity(previous)
                .newQuantity(newQty)
                .reason(reason)
                .user(user)
                .build();
        inventoryLogRepository.save(log);

        return toRestockResponse(saved);
    }

    private RestockRecordResponse toRestockResponse(RestockRecord r) {
        return new RestockRecordResponse(
                r.getId(),
                r.getProduct().getId(),
                r.getProduct().getName(),
                r.getSupplier().getId(),
                r.getSupplier().getName(),
                r.getQuantity(),
                r.getUnitCost(),
                r.getReferenceNumber(),
                r.getNotes(),
                r.getRestockedBy().getId(),
                r.getRestockedBy().getFullName(),
                r.getCreatedAt()
        );
    }
}
