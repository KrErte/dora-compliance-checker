package com.dorachecker.model;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MonitoredContractRepository extends JpaRepository<MonitoredContractEntity, String> {
    List<MonitoredContractEntity> findByUserIdOrderByUpdatedAtDesc(String userId);
    List<MonitoredContractEntity> findByMonitoringStatus(String status);
    Optional<MonitoredContractEntity> findByContractAnalysisIdAndUserId(String contractAnalysisId, String userId);
}
