package com.iolabs.salescore.service;

import com.iolabs.salescore.dto.request.CancelPurchaseOrderRequest;
import com.iolabs.salescore.dto.request.CreatePurchaseOrderRequest;
import com.iolabs.salescore.dto.request.GenerateLowStockPurchaseOrderRequest;
import com.iolabs.salescore.dto.request.ReceivePurchaseOrderRequest;
import com.iolabs.salescore.dto.request.RestockRequest;
import com.iolabs.salescore.dto.response.LowStockReorderSuggestionResponse;
import com.iolabs.salescore.dto.response.PurchaseOrderResponse;
import com.iolabs.salescore.exception.ApiException;
import com.iolabs.salescore.exception.ResourceNotFoundException;
import com.iolabs.salescore.model.*;
import com.iolabs.salescore.repository.ProductRepository;
import com.iolabs.salescore.repository.PurchaseOrderRepository;
import com.iolabs.salescore.repository.SupplierRepository;
import com.iolabs.salescore.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.concurrent.atomic.AtomicInteger;

@Service
@RequiredArgsConstructor
public class PurchaseOrderService {

    private final PurchaseOrderRepository purchaseOrderRepository;
    private final SupplierRepository supplierRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final InventoryService inventoryService;

    private static final AtomicInteger SEQ = new AtomicInteger(1);

    private static final List<PurchaseOrder.Status> OPEN_FOR_DELIVERY = List.of(
            PurchaseOrder.Status.APPROVED,
            PurchaseOrder.Status.PARTIALLY_RECEIVED
    );

    public List<PurchaseOrderResponse> getAll(Long supplierId, String statusRaw, boolean overdueOnly) {
        PurchaseOrder.Status status = parseStatus(statusRaw);
        List<PurchaseOrder> list = overdueOnly
                ? purchaseOrderRepository.findOverdueWithFilters(
                supplierId,
                status,
                LocalDate.now(ZoneId.systemDefault()),
                OPEN_FOR_DELIVERY
        )
                : purchaseOrderRepository.findAllWithFilters(supplierId, status);
        return list.stream().map(this::toResponse).toList();
    }

    public byte[] exportCsv(Long supplierId, String statusRaw, boolean overdueOnly) {
        List<PurchaseOrderResponse> rows = getAll(supplierId, statusRaw, overdueOnly);
        String header = "id,poNumber,supplierName,status,expectedDate,overdue,itemCount,totalOrderedQty,totalReceivedQty,createdAt,notes";
        String body = rows.stream().map(this::poCsvLine).reduce((a, b) -> a + "\n" + b).orElse("");
        String csv = header + (body.isEmpty() ? "" : "\n" + body);
        return csv.getBytes(StandardCharsets.UTF_8);
    }

    private String poCsvLine(PurchaseOrderResponse po) {
        int totalOrdered = po.items().stream().mapToInt(PurchaseOrderResponse.Item::orderedQuantity).sum();
        int totalReceived = po.items().stream().mapToInt(PurchaseOrderResponse.Item::receivedQuantity).sum();
        return String.join(",",
                csv(po.id()),
                csv(po.poNumber()),
                csv(po.supplierName()),
                csv(po.status()),
                csv(po.expectedDate()),
                csv(po.overdue()),
                csv(po.items().size()),
                csv(totalOrdered),
                csv(totalReceived),
                csv(po.createdAt()),
                csv(po.notes())
        );
    }

    private String csv(Object v) {
        if (v == null) return "";
        String s = String.valueOf(v);
        if (s.contains("\"")) s = s.replace("\"", "\"\"");
        if (s.contains(",") || s.contains("\n") || s.contains("\r")) return "\"" + s + "\"";
        return s;
    }

    private PurchaseOrder.Status parseStatus(String statusRaw) {
        if (statusRaw == null || statusRaw.isBlank()) return null;
        try {
            return PurchaseOrder.Status.valueOf(statusRaw.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Invalid status: " + statusRaw);
        }
    }

    public PurchaseOrderResponse getById(Long id) {
        PurchaseOrder po = purchaseOrderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("PurchaseOrder", id));
        return toResponse(po);
    }

    public List<LowStockReorderSuggestionResponse> getLowStockReorderSuggestions() {
        return productRepository.findLowStockProducts().stream()
                .map(p -> new LowStockReorderSuggestionResponse(
                        p.getId(),
                        p.getName(),
                        p.getQuantity(),
                        p.getLowStockThreshold(),
                        suggestedOrderQty(p),
                        p.getCostPrice()
                ))
                .toList();
    }

