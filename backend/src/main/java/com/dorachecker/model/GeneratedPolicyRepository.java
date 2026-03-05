package com.dorachecker.model;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface GeneratedPolicyRepository extends JpaRepository<GeneratedPolicyEntity, String> {
    List<GeneratedPolicyEntity> findByUserIdOrderByCreatedAtDesc(String userId);
}
