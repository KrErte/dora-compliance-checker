package com.dorachecker.controller;

import com.dorachecker.model.UserEntity;
import com.dorachecker.model.UserRepository;
import com.dorachecker.security.AuthDtos.AuthResponse;
import com.dorachecker.security.AuthDtos.LoginRequest;
import com.dorachecker.security.AuthDtos.RegisterRequest;
import com.dorachecker.security.JwtService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthController(UserRepository userRepository,
                          PasswordEncoder passwordEncoder,
                          JwtService jwtService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Email already registered"));
        }

        UserEntity user = new UserEntity();
        user.setEmail(request.email());
        user.setPassword(passwordEncoder.encode(request.password()));
        user.setFullName(request.fullName());
        user.setCreatedAt(LocalDateTime.now());
        user.setAccountTier(UserEntity.AccountTier.FREE);
        user.setTrialEndsAt(LocalDateTime.now().plusDays(14));

        userRepository.save(user);

        String token = jwtService.generateToken(user.getId(), user.getEmail(), user.getRole().name());
        return ResponseEntity.ok(new AuthResponse(
            token,
            user.getId(),
            user.getEmail(),
            user.getFullName(),
            user.isEarlyAdopter(),
            user.getEarlyAdopterNumber(),
            user.getAccountTier().name(),
            user.getTrialEndsAt(),
            user.getRole().name()
        ));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request) {
        Optional<UserEntity> userOpt = userRepository.findByEmail(request.email());
        if (userOpt.isEmpty() ||
                !passwordEncoder.matches(request.password(), userOpt.get().getPassword())) {
            return ResponseEntity.status(401)
                    .body(Map.of("error", "Invalid email or password"));
        }

        UserEntity user = userOpt.get();

        String token = jwtService.generateToken(user.getId(), user.getEmail(), user.getRole().name());
        return ResponseEntity.ok(new AuthResponse(
            token,
            user.getId(),
            user.getEmail(),
            user.getFullName(),
            user.isEarlyAdopter(),
            user.getEarlyAdopterNumber(),
            user.getAccountTier().name(),
            user.getTrialEndsAt(),
            user.getRole().name()
        ));
    }

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));
        }
        String userId = (String) authentication.getPrincipal();
        return userRepository.findById(userId)
                .map(user -> ResponseEntity.ok(new AuthResponse(
                        null,
                        user.getId(),
                        user.getEmail(),
                        user.getFullName(),
                        user.isEarlyAdopter(),
                        user.getEarlyAdopterNumber(),
                        user.getAccountTier().name(),
                        user.getTrialEndsAt(),
                        user.getRole().name()
                    )))
                .orElse(ResponseEntity.status(401).body(null));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        if (email == null || email.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email is required"));
        }

        // Check if user exists (but always return success to prevent email enumeration)
        Optional<UserEntity> userOpt = userRepository.findByEmail(email.trim());

        if (userOpt.isPresent()) {
            // TODO: Generate reset token and send email
            // For now, log the request
            // In production: generate UUID token, save to DB with 1h expiry, send email
            System.out.println("Password reset requested for: " + email);
        }

        // Always return success to prevent email enumeration
        return ResponseEntity.ok(Map.of(
            "success", true,
            "message", "If an account with this email exists, a reset link has been sent."
        ));
    }
}
