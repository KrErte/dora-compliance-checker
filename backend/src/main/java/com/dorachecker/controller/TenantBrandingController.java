package com.dorachecker.controller;

import com.dorachecker.model.TenantBrandingEntity;
import com.dorachecker.model.TenantBrandingRepository;
import com.dorachecker.service.SubscriptionGuardService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/tenant-branding")
public class TenantBrandingController {

    private final TenantBrandingRepository repository;
    private final SubscriptionGuardService subscriptionGuard;

    private static final String LOGO_DIR = "/app/data/branding/logos/";

    public TenantBrandingController(
            TenantBrandingRepository repository,
            SubscriptionGuardService subscriptionGuard
    ) {
        this.repository = repository;
        this.subscriptionGuard = subscriptionGuard;
    }

    private String getUserId(Authentication auth) {
        return (String) auth.getPrincipal();
    }

    @GetMapping
    public ResponseEntity<?> get(Authentication auth) {
        String userId = getUserId(auth);
        return repository.findByUserId(userId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.ok(null));
    }

    @PutMapping
    public ResponseEntity<?> update(
            @RequestParam(required = false) String companyName,
            @RequestParam(required = false) String primaryColor,
            @RequestParam(required = false) String accentColor,
            @RequestParam(required = false) String customDomain,
            @RequestParam(required = false) MultipartFile logo,
            Authentication auth
    ) {
        String userId = getUserId(auth);

        if (!subscriptionGuard.isEnterprise(userId, null)) {
            return ResponseEntity.status(403).body(Map.of("error", "Enterprise subscription required"));
        }

        TenantBrandingEntity entity = repository.findByUserId(userId)
                .orElseGet(() -> {
                    TenantBrandingEntity e = new TenantBrandingEntity();
                    e.setUserId(userId);
                    return e;
                });

        if (companyName != null) entity.setCompanyName(companyName);
        if (primaryColor != null) entity.setPrimaryColor(primaryColor);
        if (accentColor != null) entity.setAccentColor(accentColor);
        if (customDomain != null) entity.setCustomDomain(customDomain);

        if (logo != null && !logo.isEmpty()) {
            try {
                Path dir = Paths.get(LOGO_DIR + userId);
                Files.createDirectories(dir);
                String ext = getFileExtension(logo.getOriginalFilename());
                String filename = UUID.randomUUID() + ext;
                Files.write(dir.resolve(filename), logo.getBytes());
                entity.setLogoPath(userId + "/" + filename);
            } catch (IOException e) {
                return ResponseEntity.status(500).body(Map.of("error", "Failed to upload logo"));
            }
        }

        entity.setUpdatedAt(LocalDateTime.now());
        repository.save(entity);
        return ResponseEntity.ok(entity);
    }

    @GetMapping("/public/{domain}")
    public ResponseEntity<?> getByDomain(@PathVariable String domain) {
        return repository.findByCustomDomain(domain)
                .map(b -> ResponseEntity.ok(Map.of(
                        "companyName", b.getCompanyName() != null ? b.getCompanyName() : "",
                        "primaryColor", b.getPrimaryColor() != null ? b.getPrimaryColor() : "",
                        "accentColor", b.getAccentColor() != null ? b.getAccentColor() : "",
                        "logoPath", b.getLogoPath() != null ? b.getLogoPath() : ""
                )))
                .orElse(ResponseEntity.notFound().build());
    }

    private String getFileExtension(String filename) {
        if (filename == null) return ".png";
        int dot = filename.lastIndexOf('.');
        return dot >= 0 ? filename.substring(dot) : ".png";
    }
}
