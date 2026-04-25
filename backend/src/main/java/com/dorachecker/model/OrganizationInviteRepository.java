package com.dorachecker.model;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OrganizationInviteRepository
    extends JpaRepository<OrganizationInviteEntity, String> {
  List<OrganizationInviteEntity> findByOrganizationIdAndStatus(
      String organizationId, OrganizationInviteEntity.InviteStatus status);

  Optional<OrganizationInviteEntity> findByToken(String token);

  List<OrganizationInviteEntity> findByEmailAndStatus(
      String email, OrganizationInviteEntity.InviteStatus status);
}
