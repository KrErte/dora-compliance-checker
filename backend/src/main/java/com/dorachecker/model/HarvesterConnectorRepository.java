package com.dorachecker.model;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface HarvesterConnectorRepository extends JpaRepository<HarvesterConnectorEntity, String> {

    List<HarvesterConnectorEntity> findByUserId(String userId);

    Optional<HarvesterConnectorEntity> findByUserIdAndConnectorType(String userId, String connectorType);
}
