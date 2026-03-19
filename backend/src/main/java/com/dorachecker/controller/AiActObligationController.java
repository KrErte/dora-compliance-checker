package com.dorachecker.controller;

import com.dorachecker.model.AiActObligationEntity;
import com.dorachecker.service.AiActObligationService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/ai-systems/{aiSystemId}/obligations")
public class AiActObligationController {

    private final AiActObligationService obligationService;

    public AiActObligationController(AiActObligationService obligationService) {
        this.obligationService = obligationService;
    }

    @GetMapping
    public ResponseEntity<?> getObligations(@PathVariable String aiSystemId, Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));
        }
        String userId = (String) authentication.getPrincipal();
        var obligations = obligationService.getObligations(aiSystemId, userId);
        var dtos = obligations.stream().map(this::toDto).toList();
        return ResponseEntity.ok(dtos);
    }

    @PatchMapping("/{obligationId}")
    public ResponseEntity<?> updateObligation(
            @PathVariable String aiSystemId,
            @PathVariable String obligationId,
            @RequestBody UpdateObligationRequest request,
            Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));
        }
        var opt = obligationService.updateObligation(obligationId, aiSystemId,
                request.status(), request.notes(), request.assignedToUserId(), request.dueDate());
        return opt.map(o -> ResponseEntity.ok(toDto(o)))
                .orElse(ResponseEntity.notFound().build());
    }

    private ObligationDto toDto(AiActObligationEntity o) {
        return new ObligationDto(
            o.getId(), o.getAiSystemId(), o.getArticleRef(), o.getArticleTitle(),
            o.getDescription(), o.getStatus(), o.getAssignedToUserId(),
            o.getDueDate() != null ? o.getDueDate().toString() : null,
            o.getNotes(), o.getSortOrder()
        );
    }

    public record ObligationDto(
        String id, String aiSystemId, String articleRef, String articleTitle,
        String description, String status, String assignedToUserId,
        String dueDate, String notes, int sortOrder
    ) {}

    public record UpdateObligationRequest(
        String status, String notes, String assignedToUserId, String dueDate
    ) {}
}
