package com.dorachecker.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfigurationSource;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtFilter;
    private final CorsConfigurationSource corsConfigurationSource;

    public SecurityConfig(JwtAuthenticationFilter jwtFilter, CorsConfigurationSource corsConfigurationSource) {
        this.jwtFilter = jwtFilter;
        this.corsConfigurationSource = corsConfigurationSource;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource))
            .csrf(csrf -> csrf.disable())
            .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/auth/**").permitAll()
                .requestMatchers("/actuator/health", "/actuator/info").permitAll()
                .requestMatchers("/swagger-ui/**", "/swagger-ui.html", "/api-docs/**", "/v3/api-docs/**").permitAll()
                // Free tier - contract analysis and assessment without login
                .requestMatchers("/api/sample/**").permitAll()
                .requestMatchers("/api/contracts/analyze").permitAll()
                .requestMatchers("/api/contracts/*").permitAll()
                .requestMatchers("/api/questions").permitAll()
                .requestMatchers("/api/assessments/**").permitAll()
                .requestMatchers("/api/contact").permitAll()
                .requestMatchers("/api/regulations/**").permitAll()
                .requestMatchers("/api/v2/**").permitAll()
                .requestMatchers("/api/emtak/**").permitAll()
                .requestMatchers("/api/company/**").permitAll()
                .requestMatchers("/api/companies/admin/**").hasRole("ADMIN")
                .requestMatchers("/api/companies/**").permitAll()
                .requestMatchers("/api/ariregister/**").permitAll()
                .requestMatchers("/api/stats/**").permitAll()
                .requestMatchers("/api/early-adopter/**").permitAll()
                .requestMatchers("/api/subscribe/**").permitAll()
                .requestMatchers("/api/public/**").permitAll()
                .requestMatchers("/api/fine-calculator/**").permitAll()
                .requestMatchers("/api/workspace/checklists").permitAll()
                .requestMatchers("/api/subscription/status").permitAll()
                .requestMatchers("/api/subscription/check/**").permitAll()
                .requestMatchers("/api/exports/**").permitAll()
                .requestMatchers("/api/webhooks/**").permitAll()
                .requestMatchers("/api/benchmarks/**").permitAll()
                .requestMatchers("/api/global-providers/**").permitAll()
                .requestMatchers("/api/branding/logo").permitAll()
                .requestMatchers("/api/roi/gleif/**").permitAll()
                .requestMatchers("/api/chat/**").permitAll()
                .requestMatchers("/api/guardian/regulatory-updates").hasRole("ADMIN")
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                .requestMatchers("/api/**").authenticated()
                .anyRequest().authenticated()
            )
            .headers(headers -> headers.frameOptions(fo -> fo.sameOrigin()))
            .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
