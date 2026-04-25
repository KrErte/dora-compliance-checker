package com.dorachecker.model;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface NegotiationRepository extends JpaRepository<NegotiationEntity, String> {
  List<NegotiationEntity> findByUserIdOrderByUpdatedAtDesc(String userId);

  Optional<NegotiationEntity> findByContractAnalysisIdAndUserId(
      String contractAnalysisId, String userId);

  List<NegotiationEntity> findByUserId(String userId);
}
