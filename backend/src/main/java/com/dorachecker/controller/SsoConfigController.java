package com.dorachecker.controller;

import com.dorachecker.model.SsoConfigEntity;
import com.dorachecker.model.SsoConfigRepository;
import com.dorachecker.model.OrganizationMemberEntity;
import com.dorachecker.model.OrganizationMemberRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/organizations/{orgId}/sso")
public class SsoConfigController {

    private final SsoConfigRepository ssoConfigRepository;
    private final OrganizationMemberRepository memberRepository;

    public SsoConfigController(SsoConfigRepository ssoConfigRepository,
                                OrganizationMemberRepository memberRepository) {
        this.ssoConfigRepository = ssoConfigRepository;
        this.memberRepository = memberRepository;
    }

    private String getUserId(Authentication auth) {
        return (String) auth.getPrincipal();
    }

    private boolean isOrgAdmin(String orgId, String userId) {
        return memberRepository.findByOrganizationIdAndUserId(orgId, userId)
            .map(m -> m.getRole() == OrganizationMemberEntity.OrgRole.OWNER || m.getRole() == OrganizationMemberEntity.OrgRole.ADMIN)
            .orElse(false);
    }

    @GetMapping
    public ResponseEntity<List<SsoConfigEntity>> list(@PathVariable String orgId, Authentication auth) {
        if (!isOrgAdmin(orgId, getUserId(auth))) return ResponseEntity.status(403).build();
        return ResponseEntity.ok(ssoConfigRepository.findByOrganizationId(orgId));
    }

    @PostMapping
    public ResponseEntity<SsoConfigEntity> create(@PathVariable String orgId,
                                                   @RequestBody SsoConfigEntity config,
                                                   Authentication auth) {
        String userId = getUserId(auth);
        if (!isOrgAdmin(orgId, userId)) return ResponseEntity.status(403).build();
        config.setOrganizationId(orgId);
        config.setCreatedBy(userId);
        config.setCreatedAt(LocalDateTime.now());
        config.setStatus(SsoConfigEntity.SsoStatus.DRAFT);
        return ResponseEntity.ok(ssoConfigRepository.save(config));
    }

    @PutMapping("/{configId}")
    public ResponseEntity<SsoConfigEntity> update(@PathVariable String orgId,
                                                   @PathVariable String configId,
                                                   @RequestBody SsoConfigEntity updates,
                                                   Authentication auth) {
        if (!isOrgAdmin(orgId, getUserId(auth))) return ResponseEntity.status(403).build();
        return ssoConfigRepository.findById(configId)
            .filter(c -> c.getOrganizationId().equals(orgId))
            .map(config -> {
                config.setType(updates.getType());
                config.setEntityId(updates.getEntityId());
                config.setMetadataUrl(updates.getMetadataUrl());
                config.setSsoUrl(updates.getSsoUrl());
                config.setCertificate(updates.getCertificate());
                config.setNameIdFormat(updates.getNameIdFormat());
                config.setIssuerUrl(updates.getIssuerUrl());
                config.setClientId(updates.getClientId());
                config.setClientSecret(updates.getClientSecret());
                config.setScopes(updates.getScopes());
                config.setEmailAttribute(updates.getEmailAttribute());
                config.setNameAttribute(updates.getNameAttribute());
                config.setDefaultRole(updates.getDefaultRole());
                config.setAutoProvision(updates.isAutoProvision());
                config.setAllowedDomains(updates.getAllowedDomains());
                config.setUpdatedAt(LocalDateTime.now());
                return ResponseEntity.ok(ssoConfigRepository.save(config));
            })
            .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{configId}/activate")
    public ResponseEntity<SsoConfigEntity> activate(@PathVariable String orgId,
                                                     @PathVariable String configId,
                                                     Authentication auth) {
        if (!isOrgAdmin(orgId, getUserId(auth))) return ResponseEntity.status(403).build();
        return ssoConfigRepository.findById(configId)
            .filter(c -> c.getOrganizationId().equals(orgId))
            .map(config -> {
                config.setStatus(SsoConfigEntity.SsoStatus.ACTIVE);
                config.setUpdatedAt(LocalDateTime.now());
                return ResponseEntity.ok(ssoConfigRepository.save(config));
            })
            .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{configId}/disable")
    public ResponseEntity<SsoConfigEntity> disable(@PathVariable String orgId,
                                                    @PathVariable String configId,
                                                    Authentication auth) {
        if (!isOrgAdmin(orgId, getUserId(auth))) return ResponseEntity.status(403).build();
        return ssoConfigRepository.findById(configId)
            .filter(c -> c.getOrganizationId().equals(orgId))
            .map(config -> {
                config.setStatus(SsoConfigEntity.SsoStatus.DISABLED);
                config.setUpdatedAt(LocalDateTime.now());
                return ResponseEntity.ok(ssoConfigRepository.save(config));
            })
            .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{configId}")
    public ResponseEntity<Void> delete(@PathVariable String orgId,
                                        @PathVariable String configId,
                                        Authentication auth) {
        if (!isOrgAdmin(orgId, getUserId(auth))) return ResponseEntity.status(403).build();
        ssoConfigRepository.findById(configId)
            .filter(c -> c.getOrganizationId().equals(orgId))
            .ifPresent(ssoConfigRepository::delete);
        return ResponseEntity.ok().build();
    }
}
