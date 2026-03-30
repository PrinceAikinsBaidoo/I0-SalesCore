package com.iolabs.salescore.dto.request;

import jakarta.validation.constraints.*;

public record CreateUserRequest(
        @NotBlank @Size(min = 3, max = 50)
        String username,

        @NotBlank @Email
        String email,

        @NotBlank @Size(min = 6, message = "Password must be at least 6 characters")
        String password,

        @NotBlank
        String fullName,

        String phone,

        @NotBlank @Pattern(regexp = "ADMIN|MANAGER|CASHIER", message = "Role must be ADMIN, MANAGER, or CASHIER")
        String role
) {}
