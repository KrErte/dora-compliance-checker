package com.dorachecker.controller;

import com.dorachecker.model.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/early-adopter")
public class EarlyAdopterController {

    private final UserRepository userRepository;
    private static final int TOTAL_SLOTS = 10;

    public EarlyAdopterController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> getStatus() {
        long usedSlots = 0;
        try {
            usedSlots = userRepository.countByEarlyAdopterTrue();
        } catch (Exception e) {
            // Field may not exist yet, return 0
        }

        long remainingSlots = Math.max(0, TOTAL_SLOTS - usedSlots);

        Map<String, Object> response = new HashMap<>();
        response.put("totalSlots", TOTAL_SLOTS);
        response.put("usedSlots", usedSlots);
        response.put("remainingSlots", remainingSlots);
        response.put("isAvailable", remainingSlots > 0);

        return ResponseEntity.ok(response);
    }
}
