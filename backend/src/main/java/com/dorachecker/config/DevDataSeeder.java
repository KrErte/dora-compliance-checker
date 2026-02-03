package com.dorachecker.config;

import com.dorachecker.model.UserEntity;
import com.dorachecker.model.UserEntity.Role;
import com.dorachecker.model.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

/**
 * DEV-ONLY: Seeds test users for local development and testing.
 *
 * This component ONLY runs when:
 * 1. Profile is "local" or "dev"
 * 2. Property app.seed.enabled=true
 *
 * NEVER enable in production.
 */
@Component
@Profile({"local", "dev"})
public class DevDataSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DevDataSeeder.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.seed.enabled:false}")
    private boolean seedEnabled;

    public DevDataSeeder(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        if (!seedEnabled) {
            log.info("DevDataSeeder: Seeding disabled (app.seed.enabled=false)");
            return;
        }

        log.info("DevDataSeeder: Starting test user seeding...");

        seedUser("Test Admin", "admin@test.local", "Admin123!", Role.ADMIN);
        seedUser("Test User", "user@test.local", "User123!", Role.USER);

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
}
