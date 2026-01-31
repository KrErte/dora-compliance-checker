package com.dorachecker.model;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ContractAnalysisRepository extends JpaRepository<ContractAnalysisEntity, String> {
}
