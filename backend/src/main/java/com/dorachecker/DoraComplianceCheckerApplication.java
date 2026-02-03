package com.dorachecker;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class DoraComplianceCheckerApplication {

    public static void main(String[] args) {
        SpringApplication.run(DoraComplianceCheckerApplication.class, args);
    }
}
