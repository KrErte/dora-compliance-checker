package com.dorachecker.model;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface CompanyProfileRepository extends JpaRepository<CompanyProfileEntity, Long> {

  Optional<CompanyProfileEntity> findByRegistryCode(String registryCode);

  @Query(
      "SELECT c FROM CompanyProfileEntity c WHERE LOWER(c.name) LIKE LOWER(CONCAT('%', :query, '%'))")
  List<CompanyProfileEntity> findByNameContaining(@Param("query") String query);

  List<CompanyProfileEntity> findByFiLicenseTypeIsNotNull();

  List<CompanyProfileEntity> findByDoraTier(Integer doraTier);

  @Query("SELECT c FROM CompanyProfileEntity c WHERE c.fiLicenseType IS NOT NULL ORDER BY c.name")
  List<CompanyProfileEntity> findAllFiLicensed();

  @Query(
      "SELECT c FROM CompanyProfileEntity c WHERE c.lastCrawledAt IS NULL OR c.lastCrawledAt < :threshold")
  List<CompanyProfileEntity> findStaleProfiles(
      @Param("threshold") java.time.LocalDateTime threshold);

  boolean existsByRegistryCode(String registryCode);
}
