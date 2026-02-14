package com.dorachecker.model;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Map;

@Repository
public interface AssessmentRepository extends JpaRepository<AssessmentEntity, String> {

    @Query("SELECT AVG(a.scorePercentage) FROM AssessmentEntity a")
    Double findAverageScore();

    @Query("SELECT a.complianceLevel, COUNT(a) FROM AssessmentEntity a GROUP BY a.complianceLevel")
    List<Object[]> countByComplianceLevel();

    @Query("SELECT MIN(a.scorePercentage) FROM AssessmentEntity a")
    Double findMinScore();

    @Query("SELECT MAX(a.scorePercentage) FROM AssessmentEntity a")
    Double findMaxScore();

    @Query(value = "SELECT percentile_cont(0.5) WITHIN GROUP (ORDER BY score_percentage) FROM assessments", nativeQuery = true)
    Double findMedianScore();

    @Query(value = "SELECT percentile_cont(0.25) WITHIN GROUP (ORDER BY score_percentage) FROM assessments", nativeQuery = true)
    Double findPercentile25();

    @Query(value = "SELECT percentile_cont(0.75) WITHIN GROUP (ORDER BY score_percentage) FROM assessments", nativeQuery = true)
    Double findPercentile75();

    @Query("SELECT COUNT(a) FROM AssessmentEntity a WHERE a.scorePercentage < :score")
    Long countBelowScore(double score);
}
