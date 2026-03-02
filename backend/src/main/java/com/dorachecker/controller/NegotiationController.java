package com.dorachecker.controller;

import com.dorachecker.model.CreateNegotiationRequest;
import com.dorachecker.model.NegotiationResult;
import com.dorachecker.model.NegotiationResult.NegotiationMessageResult;
import com.dorachecker.service.NegotiationService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
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
                                                  @Valid @RequestBody StatusUpdateRequest body,
                                                  Authentication auth) {
        negotiationService.updateItemStatus(itemId, body.status(), getUserId(auth));
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/messages")
    public ResponseEntity<NegotiationMessageResult> addMessage(@PathVariable String id,
                                                                @Valid @RequestBody AddMessageRequest body,
                                                                Authentication auth) {
        NegotiationMessageResult result = negotiationService.addMessage(
                id,
                body.itemId(),
                body.messageType() != null ? body.messageType() : "NOTE",
                body.direction() != null ? body.direction() : "OUTBOUND",
                body.subject(),
                body.body(),
                getUserId(auth)
        );
        return ResponseEntity.ok(result);
    }

    @GetMapping("/{id}/messages")
    public ResponseEntity<List<NegotiationMessageResult>> getMessages(@PathVariable String id, Authentication auth) {
        return ResponseEntity.ok(negotiationService.getMessages(id, getUserId(auth)));
    }

    public record StatusUpdateRequest(
        @NotBlank @Size(max = 50) String status
    ) {}

    public record AddMessageRequest(
        @Size(max = 100) String itemId,
        @Size(max = 50) String messageType,
        @Size(max = 50) String direction,
        @Size(max = 500) String subject,
        @Size(max = 10000) String body
    ) {}
}
