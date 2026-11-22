package com.foundit.auth;

public record AuthResponse(
        String token,
        String tokenType,
        long expiresInHours,
        Long id,
        String name,
        String email,
        String role) {
}
