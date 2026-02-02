package com.dorachecker.controller;

import com.dorachecker.model.CreateNegotiationRequest;
import com.dorachecker.model.NegotiationResult;
import com.dorachecker.model.NegotiationResult.NegotiationMessageResult;
import com.dorachecker.service.NegotiationService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/negotiations")
public class NegotiationController {

    private final NegotiationService negotiationService;

    public NegotiationController(NegotiationService negotiationService) {
        this.negotiationService = negotiationService;
    }

    @PostMapping
    public ResponseEntity<NegotiationResult> create(@Valid @RequestBody CreateNegotiationRequest request,
                                                     Authentication authentication) {
        String userId = (String) authentication.getPrincipal();
        NegotiationResult result = negotiationService.create(
                request.contractAnalysisId(), request.vendorType(), userId
        );
        return ResponseEntity.ok(result);
    }

    @GetMapping
    public ResponseEntity<List<NegotiationResult>> list(Authentication authentication) {
        String userId = (String) authentication.getPrincipal();
        return ResponseEntity.ok(negotiationService.getByUserId(userId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<NegotiationResult> get(@PathVariable String id,
                                                  Authentication authentication) {
        String userId = (String) authentication.getPrincipal();
        return ResponseEntity.ok(negotiationService.getById(id, userId));
    }

    @PostMapping("/{id}/generate-strategy")
    public ResponseEntity<NegotiationResult> generateStrategy(@PathVariable String id,
                                                               Authentication authentication) {
        String userId = (String) authentication.getPrincipal();
        return ResponseEntity.ok(negotiationService.generateStrategy(id, userId));
    }

    @PostMapping("/{id}/generate-email")
    public ResponseEntity<NegotiationMessageResult> generateEmail(@PathVariable String id,
                                                                    Authentication authentication) {
        String userId = (String) authentication.getPrincipal();
        return ResponseEntity.ok(negotiationService.generateEmail(id, userId));
    }

    @PostMapping("/items/{itemId}/generate-email")
    public ResponseEntity<NegotiationMessageResult> generateItemEmail(@PathVariable String itemId,
                                                                       Authentication authentication) {
        String userId = (String) authentication.getPrincipal();
        return ResponseEntity.ok(negotiationService.generateItemEmail(itemId, userId));
    }

    @PutMapping("/items/{itemId}/status")
    public ResponseEntity<Void> updateItemStatus(@PathVariable String itemId,
                                                  @RequestBody Map<String, String> body,
                                                  Authentication authentication) {
        String userId = (String) authentication.getPrincipal();
        String status = body.get("status");
        if (status == null || status.isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        negotiationService.updateItemStatus(itemId, status, userId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/messages")
    public ResponseEntity<NegotiationMessageResult> addMessage(@PathVariable String id,
                                                                @RequestBody Map<String, String> body,
                                                                Authentication authentication) {
        String userId = (String) authentication.getPrincipal();
        NegotiationMessageResult result = negotiationService.addMessage(
                id,
                body.get("itemId"),
                body.getOrDefault("messageType", "NOTE"),
                body.getOrDefault("direction", "OUTBOUND"),
                body.get("subject"),
                body.get("body"),
                userId
        );
        return ResponseEntity.ok(result);
    }

    @GetMapping("/{id}/messages")
    public ResponseEntity<List<NegotiationMessageResult>> getMessages(@PathVariable String id,
                                                                       Authentication authentication) {
        String userId = (String) authentication.getPrincipal();
        return ResponseEntity.ok(negotiationService.getMessages(id, userId));
    }
}
