package com.dorachecker.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import com.dorachecker.model.UserEntity;
import com.dorachecker.model.UserRepository;
import com.dorachecker.security.JwtService;
import com.dorachecker.service.ResendEmailService;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;

@ExtendWith(MockitoExtension.class)
class AuthControllerTest {

  @Mock private UserRepository userRepository;
  @Mock private PasswordEncoder passwordEncoder;
  @Mock private JwtService jwtService;
  @Mock private ResendEmailService emailService;
  @Mock private com.dorachecker.service.UserDeletionService userDeletionService;

  private AuthController authController;

  @BeforeEach
  void setUp() {
    authController =
        new AuthController(
            userRepository,
            passwordEncoder,
            jwtService,
            emailService,
            userDeletionService,
            "https://doraaudit.eu",
            7);
  }

  @Nested
  class ForgotPassword {

    @Test
    void existingUser_sendsResetEmail() {
      UserEntity user = new UserEntity();
      user.setId("u1");
      user.setEmail("test@example.com");
      user.setFullName("Test User");
      user.setAuthProvider(UserEntity.AuthProvider.LOCAL);
      user.setUnsubscribeToken("unsub-token-123");

      when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(user));

      var response = authController.forgotPassword(Map.of("email", "test@example.com"));

      assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);

      // Verify token was saved
      ArgumentCaptor<UserEntity> userCaptor = ArgumentCaptor.forClass(UserEntity.class);
      verify(userRepository).save(userCaptor.capture());
      UserEntity saved = userCaptor.getValue();
      assertThat(saved.getPasswordResetToken()).isNotNull();
      assertThat(saved.getPasswordResetTokenExpiresAt()).isAfter(LocalDateTime.now());

      // Verify email was sent
      verify(emailService).sendEmail(eq("test@example.com"), contains("Parooli"), anyString());
    }

    @Test
    void nonExistentUser_returnsSuccessAnyway() {
      when(userRepository.findByEmail("unknown@example.com")).thenReturn(Optional.empty());

      var response = authController.forgotPassword(Map.of("email", "unknown@example.com"));

      assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
      verify(emailService, never()).sendEmail(anyString(), anyString(), anyString());
    }

    @Test
    void oauthUser_doesNotSendEmail() {
      UserEntity oauthUser = new UserEntity();
      oauthUser.setAuthProvider(UserEntity.AuthProvider.GOOGLE);
      when(userRepository.findByEmail("google@example.com")).thenReturn(Optional.of(oauthUser));

      var response = authController.forgotPassword(Map.of("email", "google@example.com"));

      assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
      verify(emailService, never()).sendEmail(anyString(), anyString(), anyString());
      verify(userRepository, never()).save(any());
    }

    @Test
    void blankEmail_returnsBadRequest() {
      var response = authController.forgotPassword(Map.of("email", ""));
      assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
    }
  }

  @Nested
  class ResetPassword {

    @Test
    void validToken_resetsPassword() {
      UserEntity user = new UserEntity();
      user.setId("u1");
      user.setPasswordResetToken("valid-token");
      user.setPasswordResetTokenExpiresAt(LocalDateTime.now().plusMinutes(30));

      when(userRepository.findByPasswordResetToken("valid-token")).thenReturn(Optional.of(user));
      when(passwordEncoder.encode("newPassword123")).thenReturn("encoded-pw");

      var response =
          authController.resetPassword(
              Map.of(
                  "token", "valid-token",
                  "password", "newPassword123"));

      assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);

      ArgumentCaptor<UserEntity> captor = ArgumentCaptor.forClass(UserEntity.class);
      verify(userRepository).save(captor.capture());
      UserEntity saved = captor.getValue();
      assertThat(saved.getPassword()).isEqualTo("encoded-pw");
      assertThat(saved.getPasswordResetToken()).isNull();
      assertThat(saved.getPasswordResetTokenExpiresAt()).isNull();
    }

    @Test
    void expiredToken_returnsBadRequest() {
      UserEntity user = new UserEntity();
      user.setPasswordResetToken("expired-token");
      user.setPasswordResetTokenExpiresAt(LocalDateTime.now().minusMinutes(5));

      when(userRepository.findByPasswordResetToken("expired-token")).thenReturn(Optional.of(user));

      var response =
          authController.resetPassword(
              Map.of(
                  "token", "expired-token",
                  "password", "newPassword123"));

      assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
    }

    @Test
    void invalidToken_returnsBadRequest() {
      when(userRepository.findByPasswordResetToken("bad-token")).thenReturn(Optional.empty());

      var response =
          authController.resetPassword(
              Map.of(
                  "token", "bad-token",
                  "password", "newPassword123"));

      assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
    }

    @Test
    void shortPassword_returnsBadRequest() {
      var response =
          authController.resetPassword(
              Map.of(
                  "token", "some-token",
                  "password", "short"));

      assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
    }

    @Test
    void missingToken_returnsBadRequest() {
      var response = authController.resetPassword(Map.of("password", "newPassword123"));
      assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
    }
  }

  @Nested
  class Login {

    @Test
    void validCredentials_returnsToken() {
      UserEntity user = new UserEntity();
      user.setId("u1");
      user.setEmail("test@example.com");
      user.setPassword("encoded-pw");
      user.setFullName("Test");
      user.setCreatedAt(LocalDateTime.now());
      user.setAccountTier(UserEntity.AccountTier.FREE);

      when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(user));
      when(passwordEncoder.matches("password123", "encoded-pw")).thenReturn(true);
      when(jwtService.generateToken(anyString(), anyString(), anyString())).thenReturn("jwt-token");

      var response =
          authController.login(
              new com.dorachecker.security.AuthDtos.LoginRequest(
                  "test@example.com", "password123"));

      assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    void invalidPassword_returns401() {
      UserEntity user = new UserEntity();
      user.setPassword("encoded-pw");

      when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(user));
      when(passwordEncoder.matches("wrong", "encoded-pw")).thenReturn(false);

      var response =
          authController.login(
              new com.dorachecker.security.AuthDtos.LoginRequest("test@example.com", "wrong"));

      assertThat(response.getStatusCode().value()).isEqualTo(401);
    }

    @Test
    void unknownEmail_returns401() {
      when(userRepository.findByEmail("unknown@test.com")).thenReturn(Optional.empty());

      var response =
          authController.login(
              new com.dorachecker.security.AuthDtos.LoginRequest("unknown@test.com", "pw"));

      assertThat(response.getStatusCode().value()).isEqualTo(401);
    }
  }
}
