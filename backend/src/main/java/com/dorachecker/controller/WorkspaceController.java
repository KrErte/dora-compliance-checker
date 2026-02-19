package com.dorachecker.controller;

import com.dorachecker.model.*;
import com.dorachecker.service.ClaudeApiService;
import com.dorachecker.service.DocumentExtractionService;
import com.dorachecker.service.WorkspaceService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/workspace")
public class WorkspaceController {

    private static final Logger log = LoggerFactory.getLogger(WorkspaceController.class);

    private final WorkspaceProjectRepository projectRepository;
    private final WorkspaceService workspaceService;
    private final DocumentExtractionService documentService;
    private final ClaudeApiService claudeService;
    private final ObjectMapper objectMapper;

    public WorkspaceController(
            WorkspaceProjectRepository projectRepository,
            WorkspaceService workspaceService,
            DocumentExtractionService documentService,
            ClaudeApiService claudeService,
            ObjectMapper objectMapper) {
        this.projectRepository = projectRepository;
        this.workspaceService = workspaceService;
        this.documentService = documentService;
        this.claudeService = claudeService;
        this.objectMapper = objectMapper;
    }

    @GetMapping("/checklists")
    public ResponseEntity<?> getChecklists() {
        return ResponseEntity.ok(workspaceService.getRegulationChecklists());
    }

