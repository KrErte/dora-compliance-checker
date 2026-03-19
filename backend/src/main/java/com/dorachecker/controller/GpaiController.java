package com.dorachecker.controller;

import com.dorachecker.model.GpaiModelEntity;
import com.dorachecker.model.GpaiObligationEntity;
import com.dorachecker.service.GpaiService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.Map;

@RestController
@RequestMapping("/api/gpai-models")
public class GpaiController {

    private final GpaiService gpaiService;

    public GpaiController(GpaiService gpaiService) {
        this.gpaiService = gpaiService;
    }

    @GetMapping
    public ResponseEntity<?> list(Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));
        }
        String userId = (String) authentication.getPrincipal();
        var models = gpaiService.listModels(userId).stream().map(this::toDto).toList();
        return ResponseEntity.ok(models);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> get(@PathVariable String id, Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));
        }
        String userId = (String) authentication.getPrincipal();
        return gpaiService.getModel(id, userId)
                .map(m -> ResponseEntity.ok(toDto(m)))
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody CreateGpaiModelRequest request, Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));
        }
        String userId = (String) authentication.getPrincipal();

        GpaiModelEntity model = new GpaiModelEntity();
        model.setUserId(userId);
        model.setName(request.name());
        model.setProvider(request.provider());
        model.setModelType(request.modelType() != null ? request.modelType() : "GENERAL");
        model.setHasSystemicRisk(request.hasSystemicRisk() != null && request.hasSystemicRisk());
        model.setTrainingComputeFlops(request.trainingComputeFlops());
        model.setDescription(request.description());
        model.setVersion(request.version());
        model.setOpenSource(request.openSource() != null && request.openSource());

        model = gpaiService.createModel(model);
        return ResponseEntity.ok(toDto(model));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable String id, Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));
        }
        String userId = (String) authentication.getPrincipal();
        boolean deleted = gpaiService.deleteModel(id, userId);
        if (!deleted) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(Map.of("deleted", true));
    }

    @GetMapping("/{id}/obligations")
    public ResponseEntity<?> getObligations(@PathVariable String id, Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));
        }
        var obligations = gpaiService.getObligations(id).stream().map(this::toObligationDto).toList();
        return ResponseEntity.ok(obligations);
    }

    @PatchMapping("/{modelId}/obligations/{obligationId}")
    public ResponseEntity<?> updateObligation(
            @PathVariable String obligationId,
            @RequestBody Map<String, String> body,
            Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));
        }
        String status = body.get("status");
        return gpaiService.updateObligationStatus(obligationId, status)
                .map(o -> ResponseEntity.ok(toObligationDto(o)))
                .orElse(ResponseEntity.notFound().build());
    }

    private GpaiModelDto toDto(GpaiModelEntity m) {
        return new GpaiModelDto(
            m.getId(), m.getName(), m.getProvider(), m.getModelType(),
            m.isHasSystemicRisk(), m.getTrainingComputeFlops(),
            m.getDescription(), m.getVersion(), m.isOpenSource(),
            m.getCreatedAt() != null ? m.getCreatedAt().toString() : null
        );
    }

    private GpaiObligationDto toObligationDto(GpaiObligationEntity o) {
        return new GpaiObligationDto(
            o.getId(), o.getGpaiModelId(), o.getArticleRef(),
            o.getTitle(), o.getDescription(), o.getStatus(), o.getSortOrder()
        );
    }

    public record GpaiModelDto(
        String id, String name, String provider, String modelType,
        boolean hasSystemicRisk, BigDecimal trainingComputeFlops,
        String description, String version, boolean openSource,
        String createdAt
    ) {}

    public record GpaiObligationDto(
        String id, String gpaiModelId, String articleRef,
        String title, String description, String status, int sortOrder
    ) {}

    public record CreateGpaiModelRequest(
        String name, String provider, String modelType,
        Boolean hasSystemicRisk, BigDecimal trainingComputeFlops,
        String description, String version, Boolean openSource
    ) {}
}
