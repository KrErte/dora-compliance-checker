package com.dorachecker.controller;

import com.dorachecker.model.OrganizationEntity;
import com.dorachecker.model.OrganizationInviteEntity;
import com.dorachecker.service.OrganizationService;
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
    public ResponseEntity<OrganizationEntity> create(@RequestBody Map<String, String> body, Authentication auth) {
        OrganizationEntity org = organizationService.create(
            body.get("name"), body.getOrDefault("description", ""), getUserId(auth));
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
    public ResponseEntity<OrganizationEntity> update(@PathVariable String orgId, @RequestBody Map<String, String> body, Authentication auth) {
        OrganizationEntity org = organizationService.update(orgId, body.get("name"), body.get("description"), getUserId(auth));
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
    public ResponseEntity<OrganizationInviteEntity> invite(@PathVariable String orgId, @RequestBody Map<String, String> body, Authentication auth) {
        OrganizationInviteEntity invite = organizationService.invite(
            orgId, body.get("email"), body.getOrDefault("role", "MEMBER"), getUserId(auth));
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
                                            @RequestBody Map<String, String> body, Authentication auth) {
        organizationService.updateMemberRole(orgId, memberId, body.get("role"), getUserId(auth));
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
}
