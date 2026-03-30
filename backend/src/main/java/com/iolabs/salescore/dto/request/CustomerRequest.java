package com.iolabs.salescore.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CustomerRequest(
        @NotBlank(message = "Customer name is required")
        @Size(max = 100)
        String name,

        @Email(message = "Invalid email")
        String email,

        String phone,
        String address
) {}
