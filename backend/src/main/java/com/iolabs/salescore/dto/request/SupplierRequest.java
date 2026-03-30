package com.iolabs.salescore.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record SupplierRequest(
        @NotBlank(message = "Supplier name is required")
        @Size(max = 150)
        String name,
        @Size(max = 120)
        String contactPerson,
        @Size(max = 30)
        String phone,
        @Size(max = 120)
        String email,
        String address,
        String notes
) {}
