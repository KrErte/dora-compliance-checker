package com.dorachecker.controller;

import com.dorachecker.model.ContactMessage;
import com.dorachecker.model.ContactMessageRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Map;

@RestController
@RequestMapping("/api/contact")
public class ContactController {

    private final ContactMessageRepository repository;

    public ContactController(ContactMessageRepository repository) {
        this.repository = repository;
    }

    public record ContactRequest(
            @NotBlank String name,
            @NotBlank @Email String email,
            String reason,
            @NotBlank @Size(max = 2000) String message
    ) {}

    @PostMapping
    public ResponseEntity<?> submitContact(@Valid @RequestBody ContactRequest request) {
        ContactMessage msg = new ContactMessage();
        msg.setName(request.name().trim());
        msg.setEmail(request.email().trim());
        msg.setReason(request.reason());
        msg.setMessage(request.message().trim());
        msg.setCreatedAt(LocalDateTime.now());
        repository.save(msg);

        return ResponseEntity.ok(Map.of("success", true));
    }
}
