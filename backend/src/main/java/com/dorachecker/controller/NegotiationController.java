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

    private String getUserId(Authentication auth) {
        return (String) auth.getPrincipal();
    }

    @PostMapping
    public ResponseEntity<NegotiationResult> create(@Valid @RequestBody CreateNegotiationRequest request,
                                                     Authentication auth) {
        NegotiationResult result = negotiationService.create(
                request.contractAnalysisId(), request.vendorType(), getUserId(auth)
        );
        return ResponseEntity.ok(result);
    }

    @GetMapping
    public ResponseEntity<List<NegotiationResult>> list(Authentication auth) {
        return ResponseEntity.ok(negotiationService.getByUserId(getUserId(auth)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<NegotiationResult> get(@PathVariable String id, Authentication auth) {
        return ResponseEntity.ok(negotiationService.getById(id, getUserId(auth)));
    }

    @PostMapping("/{id}/generate-strategy")
    public ResponseEntity<NegotiationResult> generateStrategy(@PathVariable String id, Authentication auth) {
        return ResponseEntity.ok(negotiationService.generateStrategy(id, getUserId(auth)));
    }

    @PostMapping("/{id}/generate-email")
    public ResponseEntity<NegotiationMessageResult> generateEmail(@PathVariable String id, Authentication auth) {
        return ResponseEntity.ok(negotiationService.generateEmail(id, getUserId(auth)));
    }

    @PostMapping("/items/{itemId}/generate-email")
    public ResponseEntity<NegotiationMessageResult> generateItemEmail(@PathVariable String itemId, Authentication auth) {
        return ResponseEntity.ok(negotiationService.generateItemEmail(itemId, getUserId(auth)));
    }

    @PutMapping("/items/{itemId}/status")
    public ResponseEntity<Void> updateItemStatus(@PathVariable String itemId,
                                                  @RequestBody Map<String, String> body,
                                                  Authentication auth) {
        String status = body.get("status");
        if (status == null || status.isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        negotiationService.updateItemStatus(itemId, status, getUserId(auth));
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/messages")
    public ResponseEntity<NegotiationMessageResult> addMessage(@PathVariable String id,
                                                                @RequestBody Map<String, String> body,
                                                                Authentication auth) {
        NegotiationMessageResult result = negotiationService.addMessage(
                id,
                body.get("itemId"),
                body.getOrDefault("messageType", "NOTE"),
                body.getOrDefault("direction", "OUTBOUND"),
                body.get("subject"),
                body.get("body"),
                getUserId(auth)
        );
        return ResponseEntity.ok(result);
    }

    @GetMapping("/{id}/messages")
    public ResponseEntity<List<NegotiationMessageResult>> getMessages(@PathVariable String id, Authentication auth) {
        return ResponseEntity.ok(negotiationService.getMessages(id, getUserId(auth)));
    }
}
