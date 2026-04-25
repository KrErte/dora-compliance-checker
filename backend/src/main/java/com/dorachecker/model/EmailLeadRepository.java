package com.dorachecker.model;

import org.springframework.data.jpa.repository.JpaRepository;

public interface EmailLeadRepository extends JpaRepository<EmailLeadEntity, String> {
  boolean existsByEmailAndAssessmentId(String email, String assessmentId);
}
