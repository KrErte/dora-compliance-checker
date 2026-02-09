package com.dorachecker.security;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;

public class AuthDtos {

    public record RegisterRequest(
            @NotBlank @Email String email,
            @NotBlank @Size(min = 6) String password,
            @NotBlank String fullName
    ) {}

    public record LoginRequest(
            @NotBlank @Email String email,
            @NotBlank String password
    ) {}

    public record AuthResponse(
            String token,
            String userId,
            String email,
            String fullName,
            boolean earlyAdopter,
            Integer earlyAdopterNumber,
            String accountTier,
            LocalDate trialEndDate
    ) {
        // Backward compatible constructor
        public AuthResponse(String token, String userId, String email, String fullName) {
            this(token, userId, email, fullName, false, null, "FREE", null);
        }
    }
}
