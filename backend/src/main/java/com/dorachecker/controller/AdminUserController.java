package com.dorachecker.controller;

import com.dorachecker.model.UserEntity;
import com.dorachecker.model.UserRepository;
import com.dorachecker.service.AuditLogService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/users")
@PreAuthorize("hasRole('ADMIN')")
public class AdminUserController {

    private final UserRepository userRepository;
    private final AuditLogService auditLog;

    public AdminUserController(UserRepository userRepository, AuditLogService auditLog) {
        this.userRepository = userRepository;
        this.auditLog = auditLog;
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> listUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {

        size = Math.min(size, 200);
        Page<UserEntity> userPage = userRepository.findAll(
                PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt")));

        List<Map<String, Object>> users = userPage.getContent().stream()
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
                    map.put("trialEndsAt", user.getTrialEndsAt() != null ? user.getTrialEndsAt().toString() : "");
                    map.put("trialValid", user.isTrialValid());
                    return map;
                })
                .toList();

        Map<String, Object> response = new HashMap<>();
        response.put("users", users);
        response.put("totalElements", userPage.getTotalElements());
        response.put("totalPages", userPage.getTotalPages());
        response.put("page", page);
        response.put("size", size);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{userId}/extend-trial")
    public ResponseEntity<?> extendTrial(@PathVariable String userId,
                                         @RequestParam(defaultValue = "14") int days,
                                         Authentication auth) {
        return userRepository.findById(userId)
                .map(user -> {
                    user.setTrialEndsAt(LocalDateTime.now().plusDays(days));
                    userRepository.save(user);
                    auditLog.logAdminAction(auth.getName(), "EXTEND_TRIAL", userId,
                            "days=" + days + " email=" + user.getEmail());
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
                                        @RequestBody Map<String, String> updates,
                                        Authentication auth) {
        String adminId = (String) auth.getPrincipal();

        // Prevent admins from modifying their own role
        if (userId.equals(adminId) && updates.containsKey("role")) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Cannot modify your own role"));
        }

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
                            UserEntity.Role newRole = UserEntity.Role.valueOf(updates.get("role"));
                            // Prevent removing the last admin
                            if (user.getRole() == UserEntity.Role.ADMIN && newRole != UserEntity.Role.ADMIN) {
                                long adminCount = userRepository.countByRole(UserEntity.Role.ADMIN);
                                if (adminCount <= 1) {
                                    return ResponseEntity.badRequest()
                                            .body(Map.of("error", "Cannot remove the last admin"));
                                }
                            }
                            user.setRole(newRole);
                        } catch (IllegalArgumentException e) {
                            return ResponseEntity.badRequest()
                                    .body(Map.of("error", "Invalid role: " + updates.get("role")));
                        }
                    }
                    userRepository.save(user);
                    auditLog.logAdminAction(auth.getName(), "UPDATE_USER", userId,
                            "updates=" + updates + " email=" + user.getEmail());
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
