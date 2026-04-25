package com.dorachecker.service;

import com.dorachecker.model.*;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class AiActClassificationService {

  private final ClassificationQuestionRepository questionRepository;
  private final ClassificationResponseRepository responseRepository;
  private final AiActClassificationEngine classificationEngine;
  private final AiSystemService aiSystemService;
  private final AiActObligationService obligationService;

  public AiActClassificationService(
      ClassificationQuestionRepository questionRepository,
      ClassificationResponseRepository responseRepository,
      AiActClassificationEngine classificationEngine,
      AiSystemService aiSystemService,
      AiActObligationService obligationService) {
    this.questionRepository = questionRepository;
    this.responseRepository = responseRepository;
    this.classificationEngine = classificationEngine;
    this.aiSystemService = aiSystemService;
    this.obligationService = obligationService;
  }

  public List<ClassificationQuestionEntity> getQuestions() {
    return questionRepository.findByActiveTrueOrderBySortOrder();
  }

  @Transactional
  public AiActClassificationEngine.ClassificationResult classifyAiSystem(
      String aiSystemId, String userId, Map<String, String> answers) {

    Optional<AiSystemEntity> opt = aiSystemService.getAiSystem(aiSystemId, userId);
    if (opt.isEmpty()) {
      throw new RuntimeException("AI System not found");
    }
    AiSystemEntity system = opt.get();

    // Clear previous responses
    responseRepository.deleteAllByAiSystemId(aiSystemId);

    // Save new responses
    answers.forEach(
        (questionKey, answer) -> {
          questionRepository
              .findByQuestionKey(questionKey)
              .ifPresent(
                  question -> {
                    ClassificationResponseEntity response = new ClassificationResponseEntity();
                    response.setAiSystemId(aiSystemId);
                    response.setQuestionId(question.getId());
                    response.setAnswer(answer);
                    response.setUserId(userId);
                    responseRepository.save(response);
                  });
        });

    // Run classification
    AiActClassificationEngine.ClassificationResult result = classificationEngine.classify(answers);

    // Update AI system
    system.setRiskLevel(result.riskLevel());
    system.setClassifiedAt(LocalDateTime.now());
    system.setClassifiedByUserId(userId);
    aiSystemService.updateAiSystem(system);

    // Generate compliance obligations from classification result
    obligationService.generateObligations(aiSystemId, userId, result);

    return result;
  }

  /** Public classification — no persistence, no auth needed */
  public AiActClassificationEngine.ClassificationResult classifyPublic(
      Map<String, String> answers) {
    return classificationEngine.classify(answers);
  }
}
