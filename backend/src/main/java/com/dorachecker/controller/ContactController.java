package com.dorachecker.controller;

import com.dorachecker.model.ContactMessage;
import com.dorachecker.model.ContactMessageRepository;
import com.dorachecker.service.ResendEmailService;
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
    private final ResendEmailService emailService;

    public ContactController(ContactMessageRepository repository, ResendEmailService emailService) {
        this.repository = repository;
        this.emailService = emailService;
    }

    public record ContactRequest(
            @NotBlank @Size(max = 100) String name,
            @NotBlank @Email @Size(max = 255) String email,
            @Size(max = 100) String reason,
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

        emailService.sendContactNotification(msg);

        return ResponseEntity.ok(Map.of("success", true));
    }
}
