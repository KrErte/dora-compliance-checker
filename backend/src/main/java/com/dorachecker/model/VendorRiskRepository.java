package com.dorachecker.model;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface VendorRiskRepository extends JpaRepository<VendorRiskEntity, String> {

    Optional<VendorRiskEntity> findByVendorNameIgnoreCase(String vendorName);

    List<VendorRiskEntity> findByVendorCategoryOrderByAverageScoreDesc(String category);

    @Query("SELECT v FROM VendorRiskEntity v ORDER BY v.assessmentCount DESC")
    List<VendorRiskEntity> findTopByAssessmentCount();

    @Query("SELECT v FROM VendorRiskEntity v WHERE v.averageScore < 50 ORDER BY v.averageScore ASC")
    List<VendorRiskEntity> findHighRiskVendors();

    @Query("SELECT DISTINCT v.vendorCategory FROM VendorRiskEntity v WHERE v.vendorCategory IS NOT NULL")
    List<String> findAllCategories();

    List<VendorRiskEntity> findByRiskLevel(String riskLevel);
}
