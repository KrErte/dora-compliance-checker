package com.dorachecker.model;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ClassificationResponseRepository
    extends JpaRepository<ClassificationResponseEntity, String> {

  List<ClassificationResponseEntity> findByAiSystemId(String aiSystemId);

  void deleteAllByAiSystemId(String aiSystemId);
}
