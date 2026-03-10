package com.dorachecker.controller;

import com.dorachecker.service.AchievementService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/achievements")
public class AchievementController {

    private final AchievementService achievementService;

    public AchievementController(AchievementService achievementService) {
        this.achievementService = achievementService;
    }

    @GetMapping
    public ResponseEntity<?> getAchievements(Authentication authentication) {
        String userId = authentication != null ? (String) authentication.getPrincipal() : null;
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "UNAUTHORIZED"));
        }
        return ResponseEntity.ok(achievementService.getUserAchievements(userId));
    }

    @PostMapping("/check")
    public ResponseEntity<?> checkAchievements(Authentication authentication) {
        String userId = authentication != null ? (String) authentication.getPrincipal() : null;
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "UNAUTHORIZED"));
        }
        List<String> newlyUnlocked = achievementService.checkAndUnlock(userId);
        return ResponseEntity.ok(Map.of("newlyUnlocked", newlyUnlocked));
    }

    @PostMapping("/{key}/seen")
    public ResponseEntity<?> markSeen(
            @PathVariable String key,
            Authentication authentication
    ) {
        String userId = authentication != null ? (String) authentication.getPrincipal() : null;
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "UNAUTHORIZED"));
        }
        achievementService.markSeen(userId, key);
        return ResponseEntity.ok(Map.of("success", true));
    }
}
