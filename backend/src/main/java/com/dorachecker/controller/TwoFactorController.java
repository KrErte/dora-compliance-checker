package com.dorachecker.controller;

import com.dorachecker.model.UserEntity;
import com.dorachecker.model.UserRepository;
import dev.samstevens.totp.code.*;
import dev.samstevens.totp.qr.QrData;
import dev.samstevens.totp.secret.DefaultSecretGenerator;
import dev.samstevens.totp.time.SystemTimeProvider;
import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.IntStream;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/2fa")
public class TwoFactorController {

  private final UserRepository userRepository;

  public TwoFactorController(UserRepository userRepository) {
    this.userRepository = userRepository;
  }

  @PostMapping("/setup")
  public ResponseEntity<?> setup(Authentication auth) {
    String userId = (String) auth.getPrincipal();
    UserEntity user = userRepository.findById(userId).orElse(null);
    if (user == null) return ResponseEntity.status(404).body(Map.of("error", "User not found"));

    if (user.isTotpEnabled()) {
      return ResponseEntity.badRequest().body(Map.of("error", "2FA is already enabled"));
    }

    String secret = new DefaultSecretGenerator().generate();
    user.setTotpSecret(secret);
    userRepository.save(user);

    String otpAuthUrl =
        new QrData.Builder()
            .label(user.getEmail())
            .secret(secret)
            .issuer("DoraAudit")
            .algorithm(HashingAlgorithm.SHA1)
            .digits(6)
            .period(30)
            .build()
            .getUri();

    return ResponseEntity.ok(
        Map.of(
            "secret", secret,
            "qrCodeUrl", otpAuthUrl));
  }

  @PostMapping("/verify")
  public ResponseEntity<?> verify(@RequestBody Map<String, String> body, Authentication auth) {
    String userId = (String) auth.getPrincipal();
    String code = body.get("code");
    if (code == null || code.isBlank()) {
      return ResponseEntity.badRequest().body(Map.of("error", "Code is required"));
    }

    UserEntity user = userRepository.findById(userId).orElse(null);
    if (user == null) return ResponseEntity.status(404).body(Map.of("error", "User not found"));
    if (user.getTotpSecret() == null) {
      return ResponseEntity.badRequest().body(Map.of("error", "2FA setup not initiated"));
    }

    if (!verifyCode(user.getTotpSecret(), code)) {
      return ResponseEntity.badRequest().body(Map.of("error", "Invalid verification code"));
    }

    // Generate backup codes
    List<String> backupCodes =
        IntStream.range(0, 8)
            .mapToObj(i -> UUID.randomUUID().toString().substring(0, 8).toUpperCase())
            .collect(Collectors.toList());

    user.setTotpEnabled(true);
    user.setTotpBackupCodes(String.join(",", backupCodes));
    userRepository.save(user);

    return ResponseEntity.ok(Map.of("enabled", true, "backupCodes", backupCodes));
  }

  @PostMapping("/disable")
  public ResponseEntity<?> disable(@RequestBody Map<String, String> body, Authentication auth) {
    String userId = (String) auth.getPrincipal();
    String code = body.get("code");
    if (code == null || code.isBlank()) {
      return ResponseEntity.badRequest().body(Map.of("error", "Code is required"));
    }

    UserEntity user = userRepository.findById(userId).orElse(null);
    if (user == null) return ResponseEntity.status(404).body(Map.of("error", "User not found"));
    if (!user.isTotpEnabled()) {
      return ResponseEntity.badRequest().body(Map.of("error", "2FA is not enabled"));
    }

    if (!verifyCode(user.getTotpSecret(), code)) {
      return ResponseEntity.badRequest().body(Map.of("error", "Invalid verification code"));
    }

    user.setTotpEnabled(false);
    user.setTotpSecret(null);
    user.setTotpBackupCodes(null);
    userRepository.save(user);

    return ResponseEntity.ok(Map.of("disabled", true));
  }

  @GetMapping("/status")
  public ResponseEntity<?> status(Authentication auth) {
    String userId = (String) auth.getPrincipal();
    UserEntity user = userRepository.findById(userId).orElse(null);
    if (user == null) return ResponseEntity.status(404).body(Map.of("error", "User not found"));

    return ResponseEntity.ok(Map.of("enabled", user.isTotpEnabled()));
  }

  private boolean verifyCode(String secret, String code) {
    CodeVerifier verifier =
        new DefaultCodeVerifier(new DefaultCodeGenerator(), new SystemTimeProvider());
    try {
      return verifier.isValidCode(secret, code);
    } catch (Exception e) {
      return false;
    }
  }
}
