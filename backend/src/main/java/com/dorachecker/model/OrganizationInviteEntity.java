package com.dorachecker.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "organization_invites", indexes = {
    @Index(name = "idx_org_invites_org_id", columnList = "organizationId"),
    @Index(name = "idx_org_invites_email", columnList = "email"),
    @Index(name = "idx_org_invites_token", columnList = "token")
})
public class OrganizationInviteEntity {

    public enum InviteStatus { PENDING, ACCEPTED, EXPIRED, CANCELLED }

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false)
    private String organizationId;

    @Column(nullable = false)
    private String email;

    @Column(nullable = false)
    private String invitedByUserId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private OrganizationMemberEntity.OrgRole role = OrganizationMemberEntity.OrgRole.MEMBER;

    @Column(nullable = false, unique = true)
    private String token;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private InviteStatus status = InviteStatus.PENDING;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime expiresAt;

    private LocalDateTime acceptedAt;

    public OrganizationInviteEntity() {}

    public OrganizationInviteEntity(String organizationId, String email, String invitedByUserId, OrganizationMemberEntity.OrgRole role, String token) {
        this.organizationId = organizationId;
        this.email = email;
        this.invitedByUserId = invitedByUserId;
        this.role = role;
        this.token = token;
        this.status = InviteStatus.PENDING;
        this.createdAt = LocalDateTime.now();
        this.expiresAt = LocalDateTime.now().plusDays(7);
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getOrganizationId() { return organizationId; }
    public void setOrganizationId(String organizationId) { this.organizationId = organizationId; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getInvitedByUserId() { return invitedByUserId; }
    public void setInvitedByUserId(String invitedByUserId) { this.invitedByUserId = invitedByUserId; }
    public OrganizationMemberEntity.OrgRole getRole() { return role; }
    public void setRole(OrganizationMemberEntity.OrgRole role) { this.role = role; }
    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }
    public InviteStatus getStatus() { return status; }
    public void setStatus(InviteStatus status) { this.status = status; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getExpiresAt() { return expiresAt; }
    public void setExpiresAt(LocalDateTime expiresAt) { this.expiresAt = expiresAt; }
    public LocalDateTime getAcceptedAt() { return acceptedAt; }
    public void setAcceptedAt(LocalDateTime acceptedAt) { this.acceptedAt = acceptedAt; }
}
