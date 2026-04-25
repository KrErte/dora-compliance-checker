package com.dorachecker.model;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AiActDocumentRepository extends JpaRepository<AiActDocumentEntity, String> {

  List<AiActDocumentEntity> findByAiSystemIdOrderByCreatedAtDesc(String aiSystemId);

  long countByUserIdAndCreatedAtAfter(String userId, java.time.LocalDateTime after);
}
