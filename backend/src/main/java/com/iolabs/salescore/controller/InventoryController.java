package com.iolabs.salescore.controller;

import com.iolabs.salescore.dto.request.InventoryAdjustRequest;
import com.iolabs.salescore.dto.request.RestockRequest;
import com.iolabs.salescore.dto.response.RestockRecordResponse;
import com.iolabs.salescore.model.InventoryLog;
import com.iolabs.salescore.security.AppUserDetails;
import com.iolabs.salescore.service.InventoryService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/inventory")
@RequiredArgsConstructor
@Tag(name = "Inventory")
public class InventoryController {

    private final InventoryService inventoryService;

    @GetMapping("/logs")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<Page<InventoryLog>> getLogs(
            @RequestParam(required = false) Long productId,
            @RequestParam(required = false) String type,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return ResponseEntity.ok(inventoryService.getLogs(productId, type,
                PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"))));
    }

    @PostMapping("/adjust")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<InventoryLog> adjust(
            @Valid @RequestBody InventoryAdjustRequest request,
            @AuthenticationPrincipal AppUserDetails user
    ) {
        return ResponseEntity.ok(inventoryService.adjust(request, user.getId()));
    }

    @GetMapping("/restocks")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<Page<RestockRecordResponse>> getRestockHistory(
            @RequestParam(required = false) Long productId,
            @RequestParam(required = false) Long supplierId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return ResponseEntity.ok(inventoryService.getRestockHistory(
                productId,
                supplierId,
                PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"))
        ));
    }

    @PostMapping("/restock")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<RestockRecordResponse> restock(
            @Valid @RequestBody RestockRequest request,
            @AuthenticationPrincipal AppUserDetails user
    ) {
        return ResponseEntity.ok(inventoryService.restock(request, user.getId()));
    }
}
