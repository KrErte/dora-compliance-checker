package com.dorachecker.controller;

import com.dorachecker.model.UserEntity;
import com.dorachecker.model.UserRepository;
import com.dorachecker.security.JwtService;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/auth/oauth2")
public class OAuth2Controller {

    private final UserRepository userRepository;
    private final JwtService jwtService;
    private final RestTemplate restTemplate;

    @Value("${oauth2.google.client-id:}")
    private String googleClientId;

    @Value("${oauth2.google.client-secret:}")
    private String googleClientSecret;

    @Value("${oauth2.microsoft.client-id:}")
    private String microsoftClientId;

    @Value("${oauth2.microsoft.client-secret:}")
    private String microsoftClientSecret;

    @Value("${app.frontend-url:http://localhost:4200}")
    private String frontendUrl;

    @Value("${promo.trial.days:30}")
    private int trialDays;

    public OAuth2Controller(UserRepository userRepository, JwtService jwtService) {
        this.userRepository = userRepository;
        this.jwtService = jwtService;
        this.restTemplate = new RestTemplate();
    }

    // Initiate Google OAuth2 flow
    @GetMapping("/google")
    public void initiateGoogleAuth(HttpServletResponse response) throws IOException {
        String redirectUri = getBaseUrl() + "/api/auth/oauth2/callback/google";
        String authUrl = UriComponentsBuilder
                .fromUriString("https://accounts.google.com/o/oauth2/v2/auth")
                .queryParam("client_id", googleClientId)
                .queryParam("redirect_uri", redirectUri)
                .queryParam("response_type", "code")
                .queryParam("scope", "email profile")
                .queryParam("access_type", "offline")
                .build()
                .toUriString();
        response.sendRedirect(authUrl);
    }

    // Initiate Microsoft OAuth2 flow
    @GetMapping("/microsoft")
    public void initiateMicrosoftAuth(HttpServletResponse response) throws IOException {
        String redirectUri = getBaseUrl() + "/api/auth/oauth2/callback/microsoft";
        String authUrl = UriComponentsBuilder
                .fromUriString("https://login.microsoftonline.com/common/oauth2/v2.0/authorize")
                .queryParam("client_id", microsoftClientId)
                .queryParam("redirect_uri", redirectUri)
                .queryParam("response_type", "code")
                .queryParam("scope", "openid email profile")
                .queryParam("response_mode", "query")
                .build()
                .toUriString();
        response.sendRedirect(authUrl);
    }

    // Google OAuth2 callback
    @GetMapping("/callback/google")
    public void googleCallback(@RequestParam("code") String code,
                               @RequestParam(value = "error", required = false) String error,
                               HttpServletResponse response) throws IOException {
        if (error != null) {
            response.sendRedirect(frontendUrl + "/login?error=oauth_denied");
            return;
        }

        try {
            // Exchange code for tokens
            String redirectUri = getBaseUrl() + "/api/auth/oauth2/callback/google";
            Map<String, Object> tokenResponse = exchangeGoogleCode(code, redirectUri);
            String accessToken = (String) tokenResponse.get("access_token");

            // Get user info from Google
            Map<String, Object> userInfo = getGoogleUserInfo(accessToken);
            String email = (String) userInfo.get("email");
            String name = (String) userInfo.get("name");
            String googleId = (String) userInfo.get("sub");

            // Find or create user
            UserEntity user = findOrCreateOAuthUser(email, name, googleId, UserEntity.AuthProvider.GOOGLE);

            // Generate JWT
            String token = jwtService.generateToken(user.getId(), user.getEmail(), user.getRole().name());

            // Redirect to frontend with token
            response.sendRedirect(frontendUrl + "/oauth/callback?token=" + URLEncoder.encode(token, StandardCharsets.UTF_8));
        } catch (Exception e) {
            response.sendRedirect(frontendUrl + "/login?error=oauth_failed");
        }
    }

