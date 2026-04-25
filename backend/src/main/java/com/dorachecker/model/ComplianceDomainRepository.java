package com.dorachecker.model;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface ComplianceDomainRepository extends JpaRepository<ComplianceDomainEntity, String> {

  List<ComplianceDomainEntity> findByRegulationIdOrderByDisplayOrder(String regulationId);

  @Query(
      "SELECT d FROM ComplianceDomainEntity d WHERE d.regulation.code = :regulationCode ORDER BY d.displayOrder")
  List<ComplianceDomainEntity> findByRegulationCode(@Param("regulationCode") String regulationCode);

  @Query(
      "SELECT d FROM ComplianceDomainEntity d JOIN FETCH d.questions WHERE d.regulation.code = :regulationCode ORDER BY d.displayOrder")
  List<ComplianceDomainEntity> findByRegulationCodeWithQuestions(
      @Param("regulationCode") String regulationCode);
}
