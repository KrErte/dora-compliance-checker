package com.dorachecker.model;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface GeneratedPolicyRepository extends JpaRepository<GeneratedPolicyEntity, String> {
  List<GeneratedPolicyEntity> findByUserIdOrderByCreatedAtDesc(String userId);
}
