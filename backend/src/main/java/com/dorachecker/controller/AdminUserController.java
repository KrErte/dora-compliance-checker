package com.dorachecker.controller;

import com.dorachecker.model.UserEntity;
import com.dorachecker.model.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/users")
public class AdminUserController {

    private final UserRepository userRepository;

    public AdminUserController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> listUsers() {
        List<Map<String, Object>> users = userRepository.findAll().stream()
                .map(user -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("id", user.getId());
                    map.put("email", user.getEmail());
                    map.put("fullName", user.getFullName() != null ? user.getFullName() : "");
                    map.put("role", user.getRole().name());
                    map.put("accountTier", user.getAccountTier().name());
                    map.put("authProvider", user.getAuthProvider().name());
                    map.put("createdAt", user.getCreatedAt().toString());
                    map.put("earlyAdopter", user.isEarlyAdopter());
                    map.put("trialEndDate", user.getTrialEndDate() != null ? user.getTrialEndDate().toString() : "");
                    map.put("trialEndsAt", user.getTrialEndsAt() != null ? user.getTrialEndsAt().toString() : "");
                    map.put("trialValid", user.isTrialValid());
                    return map;
                })
                .toList();
        return ResponseEntity.ok(users);
    }

    @PutMapping("/{userId}/extend-trial")
    public ResponseEntity<?> extendTrial(@PathVariable String userId,
                                         @RequestParam(defaultValue = "14") int days) {
        return userRepository.findById(userId)
                .map(user -> {
                    user.setTrialEndsAt(LocalDateTime.now().plusDays(days));
                    userRepository.save(user);
                    return ResponseEntity.ok(Map.of(
                            "id", user.getId(),
                            "email", user.getEmail(),
                            "trialEndsAt", user.getTrialEndsAt().toString(),
                            "trialValid", user.isTrialValid()
                    ));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{userId}")
    public ResponseEntity<?> updateUser(@PathVariable String userId,
                                        @RequestBody Map<String, String> updates) {
        return userRepository.findById(userId)
                .map(user -> {
                    if (updates.containsKey("accountTier")) {
                        try {
                            user.setAccountTier(UserEntity.AccountTier.valueOf(updates.get("accountTier")));
                        } catch (IllegalArgumentException e) {
                            return ResponseEntity.badRequest()
                                    .body(Map.of("error", "Invalid accountTier: " + updates.get("accountTier")));
                        }
                    }
                    if (updates.containsKey("role")) {
                        try {
                            user.setRole(UserEntity.Role.valueOf(updates.get("role")));
                        } catch (IllegalArgumentException e) {
                            return ResponseEntity.badRequest()
                                    .body(Map.of("error", "Invalid role: " + updates.get("role")));
                        }
                    }
                    userRepository.save(user);
                    return ResponseEntity.ok(Map.of(
                            "id", user.getId(),
                            "email", user.getEmail(),
                            "role", user.getRole().name(),
                            "accountTier", user.getAccountTier().name()
                    ));
                })
                .orElse(ResponseEntity.notFound().build());
    }
}
