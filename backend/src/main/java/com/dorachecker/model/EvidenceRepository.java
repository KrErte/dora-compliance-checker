package com.dorachecker.model;

import java.time.LocalDate;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EvidenceRepository extends JpaRepository<EvidenceEntity, String> {

  List<EvidenceEntity> findByExpiryDateBetweenAndStatusNot(
      LocalDate start, LocalDate end, String status);

  List<EvidenceEntity> findByExpiryDateAndStatusNot(LocalDate date, String status);

  List<EvidenceEntity> findByUserIdOrderByCreatedAtDesc(String userId);

  List<EvidenceEntity> findByUserIdAndStatusOrderByCreatedAtDesc(String userId, String status);

  List<EvidenceEntity> findByUserIdAndPillarOrderByCreatedAtDesc(String userId, String pillar);

  long countByUserId(String userId);

  long countByUserIdAndStatus(String userId, String status);

  void deleteByUserId(String userId);
}
