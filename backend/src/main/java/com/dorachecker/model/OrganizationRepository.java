package com.dorachecker.model;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface OrganizationRepository extends JpaRepository<OrganizationEntity, String> {
    List<OrganizationEntity> findByOwnerId(String ownerId);
}
