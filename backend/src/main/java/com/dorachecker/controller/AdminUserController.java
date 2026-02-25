package com.dorachecker.controller;

import com.dorachecker.model.UserEntity;
import com.dorachecker.model.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

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
                .map(user -> Map.<String, Object>of(
                        "id", user.getId(),
                        "email", user.getEmail(),
                        "fullName", user.getFullName() != null ? user.getFullName() : "",
                        "role", user.getRole().name(),
                        "accountTier", user.getAccountTier().name(),
                        "authProvider", user.getAuthProvider().name(),
                        "createdAt", user.getCreatedAt().toString(),
                        "earlyAdopter", user.isEarlyAdopter(),
                        "trialEndDate", user.getTrialEndDate() != null ? user.getTrialEndDate().toString() : ""
                ))
                .toList();
        return ResponseEntity.ok(users);
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
