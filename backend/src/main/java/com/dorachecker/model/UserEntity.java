package com.dorachecker.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(
    name = "users",
    indexes = {
      @Index(name = "idx_users_email", columnList = "email"),
      @Index(name = "idx_users_trial_ends_at", columnList = "trialEndsAt"),
      @Index(name = "idx_users_refresh_token", columnList = "refreshToken"),
      @Index(name = "idx_users_unsubscribe_token", columnList = "unsubscribeToken")
    })
public class UserEntity {

  public enum Role {
    USER,
    ADMIN
  }

  public enum AccountTier {
    FREE,
    PREMIUM,
    STANDARD,
    ENTERPRISE
  }

  public enum AuthProvider {
    LOCAL,
    GOOGLE,
    MICROSOFT
  }

  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private String id;

  @Column(nullable = false, unique = true)
  private String email;

  private String password;

  @Enumerated(EnumType.STRING)
  private AuthProvider authProvider = AuthProvider.LOCAL;

  private String oauthProviderId;

  private String fullName;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private Role role = Role.USER;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private AccountTier accountTier = AccountTier.FREE;

  @Column(nullable = false)
  private LocalDateTime createdAt;

  @Column(nullable = false)
  private boolean earlyAdopter = false;

  private Integer earlyAdopterNumber;

  private LocalDateTime trialEndsAt;

  private String passwordResetToken;

  private LocalDateTime passwordResetTokenExpiresAt;

  @Column(nullable = false)
  private boolean emailVerified = false;

  private String emailVerificationToken;

  @Column(nullable = false, columnDefinition = "boolean default false")
  private boolean emailOptOut = false;

  private String refreshToken;
  private LocalDateTime refreshTokenExpiresAt;

  private String unsubscribeToken;

  private String totpSecret;

  @Column(nullable = false, columnDefinition = "boolean default false")
  private boolean totpEnabled = false;

  @Column(columnDefinition = "TEXT")
  private String totpBackupCodes; // comma-separated

  public UserEntity() {}

  public String getId() {
    return id;
  }

  public void setId(String id) {
    this.id = id;
  }

  public String getEmail() {
    return email;
  }

  public void setEmail(String email) {
    this.email = email;
  }

  public String getPassword() {
    return password;
  }

  public void setPassword(String password) {
    this.password = password;
  }

  public String getFullName() {
    return fullName;
  }

  public void setFullName(String fullName) {
    this.fullName = fullName;
  }

  public LocalDateTime getCreatedAt() {
    return createdAt;
  }

  public void setCreatedAt(LocalDateTime createdAt) {
    this.createdAt = createdAt;
  }

  public Role getRole() {
    return role;
  }

  public void setRole(Role role) {
    this.role = role;
  }

  public AccountTier getAccountTier() {
    return accountTier;
  }

  public void setAccountTier(AccountTier accountTier) {
    this.accountTier = accountTier;
  }

  public boolean isEarlyAdopter() {
    return earlyAdopter;
  }

  public void setEarlyAdopter(boolean earlyAdopter) {
    this.earlyAdopter = earlyAdopter;
  }

  public Integer getEarlyAdopterNumber() {
    return earlyAdopterNumber;
  }

  public void setEarlyAdopterNumber(Integer earlyAdopterNumber) {
    this.earlyAdopterNumber = earlyAdopterNumber;
  }

  public LocalDateTime getTrialEndsAt() {
    return trialEndsAt;
  }

  public void setTrialEndsAt(LocalDateTime trialEndsAt) {
    this.trialEndsAt = trialEndsAt;
  }

  public boolean isTrialValid() {
    return trialEndsAt != null && LocalDateTime.now().isBefore(trialEndsAt);
  }

  public AuthProvider getAuthProvider() {
    return authProvider;
  }

  public void setAuthProvider(AuthProvider authProvider) {
    this.authProvider = authProvider;
  }

  public String getOauthProviderId() {
    return oauthProviderId;
  }

  public void setOauthProviderId(String oauthProviderId) {
    this.oauthProviderId = oauthProviderId;
  }

  public String getPasswordResetToken() {
    return passwordResetToken;
  }

  public void setPasswordResetToken(String passwordResetToken) {
    this.passwordResetToken = passwordResetToken;
  }

  public LocalDateTime getPasswordResetTokenExpiresAt() {
    return passwordResetTokenExpiresAt;
  }

  public void setPasswordResetTokenExpiresAt(LocalDateTime passwordResetTokenExpiresAt) {
    this.passwordResetTokenExpiresAt = passwordResetTokenExpiresAt;
  }

  public boolean isEmailVerified() {
    return emailVerified;
  }

  public void setEmailVerified(boolean emailVerified) {
    this.emailVerified = emailVerified;
  }

  public String getEmailVerificationToken() {
    return emailVerificationToken;
  }

  public void setEmailVerificationToken(String emailVerificationToken) {
    this.emailVerificationToken = emailVerificationToken;
  }

  public boolean isEmailOptOut() {
    return emailOptOut;
  }

  public void setEmailOptOut(boolean emailOptOut) {
    this.emailOptOut = emailOptOut;
  }

  public String getRefreshToken() {
    return refreshToken;
  }

  public void setRefreshToken(String refreshToken) {
    this.refreshToken = refreshToken;
  }

  public LocalDateTime getRefreshTokenExpiresAt() {
    return refreshTokenExpiresAt;
  }

  public void setRefreshTokenExpiresAt(LocalDateTime refreshTokenExpiresAt) {
    this.refreshTokenExpiresAt = refreshTokenExpiresAt;
  }

  public String getUnsubscribeToken() {
    return unsubscribeToken;
  }

  public void setUnsubscribeToken(String unsubscribeToken) {
    this.unsubscribeToken = unsubscribeToken;
  }

  public String getTotpSecret() {
    return totpSecret;
  }

  public void setTotpSecret(String totpSecret) {
    this.totpSecret = totpSecret;
  }

  public boolean isTotpEnabled() {
    return totpEnabled;
  }

  public void setTotpEnabled(boolean totpEnabled) {
    this.totpEnabled = totpEnabled;
  }

  public String getTotpBackupCodes() {
    return totpBackupCodes;
  }

  public void setTotpBackupCodes(String totpBackupCodes) {
    this.totpBackupCodes = totpBackupCodes;
  }
}
