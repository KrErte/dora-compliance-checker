package com.dorachecker.controller;

import com.dorachecker.model.AiActDocumentEntity;
import com.dorachecker.service.AiActDocumentService;
import com.dorachecker.service.PdfExportService;
import java.time.LocalDateTime;
import java.util.Map;
import org.springframework.http.*;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/ai-systems/{aiSystemId}/documents")
public class AiActDocumentController {

  private final AiActDocumentService documentService;
  private final PdfExportService pdfExportService;

  public AiActDocumentController(
      AiActDocumentService documentService, PdfExportService pdfExportService) {
    this.documentService = documentService;
    this.pdfExportService = pdfExportService;
  }

  @GetMapping
  public ResponseEntity<?> list(@PathVariable String aiSystemId, Authentication authentication) {
    if (authentication == null) {
      return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));
    }
    String userId = (String) authentication.getPrincipal();
    var docs = documentService.getDocuments(aiSystemId, userId).stream().map(this::toDto).toList();
    return ResponseEntity.ok(docs);
  }

  @GetMapping("/{documentId}")
  public ResponseEntity<?> get(@PathVariable String documentId, Authentication authentication) {
    if (authentication == null) {
      return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));
    }
    return documentService
        .getDocument(documentId)
        .map(d -> ResponseEntity.ok(toDto(d)))
        .orElse(ResponseEntity.notFound().build());
  }

  @PostMapping("/generate")
  public ResponseEntity<?> generate(
      @PathVariable String aiSystemId,
      @RequestBody GenerateDocumentRequest request,
      Authentication authentication) {
    if (authentication == null) {
      return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));
    }
    String userId = (String) authentication.getPrincipal();
    AiActDocumentEntity doc =
        documentService.startGeneration(
            aiSystemId, userId, request.documentType(), request.additionalContext());
    return ResponseEntity.accepted().body(toDto(doc));
  }

  @PutMapping("/{documentId}")
  public ResponseEntity<?> update(
      @PathVariable String documentId,
      @RequestBody UpdateDocumentRequest request,
      Authentication authentication) {
    if (authentication == null) {
      return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));
    }
    return documentService
        .updateDocument(documentId, request.title(), request.content())
        .map(d -> ResponseEntity.ok(toDto(d)))
        .orElse(ResponseEntity.notFound().build());
  }

  @DeleteMapping("/{documentId}")
  public ResponseEntity<?> delete(@PathVariable String documentId, Authentication authentication) {
    if (authentication == null) {
      return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));
    }
    boolean deleted = documentService.deleteDocument(documentId);
    if (!deleted) return ResponseEntity.notFound().build();
    return ResponseEntity.ok(Map.of("deleted", true));
  }

  @GetMapping("/{documentId}/export/pdf")
  public ResponseEntity<?> exportPdf(
      @PathVariable String documentId, Authentication authentication) {
    if (authentication == null) {
      return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));
    }
    var opt = documentService.getDocument(documentId);
    if (opt.isEmpty()) return ResponseEntity.notFound().build();
    AiActDocumentEntity doc = opt.get();
    if (doc.getContent() == null || doc.getContent().isBlank()) {
      return ResponseEntity.badRequest().body(Map.of("error", "Document has no content to export"));
    }

    byte[] pdf = pdfExportService.exportMarkdownToPdf(doc.getContent(), doc.getTitle());

    HttpHeaders headers = new HttpHeaders();
    headers.setContentType(MediaType.APPLICATION_PDF);
    headers.setContentDisposition(
        ContentDisposition.attachment()
            .filename(sanitizeFilename(doc.getTitle()) + ".pdf")
            .build());
    return new ResponseEntity<>(pdf, headers, HttpStatus.OK);
  }

  private DocumentDto toDto(AiActDocumentEntity d) {
    return new DocumentDto(
        d.getId(),
        d.getAiSystemId(),
        d.getDocumentType(),
        d.getTitle(),
        d.getContent(),
        d.getFormat(),
        d.getStatus(),
        d.getVersion(),
        d.getParentId(),
        d.getCreatedAt(),
        d.getUpdatedAt());
  }

  private String sanitizeFilename(String name) {
    return name.replaceAll("[^a-zA-Z0-9\\-_ ]", "").replaceAll("\\s+", "_");
  }

  public record DocumentDto(
      String id,
      String aiSystemId,
      String documentType,
      String title,
      String content,
      String format,
      String status,
      int version,
      String parentId,
      LocalDateTime createdAt,
      LocalDateTime updatedAt) {}

  public record GenerateDocumentRequest(String documentType, String additionalContext) {}

  public record UpdateDocumentRequest(String title, String content) {}
}
