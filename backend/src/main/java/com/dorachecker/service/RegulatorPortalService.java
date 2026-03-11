package com.dorachecker.service;

import com.dorachecker.model.RegulatorPortalTokenEntity;
import com.dorachecker.model.RegulatorPortalTokenRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;

@Service
public class RegulatorPortalService {

    private final RegulatorPortalTokenRepository tokenRepository;
    private final BoardPackageService boardPackageService;

    public RegulatorPortalService(RegulatorPortalTokenRepository tokenRepository,
                                   BoardPackageService boardPackageService) {
        this.tokenRepository = tokenRepository;
        this.boardPackageService = boardPackageService;
    }

    public RegulatorPortalTokenEntity createToken(String userId, String label, LocalDateTime expiresAt, String permissions) {
        RegulatorPortalTokenEntity entity = new RegulatorPortalTokenEntity();
        entity.setUserId(userId);
        entity.setToken(UUID.randomUUID().toString());
        entity.setLabel(label);
        entity.setExpiresAt(expiresAt);
        entity.setPermissions(permissions);
        entity.setAccessCount(0);
        entity.setCreatedAt(LocalDateTime.now());
        return tokenRepository.save(entity);
    }

    public boolean revokeToken(String userId, String tokenId) {
        Optional<RegulatorPortalTokenEntity> opt = tokenRepository.findById(tokenId);
        if (opt.isEmpty()) return false;

        RegulatorPortalTokenEntity entity = opt.get();
        if (!entity.getUserId().equals(userId)) return false;

        entity.setRevokedAt(LocalDateTime.now());
        tokenRepository.save(entity);
        return true;
    }

    public List<RegulatorPortalTokenEntity> listTokens(String userId) {
        return tokenRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    public Map<String, Object> getPortalData(String token) {
        Optional<RegulatorPortalTokenEntity> opt = tokenRepository.findByToken(token);
        if (opt.isEmpty()) return null;

        RegulatorPortalTokenEntity entity = opt.get();

        // Check if revoked
        if (entity.getRevokedAt() != null) return null;

        // Check if expired
        if (entity.getExpiresAt() != null && entity.getExpiresAt().isBefore(LocalDateTime.now())) return null;

        // Increment access count
        entity.setAccessCount(entity.getAccessCount() + 1);
        tokenRepository.save(entity);

        // Get board package data
        Map<String, Object> boardData = boardPackageService.getBoardPackageData(entity.getUserId());

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("portalData", boardData);
        result.put("companyLabel", entity.getLabel());
        result.put("expiresAt", entity.getExpiresAt() != null ? entity.getExpiresAt().toString() : null);
        result.put("generatedAt", LocalDateTime.now().toString());
        return result;
    }
}
