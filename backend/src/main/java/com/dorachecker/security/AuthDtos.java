package com.dorachecker.security;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.LocalDateTime;

public class AuthDtos {

    public record RegisterRequest(
            @NotBlank @Email @Size(max = 255) String email,
            @NotBlank @Size(min = 6, max = 128) String password,
            @NotBlank @Size(max = 100) String fullName
    ) {}

    public record LoginRequest(
            @NotBlank @Email @Size(max = 255) String email,
            @NotBlank @Size(max = 128) String password
    ) {}

    public record AuthResponse(
            String token,
            String refreshToken,
            String userId,
            String email,
            String fullName,
            boolean earlyAdopter,
            Integer earlyAdopterNumber,
            String accountTier,
            LocalDateTime trialEndsAt,
            String role
    ) {
        // Backward compatible constructor
        public AuthResponse(String token, String userId, String email, String fullName) {
            this(token, null, userId, email, fullName, false, null, "FREE", null, "USER");
        }
    }
}
