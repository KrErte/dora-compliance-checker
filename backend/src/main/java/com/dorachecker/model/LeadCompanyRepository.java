package com.dorachecker.model;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LeadCompanyRepository extends JpaRepository<LeadCompanyEntity, String> {

    Optional<LeadCompanyEntity> findByRegistryCodeAndCountry(String registryCode, String country);

    List<LeadCompanyEntity> findByCountry(String country);

    List<LeadCompanyEntity> findByLeadStatus(String leadStatus);

    List<LeadCompanyEntity> findByLicenseType(String licenseType);

    List<LeadCompanyEntity> findBySector(String sector);

    long countByCountry(String country);

    long countByLeadStatus(String leadStatus);

    @Query("SELECT l FROM LeadCompanyEntity l WHERE " +
           "(:country IS NULL OR l.country = :country) AND " +
           "(:licenseType IS NULL OR l.licenseType = :licenseType) AND " +
           "(:leadStatus IS NULL OR l.leadStatus = :leadStatus) AND " +
           "(:sector IS NULL OR l.sector = :sector) AND " +
           "(:search IS NULL OR LOWER(l.companyName) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<LeadCompanyEntity> findFiltered(
            @Param("country") String country,
            @Param("licenseType") String licenseType,
            @Param("leadStatus") String leadStatus,
            @Param("sector") String sector,
            @Param("search") String search,
            Pageable pageable);

    @Query("SELECT l FROM LeadCompanyEntity l WHERE " +
           "(:country IS NULL OR l.country = :country) AND " +
           "(:licenseType IS NULL OR l.licenseType = :licenseType) AND " +
           "(:leadStatus IS NULL OR l.leadStatus = :leadStatus) AND " +
           "(:sector IS NULL OR l.sector = :sector) AND " +
           "(:search IS NULL OR LOWER(l.companyName) LIKE LOWER(CONCAT('%', :search, '%')))")
    List<LeadCompanyEntity> findAllFiltered(
            @Param("country") String country,
            @Param("licenseType") String licenseType,
            @Param("leadStatus") String leadStatus,
            @Param("sector") String sector,
            @Param("search") String search);
}
