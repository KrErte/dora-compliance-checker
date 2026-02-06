package com.dorachecker.model;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ComplianceQuestionRepository extends JpaRepository<ComplianceQuestionEntity, String> {

    List<ComplianceQuestionEntity> findByDomainIdOrderByDisplayOrder(String domainId);

    @Query("SELECT q FROM ComplianceQuestionEntity q WHERE q.domain.regulation.code = :regulationCode ORDER BY q.domain.displayOrder, q.displayOrder")
    List<ComplianceQuestionEntity> findByRegulationCode(@Param("regulationCode") String regulationCode);

    @Query("SELECT COUNT(q) FROM ComplianceQuestionEntity q WHERE q.domain.regulation.code = :regulationCode")
    long countByRegulationCode(@Param("regulationCode") String regulationCode);
}
