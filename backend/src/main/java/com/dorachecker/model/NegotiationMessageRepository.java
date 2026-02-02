package com.dorachecker.model;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NegotiationMessageRepository extends JpaRepository<NegotiationMessageEntity, String> {
    List<NegotiationMessageEntity> findByNegotiationIdOrderByCreatedAtDesc(String negotiationId);
    List<NegotiationMessageEntity> findByNegotiationItemIdOrderByCreatedAtAsc(String negotiationItemId);
}
