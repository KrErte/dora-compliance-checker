package com.dorachecker.model;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface NegotiationItemRepository extends JpaRepository<NegotiationItemEntity, String> {
  List<NegotiationItemEntity> findByNegotiationIdOrderByPriorityAsc(String negotiationId);

  void deleteByNegotiationId(String negotiationId);
}