    @PostMapping("/projects")
    public ResponseEntity<?> createProject(@RequestBody CreateProjectRequest request) {
        try {
            WorkspaceProjectEntity project = workspaceService.createProject(
                request.name(),
                request.email()
            );

            // Log audit
            logAudit(project, request.email(), "owner", "created", "Project created: " + request.name(), null);

            return ResponseEntity.ok(Map.of(
                "id", project.getId(),
                "name", project.getName(),
                "status", project.getStatus(),
                "createdAt", project.getCreatedAt(),
                "expiresAt", project.getExpiresAt()
            ));
        } catch (Exception e) {
            log.error("Error creating project", e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/projects/{id}")
    public ResponseEntity<?> getProject(@PathVariable String id) {
        return projectRepository.findById(id)
            .map(project -> ResponseEntity.ok(buildProjectResponse(project)))
            .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/projects/{id}/analyze")
    public ResponseEntity<?> analyzeContract(
            @PathVariable String id,
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "regulations", defaultValue = "DORA_ART30") String regulations,
            @RequestParam(value = "email", required = false) String email) {
        try {
            WorkspaceProjectEntity project = projectRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Project not found"));

            // Extract text from document
            String text = documentService.extractText(file);
            if (text == null || text.isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Could not extract text from document"));
            }

            // Create document record
            WorkspaceDocumentEntity doc = new WorkspaceDocumentEntity();
            doc.setProject(project);
            doc.setFilename(file.getOriginalFilename());
            doc.setFileHash(workspaceService.calculateFileHash(file.getBytes()));
            doc.setFileSize(file.getSize());
            doc.setMimeType(file.getContentType());
            project.getDocuments().add(doc);

            // Analyze against each regulation
            String[] regs = regulations.split(",");
            List<Map<String, Object>> analysisResults = new ArrayList<>();

            for (String reg : regs) {
                String regulation = reg.trim();
                var checks = workspaceService.getChecksForRegulation(regulation);
                if (checks.isEmpty()) continue;

                // Build AI prompt for gap analysis
                String prompt = buildAnalysisPrompt(text, regulation, checks);
                String aiResponse = claudeService.analyze(prompt);

                // Parse AI response and create gap result
                var gapResult = parseGapAnalysis(project, regulation, checks, aiResponse);
                project.getGapResults().add(gapResult);

                analysisResults.add(Map.of(
                    "regulation", regulation,
                    "totalChecks", gapResult.getTotalChecks(),
                    "passed", gapResult.getPassed(),
                    "failed", gapResult.getFailed(),
                    "partial", gapResult.getPartial(),
                    "compliancePercentage", gapResult.getCompliancePercentage()
                ));
            }

            doc.setProcessed(true);
            project.setStatus("analyzed");
            projectRepository.save(project);

            // Log audit
            logAudit(project, email != null ? email : "anonymous", "owner", "analyzed",
                    "Document analyzed: " + file.getOriginalFilename(), null);

            return ResponseEntity.ok(Map.of(
                "projectId", project.getId(),
                "documentId", doc.getId(),
                "results", analysisResults
            ));

        } catch (Exception e) {
            log.error("Error analyzing contract", e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/projects/{id}/manual-check")
    public ResponseEntity<?> submitManualCheck(
            @PathVariable String id,
            @RequestBody ManualCheckRequest request) {
        try {
            WorkspaceProjectEntity project = projectRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Project not found"));

            // Create gap result from manual checks
            var checks = workspaceService.getChecksForRegulation(request.regulation());
            int passed = 0, failed = 0, partial = 0;

            List<Map<String, Object>> details = new ArrayList<>();
            for (var check : checks) {
                String status = request.checkResults().getOrDefault(check.id(), "not_checked");
                if ("passed".equals(status)) passed++;
                else if ("failed".equals(status)) failed++;
                else if ("partial".equals(status)) partial++;

                details.add(Map.of(
                    "id", check.id(),
                    "name", check.name(),
                    "description", check.description(),
                    "reference", check.reference(),
                    "status", status,
                    "comment", request.comments().getOrDefault(check.id(), "")
                ));
            }

            WorkspaceGapResultEntity gapResult = new WorkspaceGapResultEntity();
            gapResult.setProject(project);
            gapResult.setRegulation(request.regulation());
            gapResult.setTotalChecks(checks.size());
            gapResult.setPassed(passed);
            gapResult.setFailed(failed);
            gapResult.setPartial(partial);
            gapResult.setDetailsJson(objectMapper.writeValueAsString(details));
            project.getGapResults().add(gapResult);

            projectRepository.save(project);

            return ResponseEntity.ok(Map.of(
                "regulation", request.regulation(),
                "totalChecks", checks.size(),
                "passed", passed,
                "failed", failed,
                "partial", partial,
                "compliancePercentage", gapResult.getCompliancePercentage()
            ));
        } catch (Exception e) {
            log.error("Error submitting manual check", e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/projects/{id}/review")
    public ResponseEntity<?> submitReview(
            @PathVariable String id,
            @RequestBody SubmitReviewRequest request) {
        try {
            WorkspaceProjectEntity project = projectRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Project not found"));

            WorkspaceReviewEntity review = new WorkspaceReviewEntity();
            review.setProject(project);
            review.setReviewerEmail(request.email());
            review.setReviewerRole(request.role());
            review.setStatus(request.status());
            review.setComments(request.comments());
            review.setReviewedAt(LocalDateTime.now());
            project.getReviews().add(review);

            // Update project status if all reviews complete
            updateProjectStatus(project);
            projectRepository.save(project);

            logAudit(project, request.email(), request.role(), "reviewed",
                    "Review submitted: " + request.status(), null);

            return ResponseEntity.ok(Map.of("status", "saved", "reviewId", review.getId()));
        } catch (Exception e) {
            log.error("Error submitting review", e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/projects/{id}/audit-trail")
    public ResponseEntity<?> getAuditTrail(@PathVariable String id) {
        return projectRepository.findById(id)
            .map(project -> {
                var logs = project.getAuditLogs().stream()
                    .sorted((a, b) -> b.getTimestamp().compareTo(a.getTimestamp()))
                    .map(log -> Map.of(
                        "id", log.getId(),
                        "user", log.getUserEmail(),
                        "role", log.getUserRole(),
                        "action", log.getAction(),
                        "details", log.getDetails() != null ? log.getDetails() : "",
                        "timestamp", log.getTimestamp()
                    ))
                    .toList();
                return ResponseEntity.ok(logs);
            })
            .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/projects/{id}/gap-report")
    public ResponseEntity<?> getGapReport(@PathVariable String id) {
        return projectRepository.findById(id)
            .map(project -> {
                List<Map<String, Object>> report = new ArrayList<>();
                for (var gap : project.getGapResults()) {
                    try {
                        List<?> details = gap.getDetailsJson() != null
                            ? objectMapper.readValue(gap.getDetailsJson(), List.class)
                            : List.of();

                        report.add(Map.of(
                            "regulation", gap.getRegulation(),
                            "totalChecks", gap.getTotalChecks(),
                            "passed", gap.getPassed(),
                            "failed", gap.getFailed(),
                            "partial", gap.getPartial(),
                            "compliancePercentage", gap.getCompliancePercentage(),
                            "details", details
                        ));
                    } catch (Exception e) {
                        log.error("Error parsing gap details", e);
                    }
                }
                return ResponseEntity.ok(report);
            })
            .orElse(ResponseEntity.notFound().build());
    }

    private String buildAnalysisPrompt(String contractText, String regulation, List<WorkspaceService.RegulationCheck> checks) {
        StringBuilder prompt = new StringBuilder();
        prompt.append("Analyze this ICT contract against ").append(regulation).append(" requirements.\n\n");
        prompt.append("CONTRACT TEXT:\n").append(contractText.substring(0, Math.min(contractText.length(), 15000))).append("\n\n");
        prompt.append("CHECK EACH REQUIREMENT and respond with ONLY a JSON array:\n");

        for (var check : checks) {
            prompt.append("- ").append(check.id()).append(": ").append(check.name()).append(" (").append(check.reference()).append(")\n");
        }

        prompt.append("\nRespond with JSON array: [{\"id\": \"check_id\", \"status\": \"passed|failed|partial\", \"evidence\": \"quote or reason\"}]\n");
        prompt.append("Be strict - only mark as 'passed' if clearly addressed. Mark 'partial' if mentioned but incomplete. Mark 'failed' if not found.");

        return prompt.toString();
    }

    private WorkspaceGapResultEntity parseGapAnalysis(WorkspaceProjectEntity project, String regulation,
                                                       List<WorkspaceService.RegulationCheck> checks, String aiResponse) {
        int passed = 0, failed = 0, partial = 0;
        List<Map<String, Object>> details = new ArrayList<>();

        try {
            // Try to parse JSON from AI response
            String jsonStr = aiResponse;
            int start = aiResponse.indexOf('[');
            int end = aiResponse.lastIndexOf(']');
            if (start >= 0 && end > start) {
                jsonStr = aiResponse.substring(start, end + 1);
            }

            log.info("Parsing AI response for {}: length={}", regulation, jsonStr.length());

            List<Map<String, Object>> aiResults = objectMapper.readValue(jsonStr,
                objectMapper.getTypeFactory().constructCollectionType(List.class, Map.class));

            Map<String, Map<String, Object>> resultMap = new HashMap<>();
            for (var result : aiResults) {
                resultMap.put((String) result.get("id"), result);
            }

            for (var check : checks) {
                var result = resultMap.get(check.id());
                String status = result != null ? (String) result.get("status") : "not_checked";
                String evidence = result != null ? (String) result.get("evidence") : "";

                if ("passed".equals(status)) passed++;
                else if ("partial".equals(status)) partial++;
                else failed++;

                details.add(Map.of(
                    "id", check.id(),
                    "name", check.name(),
                    "description", check.description(),
                    "reference", check.reference(),
                    "status", status,
                    "evidence", evidence != null ? evidence : ""
                ));
            }
        } catch (Exception e) {
            log.error("Error parsing AI response, falling back to failed", e);
            for (var check : checks) {
                failed++;
                details.add(Map.of(
                    "id", check.id(),
                    "name", check.name(),
                    "description", check.description(),
                    "reference", check.reference(),
                    "status", "not_checked",
                    "evidence", ""
                ));
            }
        }

        WorkspaceGapResultEntity gapResult = new WorkspaceGapResultEntity();
        gapResult.setProject(project);
        gapResult.setRegulation(regulation);
        gapResult.setTotalChecks(checks.size());
        gapResult.setPassed(passed);
        gapResult.setFailed(failed);
        gapResult.setPartial(partial);

        try {
            gapResult.setDetailsJson(objectMapper.writeValueAsString(details));
        } catch (Exception e) {
            log.error("Error serializing details", e);
        }

        return gapResult;
    }

    private void updateProjectStatus(WorkspaceProjectEntity project) {
        long totalReviews = project.getReviews().size();
        long completedReviews = project.getReviews().stream()
            .filter(r -> !"pending".equals(r.getStatus()))
            .count();

        if (completedReviews > 0 && completedReviews == totalReviews) {
            project.setStatus("completed");
        } else if (completedReviews > 0) {
            project.setStatus("in_review");
        }
    }

    private void logAudit(WorkspaceProjectEntity project, String email, String role, String action, String details, String ip) {
        WorkspaceAuditLogEntity log = new WorkspaceAuditLogEntity();
        log.setProject(project);
        log.setUserEmail(email);
        log.setUserRole(role);
        log.setAction(action);
        log.setDetails(details);
        log.setIpAddress(ip);
        project.getAuditLogs().add(log);
    }

    private Map<String, Object> buildProjectResponse(WorkspaceProjectEntity project) {
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("id", project.getId());
        response.put("name", project.getName());
        response.put("status", project.getStatus());
        response.put("createdAt", project.getCreatedAt());
        response.put("expiresAt", project.getExpiresAt());

        response.put("documents", project.getDocuments().stream().map(d -> Map.of(
            "id", d.getId(),
            "filename", d.getFilename(),
            "uploadedAt", d.getUploadedAt(),
            "processed", d.isProcessed()
        )).toList());

        response.put("gapResults", project.getGapResults().stream().map(g -> Map.of(
            "regulation", g.getRegulation(),
            "totalChecks", g.getTotalChecks(),
            "passed", g.getPassed(),
            "failed", g.getFailed(),
            "partial", g.getPartial(),
            "compliancePercentage", g.getCompliancePercentage()
        )).toList());

        response.put("reviews", project.getReviews().stream().map(r -> Map.of(
            "role", r.getReviewerRole(),
            "status", r.getStatus(),
            "reviewedAt", r.getReviewedAt()
        )).toList());

        // Calculate review progress
        int totalRoles = 4; // account_manager, technical_lead, ceo, legal_counsel
        int reviewedRoles = (int) project.getReviews().stream()
            .filter(r -> !"pending".equals(r.getStatus()))
            .map(WorkspaceReviewEntity::getReviewerRole)
            .distinct()
            .count();
        response.put("reviewProgress", (reviewedRoles * 100) / totalRoles);

        return response;
    }

    record CreateProjectRequest(String name, String email) {}
    record ManualCheckRequest(String regulation, Map<String, String> checkResults, Map<String, String> comments) {}
    record SubmitReviewRequest(String email, String role, String status, String comments) {}
}
