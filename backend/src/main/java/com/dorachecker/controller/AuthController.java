package com.dorachecker.controller;

import com.dorachecker.model.UserEntity;
import com.dorachecker.model.UserRepository;
import com.dorachecker.security.AuthDtos.AuthResponse;
import com.dorachecker.security.AuthDtos.LoginRequest;
import com.dorachecker.security.AuthDtos.RegisterRequest;
import com.dorachecker.security.JwtService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    @Value("${promo.trial.days:30}")
    private int trialDays;

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
        user.setAccountTier(UserEntity.AccountTier.PREMIUM);
        user.setTrialEndDate(LocalDate.now().plusDays(trialDays));

        userRepository.save(user);

        String token = jwtService.generateToken(user.getId(), user.getEmail());
        return ResponseEntity.ok(new AuthResponse(
            token,
            user.getId(),
            user.getEmail(),
            user.getFullName(),
            user.isEarlyAdopter(),
            user.getEarlyAdopterNumber(),
            user.getAccountTier().name(),
            user.getTrialEndDate()
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

        // Check if trial has expired
        if (!user.isTrialActive() && user.getAccountTier() == UserEntity.AccountTier.PREMIUM) {
            user.setAccountTier(UserEntity.AccountTier.FREE);
            userRepository.save(user);
        }

        String token = jwtService.generateToken(user.getId(), user.getEmail());
        return ResponseEntity.ok(new AuthResponse(
            token,
            user.getId(),
            user.getEmail(),
            user.getFullName(),
            user.isEarlyAdopter(),
            user.getEarlyAdopterNumber(),
            user.getAccountTier().name(),
            user.getTrialEndDate()
        ));
    }

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));
        }
        String userId = (String) authentication.getPrincipal();
        return userRepository.findById(userId)
                .map(user -> {
                    // Check if trial has expired
                    if (!user.isTrialActive() && user.getAccountTier() == UserEntity.AccountTier.PREMIUM) {
                        user.setAccountTier(UserEntity.AccountTier.FREE);
                        userRepository.save(user);
                    }
                    return ResponseEntity.ok(new AuthResponse(
                        null,
                        user.getId(),
                        user.getEmail(),
                        user.getFullName(),
                        user.isEarlyAdopter(),
                        user.getEarlyAdopterNumber(),
                        user.getAccountTier().name(),
                        user.getTrialEndDate()
                    ));
                })
                .orElse(ResponseEntity.status(401).body(null));
    }
}
