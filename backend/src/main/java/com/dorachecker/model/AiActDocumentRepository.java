package com.dorachecker.model;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AiActDocumentRepository extends JpaRepository<AiActDocumentEntity, String> {

    List<AiActDocumentEntity> findByAiSystemIdOrderByCreatedAtDesc(String aiSystemId);

    long countByUserIdAndCreatedAtAfter(String userId, java.time.LocalDateTime after);
}
