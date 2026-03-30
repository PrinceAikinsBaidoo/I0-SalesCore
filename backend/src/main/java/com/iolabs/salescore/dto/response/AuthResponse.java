package com.iolabs.salescore.dto.response;

public record AuthResponse(
        String accessToken,
        String refreshToken,
        String tokenType,
        Long userId,
        String username,
        String fullName,
        String role
) {
    public AuthResponse(String accessToken, String refreshToken, Long userId, String username, String fullName, String role) {
        this(accessToken, refreshToken, "Bearer", userId, username, fullName, role);
    }
}
