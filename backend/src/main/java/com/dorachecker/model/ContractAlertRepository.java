package com.dorachecker.model;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ContractAlertRepository extends JpaRepository<ContractAlertEntity, String> {
    List<ContractAlertEntity> findByUserIdOrderByCreatedAtDesc(String userId);
    List<ContractAlertEntity> findByUserIdAndIsReadFalse(String userId);
    long countByUserIdAndIsReadFalse(String userId);
}
