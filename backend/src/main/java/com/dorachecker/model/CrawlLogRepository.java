package com.dorachecker.model;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CrawlLogRepository extends JpaRepository<CrawlLogEntity, Long> {

    List<CrawlLogEntity> findByCompanyProfileIdOrderByCrawledAtDesc(Long companyProfileId);

    List<CrawlLogEntity> findBySourceOrderByCrawledAtDesc(String source);

    List<CrawlLogEntity> findByStatusOrderByCrawledAtDesc(String status);

    @Query("SELECT c FROM CrawlLogEntity c WHERE c.companyProfile.id = :profileId AND c.source = :source ORDER BY c.crawledAt DESC")
    List<CrawlLogEntity> findByProfileAndSource(@Param("profileId") Long profileId, @Param("source") String source);

    @Query("SELECT COUNT(c) FROM CrawlLogEntity c WHERE c.status = :status")
    long countByStatus(@Param("status") String status);
}
