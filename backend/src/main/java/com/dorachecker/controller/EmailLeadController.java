package com.dorachecker.controller;

import com.dorachecker.model.EmailLeadEntity;
import com.dorachecker.model.EmailLeadRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Map;

@RestController
@RequestMapping("/api/public/leads")
public class EmailLeadController {

    private final EmailLeadRepository emailLeadRepository;

    public EmailLeadController(EmailLeadRepository emailLeadRepository) {
        this.emailLeadRepository = emailLeadRepository;
    }

    @PostMapping("/email")
    public ResponseEntity<Map<String, Object>> captureEmail(
            @RequestBody CaptureEmailRequest request,
            HttpServletRequest httpRequest) {

        if (request.email() == null || request.email().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email is required"));
        }

        String email = request.email().trim().toLowerCase();

        // Deduplicate per assessment
        if (request.assessmentId() != null &&
                emailLeadRepository.existsByEmailAndAssessmentId(email, request.assessmentId())) {
            return ResponseEntity.ok(Map.of("success", true, "duplicate", true));
        }

        EmailLeadEntity lead = new EmailLeadEntity();
        lead.setEmail(email);
        lead.setSource(request.source() != null ? request.source() : "assessment_results");
        lead.setAssessmentId(request.assessmentId());
        lead.setAssessmentScore(request.assessmentScore());
        lead.setIpHash(hashIp(getClientIp(httpRequest)));

        emailLeadRepository.save(lead);

        return ResponseEntity.ok(Map.of("success", true));
    }

    private String getClientIp(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

    private String hashIp(String ip) {
        if (ip == null) return null;
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(ip.getBytes(StandardCharsets.UTF_8));
            StringBuilder hex = new StringBuilder();
            for (byte b : hash) {
                String h = Integer.toHexString(0xff & b);
                if (h.length() == 1) hex.append('0');
                hex.append(h);
            }
            return hex.toString();
        } catch (NoSuchAlgorithmException e) {
            return null;
        }
    }

    public record CaptureEmailRequest(
            String email,
            String source,
            String assessmentId,
            Integer assessmentScore
    ) {}
}
