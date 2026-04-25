package com.dorachecker.model;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface RegulatoryUpdateRepository extends JpaRepository<RegulatoryUpdateEntity, String> {
  List<RegulatoryUpdateEntity> findByStatusOrderByFetchedAtDesc(String status);

  List<RegulatoryUpdateEntity> findAllByOrderByFetchedAtDesc();

  boolean existsByUrl(String url);

  boolean existsBySourceIdAndExternalId(String sourceId, String externalId);

  List<RegulatoryUpdateEntity> findAllByOrderByPublishedDateDesc();

  List<RegulatoryUpdateEntity> findBySeverityOrderByPublishedDateDesc(String severity);
}
