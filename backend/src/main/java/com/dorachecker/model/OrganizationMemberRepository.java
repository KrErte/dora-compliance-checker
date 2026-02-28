package com.dorachecker.model;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface OrganizationMemberRepository extends JpaRepository<OrganizationMemberEntity, String> {
    List<OrganizationMemberEntity> findByOrganizationId(String organizationId);
    List<OrganizationMemberEntity> findByUserId(String userId);
    Optional<OrganizationMemberEntity> findByOrganizationIdAndUserId(String organizationId, String userId);
    void deleteByOrganizationIdAndUserId(String organizationId, String userId);
    long countByOrganizationId(String organizationId);
}
