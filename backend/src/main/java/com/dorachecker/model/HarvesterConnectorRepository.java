package com.dorachecker.model;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface HarvesterConnectorRepository
    extends JpaRepository<HarvesterConnectorEntity, String> {

  List<HarvesterConnectorEntity> findByUserId(String userId);

  Optional<HarvesterConnectorEntity> findByUserIdAndConnectorType(
      String userId, String connectorType);
}
