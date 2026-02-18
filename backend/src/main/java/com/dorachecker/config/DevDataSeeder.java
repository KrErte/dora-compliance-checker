package com.dorachecker.config;

import com.dorachecker.model.UserEntity;
import com.dorachecker.model.UserEntity.Role;
import com.dorachecker.model.UserRepository;
import com.dorachecker.model.UserSubscriptionEntity;
import com.dorachecker.model.UserSubscriptionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Seeds test users for local development and testing.
 *
 * Only runs when app.seed.enabled=true (default: false).
 * Production has this hardcoded to false in application-prod.properties.
 */
@Component
public class DevDataSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DevDataSeeder.class);

    private final UserRepository userRepository;
    private final UserSubscriptionRepository subscriptionRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.seed.enabled:false}")
    private boolean seedEnabled;

    public DevDataSeeder(UserRepository userRepository, UserSubscriptionRepository subscriptionRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.subscriptionRepository = subscriptionRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        if (!seedEnabled) {
            log.info("DevDataSeeder: Seeding disabled (app.seed.enabled=false)");
            return;
        }

        log.info("DevDataSeeder: Starting test user seeding...");

        seedUser("Test Admin", "admin@doraaudit.eu", "Admin1234", Role.ADMIN);
        seedUser("Test User", "user@doraaudit.eu", "User1234", Role.USER);
        seedUser("Demo User", "demo@doraaudit.eu", "Demo1234", Role.USER);
        seedEnterpriseUser("Enterprise Test", "enterprise@doraaudit.eu", "Test1234", Role.USER);

        log.info("DevDataSeeder: Seeding complete");
    }

    private void seedUser(String fullName, String email, String rawPassword, Role role) {
        if (userRepository.existsByEmail(email)) {
            log.info("DevDataSeeder: User {} already exists, skipping", email);
            return;
        }

        UserEntity user = new UserEntity();
        user.setFullName(fullName);
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(rawPassword));
        user.setRole(role);
        user.setCreatedAt(LocalDateTime.now());

        userRepository.save(user);
        log.info("DevDataSeeder: Created user {} with role {}", email, role);
    }

    private void seedEnterpriseUser(String fullName, String email, String rawPassword, Role role) {
        if (userRepository.existsByEmail(email)) {
            log.info("DevDataSeeder: Enterprise user {} already exists, skipping", email);
            return;
        }

        UserEntity user = new UserEntity();
        user.setFullName(fullName);
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(rawPassword));
        user.setRole(role);
        user.setAccountTier(UserEntity.AccountTier.PREMIUM);
        user.setTrialEndDate(LocalDate.now().plusYears(10));
        user.setCreatedAt(LocalDateTime.now());

        UserEntity saved = userRepository.save(user);

        // Create ENTERPRISE subscription
        UserSubscriptionEntity sub = new UserSubscriptionEntity();
        sub.setUserId(saved.getId());
        sub.setPlan(UserSubscriptionEntity.Plan.ENTERPRISE);
        sub.setStatus(UserSubscriptionEntity.Status.ACTIVE);
        sub.setValidUntil(LocalDateTime.now().plusYears(10));
        subscriptionRepository.save(sub);

        log.info("DevDataSeeder: Created enterprise user {} with ENTERPRISE subscription", email);
    }
}
