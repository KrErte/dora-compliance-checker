package com.dorachecker.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "organization_members", indexes = {
    @Index(name = "idx_org_members_org_id", columnList = "organizationId"),
    @Index(name = "idx_org_members_user_id", columnList = "userId")
}, uniqueConstraints = {
    @UniqueConstraint(name = "uk_org_member", columnNames = {"organizationId", "userId"})
})
public class OrganizationMemberEntity {

    public enum OrgRole { OWNER, ADMIN, MEMBER }

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false)
    private String organizationId;

    @Column(nullable = false)
    private String userId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private OrgRole role = OrgRole.MEMBER;

    @Column(nullable = false)
    private LocalDateTime joinedAt;

    public OrganizationMemberEntity() {}

    public OrganizationMemberEntity(String organizationId, String userId, OrgRole role) {
        this.organizationId = organizationId;
        this.userId = userId;
        this.role = role;
        this.joinedAt = LocalDateTime.now();
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getOrganizationId() { return organizationId; }
    public void setOrganizationId(String organizationId) { this.organizationId = organizationId; }
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    public OrgRole getRole() { return role; }
    public void setRole(OrgRole role) { this.role = role; }
    public LocalDateTime getJoinedAt() { return joinedAt; }
    public void setJoinedAt(LocalDateTime joinedAt) { this.joinedAt = joinedAt; }
}
