package com.dorachecker.model;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface VendorQuestionnaireRepository
    extends JpaRepository<VendorQuestionnaireEntity, String> {
  List<VendorQuestionnaireEntity> findByUserIdOrderByCreatedAtDesc(String userId);

  Optional<VendorQuestionnaireEntity> findByToken(String token);

  List<VendorQuestionnaireEntity> findByProviderId(String providerId);

  long countByUserIdAndStatus(String userId, VendorQuestionnaireEntity.Status status);
}