    // Microsoft OAuth2 callback
    @GetMapping("/callback/microsoft")
    public void microsoftCallback(@RequestParam("code") String code,
                                  @RequestParam(value = "error", required = false) String error,
                                  HttpServletResponse response) throws IOException {
        if (error != null) {
            response.sendRedirect(frontendUrl + "/login?error=oauth_denied");
            return;
        }

        try {
            // Exchange code for tokens
            String redirectUri = getBaseUrl() + "/api/auth/oauth2/callback/microsoft";
            Map<String, Object> tokenResponse = exchangeMicrosoftCode(code, redirectUri);
            String accessToken = (String) tokenResponse.get("access_token");

            // Get user info from Microsoft Graph
            Map<String, Object> userInfo = getMicrosoftUserInfo(accessToken);
            String email = (String) userInfo.get("email");
            if (email == null) {
                email = (String) userInfo.get("userPrincipalName");
            }
            String name = (String) userInfo.get("displayName");
            if (name == null) {
                name = (String) userInfo.get("name");
            }
            String microsoftId = (String) userInfo.get("sub");
            if (microsoftId == null) {
                microsoftId = (String) userInfo.get("id");
            }

            // Find or create user
            UserEntity user = findOrCreateOAuthUser(email, name, microsoftId, UserEntity.AuthProvider.MICROSOFT);

            // Generate JWT
            String token = jwtService.generateToken(user.getId(), user.getEmail(), user.getRole().name());

            // Redirect to frontend with token
            response.sendRedirect(frontendUrl + "/oauth/callback?token=" + URLEncoder.encode(token, StandardCharsets.UTF_8));
        } catch (Exception e) {
            response.sendRedirect(frontendUrl + "/login?error=oauth_failed");
        }
    }

    private Map<String, Object> exchangeGoogleCode(String code, String redirectUri) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
        body.add("code", code);
        body.add("client_id", googleClientId);
        body.add("client_secret", googleClientSecret);
        body.add("redirect_uri", redirectUri);
        body.add("grant_type", "authorization_code");

        HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(body, headers);
        ResponseEntity<Map> response = restTemplate.postForEntity(
                "https://oauth2.googleapis.com/token", request, Map.class);
        return response.getBody();
    }

    private Map<String, Object> getGoogleUserInfo(String accessToken) {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(accessToken);
        HttpEntity<?> request = new HttpEntity<>(headers);

        ResponseEntity<Map> response = restTemplate.exchange(
                "https://www.googleapis.com/oauth2/v3/userinfo",
                HttpMethod.GET, request, Map.class);
        return response.getBody();
    }

    private Map<String, Object> exchangeMicrosoftCode(String code, String redirectUri) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
        body.add("code", code);
        body.add("client_id", microsoftClientId);
        body.add("client_secret", microsoftClientSecret);
        body.add("redirect_uri", redirectUri);
        body.add("grant_type", "authorization_code");
        body.add("scope", "openid email profile");

        HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(body, headers);
        ResponseEntity<Map> response = restTemplate.postForEntity(
                "https://login.microsoftonline.com/common/oauth2/v2.0/token", request, Map.class);
        return response.getBody();
    }

    private Map<String, Object> getMicrosoftUserInfo(String accessToken) {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(accessToken);
        HttpEntity<?> request = new HttpEntity<>(headers);

        ResponseEntity<Map> response = restTemplate.exchange(
                "https://graph.microsoft.com/v1.0/me",
                HttpMethod.GET, request, Map.class);
        return response.getBody();
    }

    private UserEntity findOrCreateOAuthUser(String email, String name, String providerId, UserEntity.AuthProvider provider) {
        Optional<UserEntity> existingUser = userRepository.findByEmail(email);

        if (existingUser.isPresent()) {
            UserEntity user = existingUser.get();
            // Update OAuth provider info if not set
            if (user.getAuthProvider() == UserEntity.AuthProvider.LOCAL) {
                user.setAuthProvider(provider);
                user.setOauthProviderId(providerId);
                userRepository.save(user);
            }

            // Check if trial has expired
            if (!user.isTrialActive() && user.getAccountTier() == UserEntity.AccountTier.PREMIUM) {
                user.setAccountTier(UserEntity.AccountTier.FREE);
                userRepository.save(user);
            }

            return user;
        }

        // Create new user
        UserEntity user = new UserEntity();
        user.setEmail(email);
        user.setFullName(name != null ? name : email.split("@")[0]);
        user.setPassword(UUID.randomUUID().toString()); // Random password for OAuth users
        user.setAuthProvider(provider);
        user.setOauthProviderId(providerId);
        user.setCreatedAt(LocalDateTime.now());
        user.setAccountTier(UserEntity.AccountTier.PREMIUM);
        user.setTrialEndDate(LocalDate.now().plusDays(trialDays));

        return userRepository.save(user);
    }

    private String getBaseUrl() {
        // For production, this should return the actual backend URL
        // You might want to make this configurable
        if (frontendUrl.contains("doraaudit.eu")) {
            return "https://doraaudit.eu";
        }
        return "http://localhost:8080";
    }
}
