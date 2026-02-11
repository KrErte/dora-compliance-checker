package com.dorachecker.model;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FineCalculatorResultRepository extends JpaRepository<FineCalculatorResultEntity, String> {
    List<FineCalculatorResultEntity> findByEmailOrderByCreatedAtDesc(String email);
    long countByRiskLevel(String riskLevel);
}
