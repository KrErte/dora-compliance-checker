package com.dorachecker.model;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface NegotiationMessageRepository
    extends JpaRepository<NegotiationMessageEntity, String> {
  List<NegotiationMessageEntity> findByNegotiationIdOrderByCreatedAtDesc(String negotiationId);

  List<NegotiationMessageEntity> findByNegotiationItemIdOrderByCreatedAtAsc(
      String negotiationItemId);

  void deleteByNegotiationId(String negotiationId);
}
