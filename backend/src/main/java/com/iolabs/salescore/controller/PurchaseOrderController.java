package com.iolabs.salescore.controller;

import com.iolabs.salescore.dto.request.CreatePurchaseOrderRequest;
import com.iolabs.salescore.dto.request.ReceivePurchaseOrderRequest;
import com.iolabs.salescore.dto.response.PurchaseOrderResponse;
import com.iolabs.salescore.security.AppUserDetails;
import com.iolabs.salescore.service.PurchaseOrderService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/purchase-orders")
@RequiredArgsConstructor
@Tag(name = "Purchase Orders")
@PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
public class PurchaseOrderController {

    private final PurchaseOrderService purchaseOrderService;

    @GetMapping
    public ResponseEntity<List<PurchaseOrderResponse>> getAll(
            @RequestParam(required = false) Long supplierId,
            @RequestParam(required = false) String status
    ) {
        return ResponseEntity.ok(purchaseOrderService.getAll(supplierId, status));
    }

    @GetMapping("/{id}")
    public ResponseEntity<PurchaseOrderResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(purchaseOrderService.getById(id));
    }

    @PostMapping
    public ResponseEntity<PurchaseOrderResponse> create(
            @Valid @RequestBody CreatePurchaseOrderRequest request,
            @AuthenticationPrincipal AppUserDetails user
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(purchaseOrderService.create(request, user.getId()));
    }

    @PostMapping("/{id}/approve")
    public ResponseEntity<PurchaseOrderResponse> approve(
            @PathVariable Long id,
            @AuthenticationPrincipal AppUserDetails user
    ) {
        return ResponseEntity.ok(purchaseOrderService.approve(id, user.getId()));
    }

    @PostMapping("/{id}/receive")
    public ResponseEntity<PurchaseOrderResponse> receive(
            @PathVariable Long id,
            @Valid @RequestBody ReceivePurchaseOrderRequest request,
            @AuthenticationPrincipal AppUserDetails user
    ) {
        return ResponseEntity.ok(purchaseOrderService.receive(id, request, user.getId()));
    }
}
