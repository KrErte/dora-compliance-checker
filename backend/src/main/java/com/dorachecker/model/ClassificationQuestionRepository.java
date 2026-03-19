package com.dorachecker.model;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ClassificationQuestionRepository extends JpaRepository<ClassificationQuestionEntity, String> {

    List<ClassificationQuestionEntity> findByActiveTrueOrderBySortOrder();

    Optional<ClassificationQuestionEntity> findByQuestionKey(String questionKey);

    long countByActiveTrue();
}
