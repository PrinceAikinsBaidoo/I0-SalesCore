package com.iolabs.salescore.controller;

import com.iolabs.salescore.dto.request.BootstrapRequest;
import com.iolabs.salescore.dto.request.LoginRequest;
import com.iolabs.salescore.dto.response.AuthResponse;
import com.iolabs.salescore.security.AppUserDetails;
import com.iolabs.salescore.service.AuthService;
import com.iolabs.salescore.service.BootstrapService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "Login, logout, and token management")
public class AuthController {

    private final AuthService authService;
    private final BootstrapService bootstrapService;

    @PostMapping("/bootstrap")
    @Operation(summary = "Create first ADMIN when none exists (requires APP_BOOTSTRAP_TOKEN)")
    public ResponseEntity<Map<String, Object>> bootstrap(@Valid @RequestBody BootstrapRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(bootstrapService.createFirstAdmin(request));
    }

    @PostMapping("/login")
    @Operation(summary = "Authenticate user and return JWT tokens")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @GetMapping("/me")
    @Operation(summary = "Get current authenticated user profile")
    public ResponseEntity<Map<String, Object>> me(@AuthenticationPrincipal AppUserDetails user) {
        return ResponseEntity.ok(Map.of(
                "id", user.getId(),
                "username", user.getUsername(),
                "fullName", user.getFullName(),
                "role", user.getRole()
        ));
    }

    @PostMapping("/logout")
    @Operation(summary = "Logout (client-side token removal)")
    public ResponseEntity<Map<String, String>> logout() {
        return ResponseEntity.ok(Map.of("message", "Logged out successfully"));
    }
}
