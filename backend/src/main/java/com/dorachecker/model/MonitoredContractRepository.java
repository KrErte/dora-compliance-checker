package com.dorachecker.model;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface MonitoredContractRepository
    extends JpaRepository<MonitoredContractEntity, String> {
  List<MonitoredContractEntity> findByUserIdOrderByUpdatedAtDesc(String userId);

  List<MonitoredContractEntity> findByMonitoringStatus(String status);

  Optional<MonitoredContractEntity> findByContractAnalysisIdAndUserId(
      String contractAnalysisId, String userId);

  void deleteByUserId(String userId);
}
