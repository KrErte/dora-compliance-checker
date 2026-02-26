package com.dorachecker.controller;

import com.dorachecker.model.UserBrandingEntity;
import com.dorachecker.model.UserBrandingRepository;
import com.dorachecker.service.SubscriptionGuardService;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

import org.springframework.lang.Nullable;

@RestController
@RequestMapping("/api/branding")
public class BrandingController {

    private static final long MAX_LOGO_SIZE = 2 * 1024 * 1024; // 2MB
    private static final Set<String> ALLOWED_TYPES = Set.of(
            "image/png", "image/jpeg", "image/jpg", "image/svg+xml"
    );
    private static final String LOGO_BASE_DIR = "/app/data/branding/logos";

    private final UserBrandingRepository brandingRepository;
    private final SubscriptionGuardService subscriptionGuard;

    public BrandingController(UserBrandingRepository brandingRepository,
                               SubscriptionGuardService subscriptionGuard) {
        this.brandingRepository = brandingRepository;
        this.subscriptionGuard = subscriptionGuard;
    }

    private String getUserId(Authentication auth) {
        return (String) auth.getPrincipal();
    }

    @GetMapping
    public ResponseEntity<?> getBranding(Authentication auth) {
        String userId = getUserId(auth);

        if (!subscriptionGuard.isPremium(userId, null)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Premium subscription required"));
        }

        Optional<UserBrandingEntity> branding = brandingRepository.findByUserId(userId);
        if (branding.isEmpty()) {
            return ResponseEntity.ok(Map.of(
                    "companyName", "",
                    "primaryColorHex", "#22c55e",
                    "hasLogo", false
            ));
        }

        UserBrandingEntity b = branding.get();
        return ResponseEntity.ok(Map.of(
                "companyName", b.getCompanyName() != null ? b.getCompanyName() : "",
                "primaryColorHex", b.getPrimaryColorHex() != null ? b.getPrimaryColorHex() : "#22c55e",
                "hasLogo", b.getLogoPath() != null && !b.getLogoPath().isEmpty(),
                "updatedAt", b.getUpdatedAt().toString()
        ));
    }

    @PutMapping
    public ResponseEntity<?> updateBranding(@RequestBody Map<String, String> body, Authentication auth) {
        String userId = getUserId(auth);

        if (!subscriptionGuard.isPremium(userId, null)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Premium subscription required"));
        }

        String companyName = body.get("companyName");
        String primaryColorHex = body.get("primaryColorHex");

        if (companyName == null || companyName.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Company name is required"));
        }

        if (primaryColorHex != null && !primaryColorHex.matches("^#[0-9a-fA-F]{6}$")) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid color hex format"));
        }

        UserBrandingEntity branding = brandingRepository.findByUserId(userId)
                .orElseGet(() -> {
                    UserBrandingEntity newBranding = new UserBrandingEntity();
                    newBranding.setUserId(userId);
                    return newBranding;
                });

        branding.setCompanyName(companyName);
        if (primaryColorHex != null) {
            branding.setPrimaryColorHex(primaryColorHex);
        }
        branding.setUpdatedAt(LocalDateTime.now());

        brandingRepository.save(branding);

        return ResponseEntity.ok(Map.of(
                "companyName", branding.getCompanyName(),
                "primaryColorHex", branding.getPrimaryColorHex() != null ? branding.getPrimaryColorHex() : "#22c55e",
                "hasLogo", branding.getLogoPath() != null && !branding.getLogoPath().isEmpty(),
                "updatedAt", branding.getUpdatedAt().toString()
        ));
    }

    @PostMapping("/logo")
    public ResponseEntity<?> uploadLogo(@RequestParam("file") MultipartFile file, Authentication auth) {
        String userId = getUserId(auth);

        if (!subscriptionGuard.isPremium(userId, null)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Premium subscription required"));
        }

        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "File is empty"));
        }

        if (file.getSize() > MAX_LOGO_SIZE) {
            return ResponseEntity.badRequest().body(Map.of("error", "File size exceeds 2MB limit"));
        }

        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_TYPES.contains(contentType)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Only PNG, JPG, and SVG files are allowed"));
        }

        try {
            Path logoDir = Paths.get(LOGO_BASE_DIR, userId);
            Files.createDirectories(logoDir);

            // Delete existing logo files
            if (Files.exists(logoDir)) {
                try (var stream = Files.list(logoDir)) {
                    stream.forEach(p -> {
                        try { Files.deleteIfExists(p); } catch (IOException ignored) {}
                    });
                }
            }

            String extension = getExtension(file.getOriginalFilename(), contentType);
            Path logoPath = logoDir.resolve("logo" + extension);
            Files.copy(file.getInputStream(), logoPath, StandardCopyOption.REPLACE_EXISTING);

            UserBrandingEntity branding = brandingRepository.findByUserId(userId)
                    .orElseGet(() -> {
                        UserBrandingEntity newBranding = new UserBrandingEntity();
                        newBranding.setUserId(userId);
                        return newBranding;
                    });

            branding.setLogoPath(logoPath.toString());
            branding.setLogoContentType(contentType);
            branding.setUpdatedAt(LocalDateTime.now());
            brandingRepository.save(branding);

            return ResponseEntity.ok(Map.of("success", true, "message", "Logo uploaded successfully"));
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to save logo"));
        }
    }

    @GetMapping("/logo")
    public ResponseEntity<Resource> getLogo(@Nullable Authentication auth) {
        if (auth == null) {
            return ResponseEntity.notFound().build();
        }
        String userId = getUserId(auth);

        Optional<UserBrandingEntity> branding = brandingRepository.findByUserId(userId);
        if (branding.isEmpty() || branding.get().getLogoPath() == null) {
            return ResponseEntity.notFound().build();
        }

        Path logoPath = Paths.get(branding.get().getLogoPath());
        if (!Files.exists(logoPath)) {
            return ResponseEntity.notFound().build();
        }

        Resource resource = new FileSystemResource(logoPath);
        String contentType = branding.get().getLogoContentType();
        if (contentType == null) contentType = "application/octet-stream";

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .body(resource);
    }

    @DeleteMapping("/logo")
    public ResponseEntity<?> deleteLogo(Authentication auth) {
        String userId = getUserId(auth);

        if (!subscriptionGuard.isPremium(userId, null)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Premium subscription required"));
        }

        Optional<UserBrandingEntity> branding = brandingRepository.findByUserId(userId);
        if (branding.isEmpty() || branding.get().getLogoPath() == null) {
            return ResponseEntity.ok(Map.of("success", true));
        }

        UserBrandingEntity b = branding.get();
        try {
            Path logoPath = Paths.get(b.getLogoPath());
            Files.deleteIfExists(logoPath);
        } catch (IOException ignored) {}

        b.setLogoPath(null);
        b.setLogoContentType(null);
        b.setUpdatedAt(LocalDateTime.now());
        brandingRepository.save(b);

        return ResponseEntity.ok(Map.of("success", true, "message", "Logo deleted"));
    }

    private String getExtension(String filename, String contentType) {
        if (filename != null && filename.contains(".")) {
            return filename.substring(filename.lastIndexOf('.'));
        }
        return switch (contentType) {
            case "image/png" -> ".png";
            case "image/jpeg", "image/jpg" -> ".jpg";
            case "image/svg+xml" -> ".svg";
            default -> ".bin";
        };
    }
}
