package com.dorachecker.model;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface NegotiationRepository extends JpaRepository<NegotiationEntity, String> {
    List<NegotiationEntity> findByUserIdOrderByUpdatedAtDesc(String userId);
    Optional<NegotiationEntity> findByContractAnalysisIdAndUserId(String contractAnalysisId, String userId);
}
