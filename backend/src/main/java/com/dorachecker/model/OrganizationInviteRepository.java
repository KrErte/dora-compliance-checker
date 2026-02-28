package com.dorachecker.model;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface OrganizationInviteRepository extends JpaRepository<OrganizationInviteEntity, String> {
    List<OrganizationInviteEntity> findByOrganizationIdAndStatus(String organizationId, OrganizationInviteEntity.InviteStatus status);
    Optional<OrganizationInviteEntity> findByToken(String token);
    List<OrganizationInviteEntity> findByEmailAndStatus(String email, OrganizationInviteEntity.InviteStatus status);
}
