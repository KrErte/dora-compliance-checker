package com.dorachecker.service;

import com.dorachecker.model.AiActDocumentEntity;
import com.dorachecker.model.AiActDocumentRepository;
import com.dorachecker.model.AiSystemEntity;
import java.util.List;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class AiActDocumentService {

  private static final Logger log = LoggerFactory.getLogger(AiActDocumentService.class);

  private final AiActDocumentRepository documentRepository;
  private final AiSystemService aiSystemService;
  private final ClaudeApiService claudeApiService;
  private final AiActPromptTemplateService promptTemplateService;

  public AiActDocumentService(
      AiActDocumentRepository documentRepository,
      AiSystemService aiSystemService,
      ClaudeApiService claudeApiService,
      AiActPromptTemplateService promptTemplateService) {
    this.documentRepository = documentRepository;
    this.aiSystemService = aiSystemService;
    this.claudeApiService = claudeApiService;
    this.promptTemplateService = promptTemplateService;
  }

  public List<AiActDocumentEntity> getDocuments(String aiSystemId, String userId) {
    return documentRepository.findByAiSystemIdOrderByCreatedAtDesc(aiSystemId);
  }

  public Optional<AiActDocumentEntity> getDocument(String documentId) {
    return documentRepository.findById(documentId);
  }

  @Transactional
  public AiActDocumentEntity startGeneration(
      String aiSystemId, String userId, String documentType, String additionalContext) {
    Optional<AiSystemEntity> opt = aiSystemService.getAiSystem(aiSystemId, userId);
    if (opt.isEmpty()) {
      throw new RuntimeException("AI System not found");
    }
    AiSystemEntity system = opt.get();

    String title = promptTemplateService.getDocumentTitle(documentType, system.getName());

    AiActDocumentEntity doc = new AiActDocumentEntity();
    doc.setAiSystemId(aiSystemId);
    doc.setDocumentType(documentType);
    doc.setTitle(title);
    doc.setStatus("GENERATING");
    doc.setUserId(userId);
    doc = documentRepository.save(doc);

    // Trigger async generation
    generateContentAsync(doc.getId(), system, documentType, additionalContext);

    return doc;
  }

  @Async
  @Transactional
  public void generateContentAsync(
      String documentId, AiSystemEntity system, String documentType, String additionalContext) {
    try {
      String prompt = promptTemplateService.buildPrompt(documentType, system, additionalContext);
      String content = claudeApiService.analyze(prompt, 8192);

      documentRepository
          .findById(documentId)
          .ifPresent(
              doc -> {
                doc.setContent(content);
                doc.setStatus("COMPLETED");
                documentRepository.save(doc);
              });
      log.info("AI Act document generated successfully: {}", documentId);
    } catch (Exception e) {
      log.error("AI Act document generation failed for {}", documentId, e);
      documentRepository
          .findById(documentId)
          .ifPresent(
              doc -> {
                doc.setStatus("FAILED");
                doc.setContent("Generation failed: " + e.getMessage());
                documentRepository.save(doc);
              });
    }
  }

  @Transactional
  public Optional<AiActDocumentEntity> updateDocument(
      String documentId, String title, String content) {
    return documentRepository
        .findById(documentId)
        .map(
            doc -> {
              if (title != null) doc.setTitle(title);
              if (content != null) doc.setContent(content);
              return documentRepository.save(doc);
            });
  }

  @Transactional
  public boolean deleteDocument(String documentId) {
    if (!documentRepository.existsById(documentId)) return false;
    documentRepository.deleteById(documentId);
    return true;
  }
}
