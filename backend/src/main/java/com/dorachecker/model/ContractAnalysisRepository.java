package com.dorachecker.model;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ContractAnalysisRepository extends JpaRepository<ContractAnalysisEntity, String> {

    List<ContractAnalysisEntity> findByUserIdOrderByAnalysisDateDesc(String userId);
}