    @Transactional
    public PurchaseOrderResponse create(CreatePurchaseOrderRequest request, Long userId) {
        Supplier supplier = supplierRepository.findById(request.supplierId())
                .orElseThrow(() -> new ResourceNotFoundException("Supplier", request.supplierId()));
        if (!supplier.isActive()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Supplier is inactive");
        }
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));

        PurchaseOrder po = PurchaseOrder.builder()
                .poNumber(generatePoNumber())
                .supplier(supplier)
                .status(PurchaseOrder.Status.DRAFT)
                .createdBy(user)
                .expectedDate(request.expectedDate())
                .notes(request.notes())
                .build();

        List<PurchaseOrderItem> items = new ArrayList<>();
        for (CreatePurchaseOrderRequest.Item itemReq : request.items()) {
            Product product = productRepository.findById(itemReq.productId())
                    .orElseThrow(() -> new ResourceNotFoundException("Product", itemReq.productId()));
            PurchaseOrderItem item = PurchaseOrderItem.builder()
                    .purchaseOrder(po)
                    .product(product)
                    .orderedQuantity(itemReq.quantity())
                    .receivedQuantity(0)
                    .unitCost(itemReq.unitCost())
                    .build();
            items.add(item);
        }
        po.getItems().addAll(items);
        PurchaseOrder saved = purchaseOrderRepository.save(po);
        PurchaseOrder loaded = purchaseOrderRepository.findById(saved.getId()).orElse(saved);
        return toResponse(loaded);
    }

    @Transactional
    public PurchaseOrderResponse createFromLowStock(GenerateLowStockPurchaseOrderRequest request, Long userId) {
        Supplier supplier = supplierRepository.findById(request.supplierId())
                .orElseThrow(() -> new ResourceNotFoundException("Supplier", request.supplierId()));
        if (!supplier.isActive()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Supplier is inactive");
        }
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));

        Map<Long, Product> lowStockProducts = productRepository.findLowStockProducts().stream()
                .collect(java.util.stream.Collectors.toMap(Product::getId, p -> p));
        if (lowStockProducts.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "No low-stock products found");
        }

        Map<Long, Integer> orderQtyByProductId = new LinkedHashMap<>();
        if (request.items() == null || request.items().isEmpty()) {
            for (Product p : lowStockProducts.values()) {
                orderQtyByProductId.put(p.getId(), suggestedOrderQty(p));
            }
        } else {
            for (GenerateLowStockPurchaseOrderRequest.Item item : request.items()) {
                Product p = lowStockProducts.get(item.productId());
                if (p == null) {
                    throw new ApiException(HttpStatus.BAD_REQUEST, "Product is not currently low-stock: " + item.productId());
                }
                orderQtyByProductId.merge(item.productId(), item.quantity(), Integer::sum);
            }
        }

        PurchaseOrder po = PurchaseOrder.builder()
                .poNumber(generatePoNumber())
                .supplier(supplier)
                .status(PurchaseOrder.Status.DRAFT)
                .createdBy(user)
                .expectedDate(request.expectedDate())
                .notes(request.notes())
                .build();

        List<PurchaseOrderItem> items = new ArrayList<>();
        for (Map.Entry<Long, Integer> e : orderQtyByProductId.entrySet()) {
            Product product = lowStockProducts.get(e.getKey());
            PurchaseOrderItem item = PurchaseOrderItem.builder()
                    .purchaseOrder(po)
                    .product(product)
                    .orderedQuantity(e.getValue())
                    .receivedQuantity(0)
                    .unitCost(product.getCostPrice())
                    .build();
            items.add(item);
        }
        po.getItems().addAll(items);

        PurchaseOrder saved = purchaseOrderRepository.save(po);
        PurchaseOrder loaded = purchaseOrderRepository.findById(saved.getId()).orElse(saved);
        return toResponse(loaded);
    }

    @Transactional
    public PurchaseOrderResponse approve(Long id, Long userId) {
        PurchaseOrder po = purchaseOrderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("PurchaseOrder", id));
        if (po.getStatus() != PurchaseOrder.Status.DRAFT) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Only DRAFT purchase orders can be approved");
        }
        User approver = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));
        po.setStatus(PurchaseOrder.Status.APPROVED);
        po.setApprovedBy(approver);
        return toResponse(purchaseOrderRepository.save(po));
    }

    @Transactional
    public PurchaseOrderResponse receive(Long id, ReceivePurchaseOrderRequest request, Long userId) {
        PurchaseOrder po = purchaseOrderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("PurchaseOrder", id));
        if (po.getStatus() != PurchaseOrder.Status.APPROVED && po.getStatus() != PurchaseOrder.Status.PARTIALLY_RECEIVED) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Only APPROVED or PARTIALLY_RECEIVED orders can receive stock");
        }

        Map<Long, PurchaseOrderItem> itemsById = new HashMap<>();
        for (PurchaseOrderItem item : po.getItems()) {
            itemsById.put(item.getId(), item);
        }

        boolean changed = false;
        for (ReceivePurchaseOrderRequest.Item receiveItem : request.items()) {
            PurchaseOrderItem poItem = itemsById.get(receiveItem.purchaseOrderItemId());
            if (poItem == null) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "Item does not belong to this purchase order: " + receiveItem.purchaseOrderItemId());
            }
            int remaining = poItem.getOrderedQuantity() - poItem.getReceivedQuantity();
            if (receiveItem.quantityReceived() > remaining) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "Received quantity exceeds remaining for product: " + poItem.getProduct().getName());
            }
            if (receiveItem.quantityReceived() <= 0) continue;
            changed = true;

            poItem.setReceivedQuantity(poItem.getReceivedQuantity() + receiveItem.quantityReceived());

            String note = "PO " + po.getPoNumber()
                    + (request.notes() != null && !request.notes().isBlank() ? " - " + request.notes().trim() : "");

            inventoryService.restock(new RestockRequest(
                    poItem.getProduct().getId(),
                    po.getSupplier().getId(),
                    receiveItem.quantityReceived(),
                    poItem.getUnitCost(),
                    request.referenceNumber(),
                    note
            ), userId);
        }

        if (!changed) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "No valid receive quantities were provided");
        }

        boolean fullyReceived = po.getItems().stream()
                .allMatch(i -> i.getReceivedQuantity() >= i.getOrderedQuantity());
        po.setStatus(fullyReceived ? PurchaseOrder.Status.RECEIVED : PurchaseOrder.Status.PARTIALLY_RECEIVED);
        return toResponse(purchaseOrderRepository.save(po));
    }

    @Transactional
    public PurchaseOrderResponse close(Long id) {
        PurchaseOrder po = purchaseOrderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("PurchaseOrder", id));
        if (po.getStatus() != PurchaseOrder.Status.RECEIVED && po.getStatus() != PurchaseOrder.Status.PARTIALLY_RECEIVED) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "Only RECEIVED or PARTIALLY_RECEIVED purchase orders can be closed");
        }
        po.setStatus(PurchaseOrder.Status.CLOSED);
        return toResponse(purchaseOrderRepository.save(po));
    }

    @Transactional
    public PurchaseOrderResponse cancel(Long id, CancelPurchaseOrderRequest request) {
        PurchaseOrder po = purchaseOrderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("PurchaseOrder", id));
        if (po.getStatus() == PurchaseOrder.Status.CANCELLED || po.getStatus() == PurchaseOrder.Status.CLOSED) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Purchase order is already finalised");
        }
        if (po.getStatus() == PurchaseOrder.Status.PARTIALLY_RECEIVED || po.getStatus() == PurchaseOrder.Status.RECEIVED) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "Cannot cancel a purchase order that has received stock; close it instead if needed");
        }
        if (po.getStatus() == PurchaseOrder.Status.APPROVED) {
            boolean anyReceived = po.getItems().stream()
                    .anyMatch(i -> i.getReceivedQuantity() != null && i.getReceivedQuantity() > 0);
            if (anyReceived) {
                throw new ApiException(HttpStatus.BAD_REQUEST,
                        "Cannot cancel after stock has been received; use Receive or Close workflows");
            }
        }
        String note = request != null && request.notes() != null && !request.notes().isBlank()
                ? "Cancelled: " + request.notes().trim()
                : "Cancelled";
        if (po.getNotes() == null || po.getNotes().isBlank()) {
            po.setNotes(note);
        } else {
            po.setNotes(po.getNotes() + "\n" + note);
        }
        po.setStatus(PurchaseOrder.Status.CANCELLED);
        return toResponse(purchaseOrderRepository.save(po));
    }

    private String generatePoNumber() {
        String date = DateTimeFormatter.ofPattern("yyyyMMdd")
                .withZone(ZoneId.systemDefault())
                .format(Instant.now());
        String seq;
        do {
            seq = String.format("%04d", SEQ.getAndIncrement());
        } while (purchaseOrderRepository.existsByPoNumber("PO-" + date + "-" + seq));
        return "PO-" + date + "-" + seq;
    }

    private int suggestedOrderQty(Product p) {
        int threshold = p.getLowStockThreshold() != null ? p.getLowStockThreshold() : 0;
        int target = threshold * 2;
        int current = p.getQuantity() != null ? p.getQuantity() : 0;
        return Math.max(target - current, 1);
    }

    private boolean computeOverdue(PurchaseOrder po) {
        if (po.getExpectedDate() == null) return false;
        if (po.getStatus() != PurchaseOrder.Status.APPROVED && po.getStatus() != PurchaseOrder.Status.PARTIALLY_RECEIVED) {
            return false;
        }
        return po.getExpectedDate().isBefore(LocalDate.now(ZoneId.systemDefault()));
    }

    private PurchaseOrderResponse toResponse(PurchaseOrder po) {
        return new PurchaseOrderResponse(
                po.getId(),
                po.getPoNumber(),
                po.getStatus().name(),
                po.getSupplier().getId(),
                po.getSupplier().getName(),
                po.getExpectedDate(),
                computeOverdue(po),
                po.getNotes(),
                po.getCreatedBy().getId(),
                po.getCreatedBy().getFullName(),
                po.getApprovedBy() != null ? po.getApprovedBy().getId() : null,
                po.getApprovedBy() != null ? po.getApprovedBy().getFullName() : null,
                po.getCreatedAt(),
                po.getUpdatedAt(),
                po.getItems().stream().map(i -> new PurchaseOrderResponse.Item(
                        i.getId(),
                        i.getProduct().getId(),
                        i.getProduct().getName(),
                        i.getOrderedQuantity(),
                        i.getReceivedQuantity(),
                        i.getOrderedQuantity() - i.getReceivedQuantity(),
                        i.getUnitCost()
                )).toList()
        );
    }
}
