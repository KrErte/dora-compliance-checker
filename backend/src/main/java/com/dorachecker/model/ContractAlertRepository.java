package com.dorachecker.model;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ContractAlertRepository extends JpaRepository<ContractAlertEntity, String> {
  List<ContractAlertEntity> findByUserIdOrderByCreatedAtDesc(String userId);

  List<ContractAlertEntity> findByUserIdAndIsReadFalse(String userId);

  long countByUserIdAndIsReadFalse(String userId);

  void deleteByUserId(String userId);
}
