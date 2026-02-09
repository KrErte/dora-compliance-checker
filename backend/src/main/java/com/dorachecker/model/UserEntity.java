package com.dorachecker.model;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "users")
public class UserEntity {

    public enum Role { USER, ADMIN }
    public enum AccountTier { FREE, PREMIUM }

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String password;

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

    private LocalDate trialEndDate;

    public UserEntity() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public Role getRole() { return role; }
    public void setRole(Role role) { this.role = role; }

    public AccountTier getAccountTier() { return accountTier; }
    public void setAccountTier(AccountTier accountTier) { this.accountTier = accountTier; }

    public boolean isEarlyAdopter() { return earlyAdopter; }
    public void setEarlyAdopter(boolean earlyAdopter) { this.earlyAdopter = earlyAdopter; }

    public Integer getEarlyAdopterNumber() { return earlyAdopterNumber; }
    public void setEarlyAdopterNumber(Integer earlyAdopterNumber) { this.earlyAdopterNumber = earlyAdopterNumber; }

    public LocalDate getTrialEndDate() { return trialEndDate; }
    public void setTrialEndDate(LocalDate trialEndDate) { this.trialEndDate = trialEndDate; }
}
