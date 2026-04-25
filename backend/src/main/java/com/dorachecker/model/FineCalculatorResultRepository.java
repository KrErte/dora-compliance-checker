package com.dorachecker.model;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface FineCalculatorResultRepository
    extends JpaRepository<FineCalculatorResultEntity, String> {
  List<FineCalculatorResultEntity> findByEmailOrderByCreatedAtDesc(String email);

  long countByRiskLevel(String riskLevel);
}
