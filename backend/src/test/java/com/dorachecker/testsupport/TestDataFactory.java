package com.dorachecker.testsupport;

import com.dorachecker.model.AssessmentEntity;
import com.dorachecker.model.UserEntity;
import com.dorachecker.security.JwtService;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Factory methods for creating test data.
 * Keeps test methods short by providing sensible defaults.
 */
public final class TestDataFactory {

    private TestDataFactory() {}

    /**
     * Creates a verified LOCAL user with the given email and role.
     * All required fields are populated with sensible defaults.
     */
    public static UserEntity aVerifiedUser(String email, UserEntity.Role role) {
        UserEntity user = new UserEntity();
        user.setId(UUID.randomUUID().toString());
        user.setEmail(email);
        user.setPassword("$2a$10$dummyEncodedPasswordForTests"); // bcrypt placeholder
        user.setFullName("Test " + role.name());
        user.setRole(role);
        user.setAccountTier(UserEntity.AccountTier.FREE);
        user.setAuthProvider(UserEntity.AuthProvider.LOCAL);
        user.setCreatedAt(LocalDateTime.now());
        user.setEmailVerified(true);
        user.setUnsubscribeToken(UUID.randomUUID().toString());
        user.setTrialEndsAt(LocalDateTime.now().plusDays(14));
        return user;
    }

    /**
     * Creates a verified FREE-tier user with a random email.
     */
    public static UserEntity aFreeUser() {
        return aVerifiedUser("free-" + UUID.randomUUID().toString().substring(0, 8) + "@test.com",
                UserEntity.Role.USER);
    }

    /**
     * Creates an ADMIN user.
     */
    public static UserEntity anAdmin() {
        return aVerifiedUser("admin@test.com", UserEntity.Role.ADMIN);
    }

    /**
     * Creates a completed assessment for the given user.
     */
    public static AssessmentEntity anAssessment(UserEntity user) {
        AssessmentEntity a = new AssessmentEntity();
        a.setId(UUID.randomUUID().toString());
        a.setCompanyName("Test Company OÜ");
        a.setContractName("Test ICT Contract");
        a.setAssessmentDate(LocalDateTime.now());
        a.setTotalQuestions(41);
        a.setCompliantCount(30);
        a.setPartialCount(5);
        a.setScorePercentage(73.2);
        a.setComplianceLevel("PARTIAL");
        a.setAnswersJson("{\"1\":\"yes\",\"2\":\"no\",\"3\":\"partial\"}");
        a.setUserId(user.getId());
        return a;
    }

    /**
     * Generates a valid JWT token for the given user.
     * Requires a wired JwtService (call from integration test context).
     */
    public static String aValidJwt(UserEntity user, JwtService jwtService) {
        return jwtService.generateToken(user.getId(), user.getEmail(), user.getRole().name());
    }
}
