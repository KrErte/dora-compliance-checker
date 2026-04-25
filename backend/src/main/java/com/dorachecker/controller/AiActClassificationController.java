package com.dorachecker.controller;

import com.dorachecker.model.ClassificationQuestionEntity;
import com.dorachecker.service.AiActClassificationEngine;
import com.dorachecker.service.AiActClassificationService;
import java.util.List;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
public class AiActClassificationController {

  private final AiActClassificationService classificationService;

  public AiActClassificationController(AiActClassificationService classificationService) {
    this.classificationService = classificationService;
  }

  @GetMapping("/api/ai-systems/{aiSystemId}/classification/questions")
  public ResponseEntity<?> getQuestions(Authentication authentication) {
    if (authentication == null) {
      return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));
    }
    List<ClassificationQuestionEntity> questions = classificationService.getQuestions();
    var dtos =
        questions.stream()
            .map(
                q ->
                    new QuestionDto(
                        q.getId(),
                        q.getQuestionKey(),
                        q.getQuestionTextEn(),
                        q.getQuestionTextEt(),
                        q.getQuestionType(),
                        q.getOptions(),
                        q.getCategory(),
                        q.getHelpTextEn(),
                        q.getHelpTextEt(),
                        q.getSortOrder(),
                        q.getDependsOnKey(),
                        q.getDependsOnAnswer()))
            .toList();
    return ResponseEntity.ok(dtos);
  }

  @PostMapping("/api/ai-systems/{aiSystemId}/classification/run")
  public ResponseEntity<?> classifyAiSystem(
      @PathVariable String aiSystemId,
      @RequestBody ClassifyRequest request,
      Authentication authentication) {
    if (authentication == null) {
      return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));
    }
    String userId = (String) authentication.getPrincipal();
    AiActClassificationEngine.ClassificationResult result =
        classificationService.classifyAiSystem(aiSystemId, userId, request.answers());
    return ResponseEntity.ok(result);
  }

  // Public endpoints — no auth required
  @GetMapping("/api/public/ai-act/classify/questions")
  public ResponseEntity<?> getPublicQuestions() {
    List<ClassificationQuestionEntity> questions = classificationService.getQuestions();
    var dtos =
        questions.stream()
            .map(
                q ->
                    new QuestionDto(
                        q.getId(),
                        q.getQuestionKey(),
                        q.getQuestionTextEn(),
                        q.getQuestionTextEt(),
                        q.getQuestionType(),
                        q.getOptions(),
                        q.getCategory(),
                        q.getHelpTextEn(),
                        q.getHelpTextEt(),
                        q.getSortOrder(),
                        q.getDependsOnKey(),
                        q.getDependsOnAnswer()))
            .toList();
    return ResponseEntity.ok(dtos);
  }

  @PostMapping("/api/public/ai-act/classify")
  public ResponseEntity<?> classifyPublic(@RequestBody ClassifyRequest request) {
    AiActClassificationEngine.ClassificationResult result =
        classificationService.classifyPublic(request.answers());
    return ResponseEntity.ok(result);
  }

  public record ClassifyRequest(Map<String, String> answers) {}

  public record QuestionDto(
      String id,
      String questionKey,
      String questionTextEn,
      String questionTextEt,
      String questionType,
      String options,
      String category,
      String helpTextEn,
      String helpTextEt,
      int sortOrder,
      String dependsOnKey,
      String dependsOnAnswer) {}
}
