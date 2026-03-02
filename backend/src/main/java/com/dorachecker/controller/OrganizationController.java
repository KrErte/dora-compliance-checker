package com.dorachecker.controller;

import com.dorachecker.model.OrganizationEntity;
import com.dorachecker.model.OrganizationInviteEntity;
import com.dorachecker.service.OrganizationService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/organizations")
public class OrganizationController {

    private final OrganizationService organizationService;

    public OrganizationController(OrganizationService organizationService) {
        this.organizationService = organizationService;
    }

    private String getUserId(Authentication auth) {
        return (String) auth.getPrincipal();
    }

    @PostMapping
    public ResponseEntity<OrganizationEntity> create(@Valid @RequestBody CreateOrgRequest body, Authentication auth) {
        OrganizationEntity org = organizationService.create(
            body.name(), body.description() != null ? body.description() : "", getUserId(auth));
        return ResponseEntity.ok(org);
    }

    @GetMapping
    public ResponseEntity<List<OrganizationEntity>> list(Authentication auth) {
        return ResponseEntity.ok(organizationService.getByUser(getUserId(auth)));
    }

    @GetMapping("/{orgId}")
    public ResponseEntity<OrganizationEntity> get(@PathVariable String orgId, Authentication auth) {
        return organizationService.getById(orgId, getUserId(auth))
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{orgId}")
    public ResponseEntity<OrganizationEntity> update(@PathVariable String orgId, @Valid @RequestBody CreateOrgRequest body, Authentication auth) {
        OrganizationEntity org = organizationService.update(orgId, body.name(), body.description(), getUserId(auth));
        return ResponseEntity.ok(org);
    }

    @DeleteMapping("/{orgId}")
    public ResponseEntity<Void> delete(@PathVariable String orgId, Authentication auth) {
        organizationService.delete(orgId, getUserId(auth));
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{orgId}/members")
    public ResponseEntity<List<Map<String, Object>>> members(@PathVariable String orgId, Authentication auth) {
        return ResponseEntity.ok(organizationService.getMembers(orgId, getUserId(auth)));
    }

    @PostMapping("/{orgId}/invite")
    public ResponseEntity<OrganizationInviteEntity> invite(@PathVariable String orgId, @Valid @RequestBody InviteRequest body, Authentication auth) {
        OrganizationInviteEntity invite = organizationService.invite(
            orgId, body.email(), body.role() != null ? body.role() : "MEMBER", getUserId(auth));
        return ResponseEntity.ok(invite);
    }

    @GetMapping("/{orgId}/invites")
    public ResponseEntity<List<OrganizationInviteEntity>> pendingInvites(@PathVariable String orgId, Authentication auth) {
        return ResponseEntity.ok(organizationService.getPendingInvites(orgId, getUserId(auth)));
    }

    @DeleteMapping("/{orgId}/invites/{inviteId}")
    public ResponseEntity<Void> cancelInvite(@PathVariable String orgId, @PathVariable String inviteId, Authentication auth) {
        organizationService.cancelInvite(inviteId, getUserId(auth));
        return ResponseEntity.ok().build();
    }

    @PostMapping("/invites/{token}/accept")
    public ResponseEntity<Void> acceptInvite(@PathVariable String token, Authentication auth) {
        organizationService.acceptInvite(token, getUserId(auth));
        return ResponseEntity.ok().build();
    }

    @GetMapping("/my-invites")
    public ResponseEntity<List<OrganizationInviteEntity>> myInvites(Authentication auth) {
        return ResponseEntity.ok(organizationService.getMyPendingInvites(getUserId(auth)));
    }

    @PutMapping("/{orgId}/members/{memberId}/role")
    public ResponseEntity<Void> updateRole(@PathVariable String orgId, @PathVariable String memberId,
                                            @Valid @RequestBody RoleUpdateRequest body, Authentication auth) {
        organizationService.updateMemberRole(orgId, memberId, body.role(), getUserId(auth));
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{orgId}/members/{memberId}")
    public ResponseEntity<Void> removeMember(@PathVariable String orgId, @PathVariable String memberId, Authentication auth) {
        organizationService.removeMember(orgId, memberId, getUserId(auth));
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{orgId}/leave")
    public ResponseEntity<Void> leave(@PathVariable String orgId, Authentication auth) {
        organizationService.leaveOrganization(orgId, getUserId(auth));
        return ResponseEntity.ok().build();
    }

    public record CreateOrgRequest(
        @NotBlank @Size(max = 200) String name,
        @Size(max = 2000) String description
    ) {}

    public record InviteRequest(
        @NotBlank @Email @Size(max = 255) String email,
        @Size(max = 20) String role
    ) {}

    public record RoleUpdateRequest(
        @NotBlank @Size(max = 20) String role
    ) {}
}
