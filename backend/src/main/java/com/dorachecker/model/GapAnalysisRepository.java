package com.dorachecker.model;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface GapAnalysisRepository extends JpaRepository<GapAnalysisEntity, String> {

    List<GapAnalysisEntity> findByUserIdOrderByCreatedAtDesc(String userId);
}
