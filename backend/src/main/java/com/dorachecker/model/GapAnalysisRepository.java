package com.dorachecker.model;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface GapAnalysisRepository extends JpaRepository<GapAnalysisEntity, String> {

  List<GapAnalysisEntity> findByUserIdOrderByCreatedAtDesc(String userId);
}
