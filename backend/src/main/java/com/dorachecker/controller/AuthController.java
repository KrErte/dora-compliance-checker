package com.dorachecker.controller;

import com.dorachecker.model.UserEntity;
import com.dorachecker.model.UserRepository;
import com.dorachecker.security.AuthDtos.AuthResponse;
import com.dorachecker.security.AuthDtos.LoginRequest;
import com.dorachecker.security.AuthDtos.RegisterRequest;
import com.dorachecker.security.JwtService;
import com.dorachecker.service.ResendEmailService;
import com.dorachecker.service.UserDeletionService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private static final Logger log = LoggerFactory.getLogger(AuthController.class);
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final ResendEmailService emailService;
    private final UserDeletionService userDeletionService;
    private final String frontendUrl;
    private final int refreshExpirationDays;

    public AuthController(UserRepository userRepository,
                          PasswordEncoder passwordEncoder,
                          JwtService jwtService,
                          ResendEmailService emailService,
                          UserDeletionService userDeletionService,
                          @Value("${app.frontend-url:https://doraaudit.eu}") String frontendUrl,
                          @Value("${jwt.refresh-expiration-days:7}") int refreshExpirationDays) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.emailService = emailService;
        this.userDeletionService = userDeletionService;
        this.frontendUrl = frontendUrl;
        this.refreshExpirationDays = refreshExpirationDays;
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

        // Email verification
        String verificationToken = UUID.randomUUID().toString();
        user.setEmailVerificationToken(verificationToken);
        user.setEmailVerified(false);

        // Unsubscribe token
        user.setUnsubscribeToken(UUID.randomUUID().toString());

        userRepository.save(user);

        // Send verification email
        String verifyLink = frontendUrl + "/verify-email?token=" + verificationToken;
        String unsubLink = buildUnsubscribeLink(user);
        String html = buildVerificationEmailHtml(user.getFullName(), verifyLink, unsubLink);
        emailService.sendEmail(user.getEmail(), "Kinnita oma e-post | DoraAudit", html);

        String token = jwtService.generateToken(user.getId(), user.getEmail(), user.getRole().name());
        String refreshToken = generateAndSaveRefreshToken(user);
        return ResponseEntity.ok(new AuthResponse(
            token,
            refreshToken,
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
        log.info("Login attempt for email: {}", request.email());
        try {
        Optional<UserEntity> userOpt = userRepository.findByEmail(request.email());
        if (userOpt.isEmpty() ||
                !passwordEncoder.matches(request.password(), userOpt.get().getPassword())) {
            return ResponseEntity.status(401)
                    .body(Map.of("error", "Invalid email or password"));
        }

        UserEntity user = userOpt.get();

        String token = jwtService.generateToken(user.getId(), user.getEmail(), user.getRole().name());
        String refreshToken = generateAndSaveRefreshToken(user);
        return ResponseEntity.ok(new AuthResponse(
            token,
            refreshToken,
            user.getId(),
            user.getEmail(),
            user.getFullName(),
            user.isEarlyAdopter(),
            user.getEarlyAdopterNumber(),
            user.getAccountTier().name(),
            user.getTrialEndsAt(),
            user.getRole().name()
        ));
        } catch (Exception e) {
            log.error("Login failed for {}: {}", request.email(), e.getMessage(), e);
            return ResponseEntity.status(500).body(Map.of("error", "Login error: " + e.getMessage()));
        }
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

        Optional<UserEntity> userOpt = userRepository.findByEmail(email.trim());

        if (userOpt.isPresent()) {
            UserEntity user = userOpt.get();

            // Only LOCAL auth users can reset password
            if (user.getAuthProvider() == UserEntity.AuthProvider.LOCAL) {
                String resetToken = UUID.randomUUID().toString();
                user.setPasswordResetToken(resetToken);
                user.setPasswordResetTokenExpiresAt(LocalDateTime.now().plusHours(1));
                userRepository.save(user);

                String resetLink = frontendUrl + "/reset-password?token=" + resetToken;
                String unsubLink = buildUnsubscribeLink(user);
                String html = buildResetEmailHtml(user.getFullName(), resetLink, unsubLink);
                emailService.sendEmail(user.getEmail(), "Parooli taastamine | DoraAudit", html);
            }
        }

        // Always return success to prevent email enumeration
        return ResponseEntity.ok(Map.of(
            "success", true,
            "message", "If an account with this email exists, a reset link has been sent."
        ));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> request) {
        String token = request.get("token");
        String newPassword = request.get("password");

        if (token == null || token.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Token is required"));
        }
        if (newPassword == null || newPassword.length() < 8) {
            return ResponseEntity.badRequest().body(Map.of("error", "Password must be at least 8 characters"));
        }

        Optional<UserEntity> userOpt = userRepository.findByPasswordResetToken(token);

        if (userOpt.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid or expired reset token"));
        }

        UserEntity user = userOpt.get();

        if (user.getPasswordResetTokenExpiresAt() == null ||
                LocalDateTime.now().isAfter(user.getPasswordResetTokenExpiresAt())) {
            // Clear expired token
            user.setPasswordResetToken(null);
            user.setPasswordResetTokenExpiresAt(null);
            userRepository.save(user);
            return ResponseEntity.badRequest().body(Map.of("error", "Reset token has expired. Please request a new one."));
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        user.setPasswordResetToken(null);
        user.setPasswordResetTokenExpiresAt(null);
        userRepository.save(user);

        return ResponseEntity.ok(Map.of(
            "success", true,
            "message", "Password has been reset successfully."
        ));
    }

    @GetMapping("/verify-email")
    public ResponseEntity<?> verifyEmail(@RequestParam String token) {
        if (token == null || token.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Token is required"));
        }

        Optional<UserEntity> userOpt = userRepository.findByEmailVerificationToken(token);
        if (userOpt.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid verification token"));
        }

        UserEntity user = userOpt.get();
        user.setEmailVerified(true);
        user.setEmailVerificationToken(null);
        userRepository.save(user);

        return ResponseEntity.ok(Map.of(
            "success", true,
            "message", "Email verified successfully"
        ));
    }

    @PostMapping("/resend-verification")
    public ResponseEntity<?> resendVerification(Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));
        }

        String userId = (String) authentication.getPrincipal();
        Optional<UserEntity> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(401).body(Map.of("error", "User not found"));
        }

        UserEntity user = userOpt.get();
        if (user.isEmailVerified()) {
            return ResponseEntity.ok(Map.of("success", true, "message", "Email already verified"));
        }

        String verificationToken = UUID.randomUUID().toString();
        user.setEmailVerificationToken(verificationToken);
        userRepository.save(user);

        String verifyLink = frontendUrl + "/verify-email?token=" + verificationToken;
        String unsubLink = buildUnsubscribeLink(user);
        String html = buildVerificationEmailHtml(user.getFullName(), verifyLink, unsubLink);
        emailService.sendEmail(user.getEmail(), "Kinnita oma e-post | DoraAudit", html);

        return ResponseEntity.ok(Map.of("success", true, "message", "Verification email sent"));
    }

    @GetMapping(value = "/unsubscribe", produces = "text/html")
    public ResponseEntity<String> unsubscribe(@RequestParam String token) {
        Optional<UserEntity> userOpt = userRepository.findByUnsubscribeToken(token);
        if (userOpt.isPresent()) {
            UserEntity user = userOpt.get();
            user.setEmailOptOut(true);
            userRepository.save(user);
        }
        String html = """
                <!DOCTYPE html><html><head><meta charset="UTF-8"><title>DoraAudit</title>
                <style>body{font-family:Arial,sans-serif;display:flex;justify-content:center;align-items:center;min-height:100vh;background:#f4f4f4;margin:0;}
                .card{background:white;padding:40px;border-radius:12px;text-align:center;max-width:400px;box-shadow:0 2px 8px rgba(0,0,0,0.1);}
                h2{color:#059669;}</style></head>
                <body><div class="card"><h2>Tellimusest loobatud</h2>
                <p>Olete edukalt turunduskirjadest loobunud.</p>
                <p style="color:#6b7280;font-size:14px;">Tehingulisi e-kirju (parooli taastamine jms) saadetakse endiselt.</p>
                <a href="https://doraaudit.eu" style="color:#059669;">Tagasi DoraAudit &rarr;</a></div></body></html>
                """;
        return ResponseEntity.ok(html);
    }

    @DeleteMapping("/delete-account")
    public ResponseEntity<?> deleteAccount(Authentication authentication,
                                           @RequestHeader(value = "Authorization", required = false) String authHeader) {
        if (authentication == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));
        }

        String userId = (String) authentication.getPrincipal();
        Optional<UserEntity> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("error", "User not found"));
        }

        UserEntity user = userOpt.get();

        // Blacklist current token
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            jwtService.blacklistToken(authHeader.substring(7));
        }

        // Delete all user data
        userDeletionService.deleteUserAndAllData(userId, user.getEmail());

        return ResponseEntity.ok(Map.of("success", true, "message", "Account and all data deleted successfully"));
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(@RequestHeader(value = "Authorization", required = false) String authHeader,
                                    Authentication authentication) {
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            jwtService.blacklistToken(token);
        }
        // Clear refresh token
        if (authentication != null) {
            String userId = (String) authentication.getPrincipal();
            userRepository.findById(userId).ifPresent(user -> {
                user.setRefreshToken(null);
                user.setRefreshTokenExpiresAt(null);
                userRepository.save(user);
            });
        }
        return ResponseEntity.ok(Map.of("success", true, "message", "Logged out successfully"));
    }

    @PostMapping("/refresh")
    public ResponseEntity<?> refreshToken(@RequestBody Map<String, String> request) {
        String refreshToken = request.get("refreshToken");
        if (refreshToken == null || refreshToken.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Refresh token is required"));
        }

        Optional<UserEntity> userOpt = userRepository.findByRefreshToken(refreshToken);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(401).body(Map.of("error", "Invalid refresh token"));
        }

        UserEntity user = userOpt.get();
        if (user.getRefreshTokenExpiresAt() == null ||
                LocalDateTime.now().isAfter(user.getRefreshTokenExpiresAt())) {
            user.setRefreshToken(null);
            user.setRefreshTokenExpiresAt(null);
            userRepository.save(user);
            return ResponseEntity.status(401).body(Map.of("error", "Refresh token expired"));
        }

        // Rotate refresh token
        String newAccessToken = jwtService.generateToken(user.getId(), user.getEmail(), user.getRole().name());
        String newRefreshToken = generateAndSaveRefreshToken(user);

        return ResponseEntity.ok(new AuthResponse(
            newAccessToken,
            newRefreshToken,
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

    private String generateAndSaveRefreshToken(UserEntity user) {
        String refreshToken = UUID.randomUUID().toString();
        user.setRefreshToken(refreshToken);
        user.setRefreshTokenExpiresAt(LocalDateTime.now().plusDays(refreshExpirationDays));
        userRepository.save(user);
        return refreshToken;
    }

    private String buildVerificationEmailHtml(String fullName, String verifyLink, String unsubLink) {
        String name = fullName != null && !fullName.isBlank() ? fullName : "kasutaja";
        return """
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background: linear-gradient(135deg, #10b981, #06b6d4); color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center; }
                        .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px; }
                        .btn { display: inline-block; background: linear-gradient(135deg, #10b981, #06b6d4); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: bold; font-size: 16px; }
                        .footer { margin-top: 20px; font-size: 12px; color: #9ca3af; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1 style="margin: 0; font-size: 24px;">DoraAudit</h1>
                            <p style="margin: 8px 0 0; opacity: 0.9;">E-posti kinnitamine</p>
                        </div>
                        <div class="content">
                            <p>Tere, <strong>%s</strong>!</p>
                            <p>T&auml;name registreerumise eest! Palun kinnitage oma e-posti aadress, kl&otilde;psates alloleval nupul:</p>
                            <p style="text-align: center; margin: 30px 0;">
                                <a href="%s" class="btn">Kinnita e-post</a>
                            </p>
                            <p>Kui te ei registreerunud DoraAudit platvormile, ignoreerige seda kirja.</p>
                            <p class="footer">
                                Kui nupp ei t&ouml;&ouml;ta, kopeerige see link brauserisse:<br>
                                <a href="%s" style="color: #10b981; word-break: break-all;">%s</a>
                            </p>
                            <p style="text-align: center; margin-top: 20px; font-size: 11px; color: #9ca3af;">
                                <a href="%s" style="color: #9ca3af; text-decoration: underline;">Loobu turunduskirjadest</a>
                            </p>
                        </div>
                    </div>
                </body>
                </html>
                """.formatted(name, verifyLink, verifyLink, verifyLink, unsubLink);
    }

    private String buildUnsubscribeLink(UserEntity user) {
        if (user.getUnsubscribeToken() == null) {
            user.setUnsubscribeToken(UUID.randomUUID().toString());
            userRepository.save(user);
        }
        return frontendUrl + "/api/auth/unsubscribe?token=" + user.getUnsubscribeToken();
    }

    private String buildResetEmailHtml(String fullName, String resetLink, String unsubLink) {
        String name = fullName != null && !fullName.isBlank() ? fullName : "kasutaja";
        return """
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background: linear-gradient(135deg, #10b981, #06b6d4); color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center; }
                        .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px; }
                        .btn { display: inline-block; background: linear-gradient(135deg, #10b981, #06b6d4); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: bold; font-size: 16px; }
                        .footer { margin-top: 20px; font-size: 12px; color: #9ca3af; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1 style="margin: 0; font-size: 24px;">DoraAudit</h1>
                            <p style="margin: 8px 0 0; opacity: 0.9;">Parooli taastamine</p>
                        </div>
                        <div class="content">
                            <p>Tere, <strong>%s</strong>!</p>
                            <p>Saime teie parooli taastamise p&auml;ringu. Kl&otilde;psake alloleval nupul, et m&auml;&auml;rata uus parool:</p>
                            <p style="text-align: center; margin: 30px 0;">
                                <a href="%s" class="btn">Taasta parool</a>
                            </p>
                            <p>See link kehtib <strong>1 tund</strong>. Kui te ei p&auml;rinud parooli taastamist, ignoreerige seda kirja.</p>
                            <p class="footer">
                                Kui nupp ei t&ouml;&ouml;ta, kopeerige see link brauserisse:<br>
                                <a href="%s" style="color: #10b981; word-break: break-all;">%s</a>
                            </p>
                            <p style="text-align: center; margin-top: 20px; font-size: 11px; color: #9ca3af;">
                                <a href="%s" style="color: #9ca3af; text-decoration: underline;">Loobu turunduskirjadest</a>
                            </p>
                        </div>
                    </div>
                </body>
                </html>
                """.formatted(name, resetLink, resetLink, resetLink, unsubLink);
    }
}
