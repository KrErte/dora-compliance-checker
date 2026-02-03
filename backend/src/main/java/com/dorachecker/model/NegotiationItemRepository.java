package com.dorachecker.model;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NegotiationItemRepository extends JpaRepository<NegotiationItemEntity, String> {
    List<NegotiationItemEntity> findByNegotiationIdOrderByPriorityAsc(String negotiationId);
}
