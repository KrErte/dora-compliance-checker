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

import jakarta.servlet.http.HttpSession;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
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

    @Value("${jwt.refresh-expiration-days:7}")
    private int refreshExpirationDays;

    public OAuth2Controller(UserRepository userRepository, JwtService jwtService) {
        this.userRepository = userRepository;
        this.jwtService = jwtService;
        this.restTemplate = new RestTemplate();
    }

    // Initiate Google OAuth2 flow
    @GetMapping("/google")
    public void initiateGoogleAuth(HttpServletResponse response, HttpSession session) throws IOException {
        String state = UUID.randomUUID().toString();
        session.setAttribute("oauth2_state", state);
        String redirectUri = getBaseUrl() + "/api/auth/oauth2/callback/google";
        String authUrl = UriComponentsBuilder
                .fromUriString("https://accounts.google.com/o/oauth2/v2/auth")
                .queryParam("client_id", googleClientId)
                .queryParam("redirect_uri", redirectUri)
                .queryParam("response_type", "code")
                .queryParam("scope", "email profile")
                .queryParam("access_type", "offline")
                .queryParam("state", state)
                .build()
                .toUriString();
        response.sendRedirect(authUrl);
    }

    // Initiate Microsoft OAuth2 flow
    @GetMapping("/microsoft")
    public void initiateMicrosoftAuth(HttpServletResponse response, HttpSession session) throws IOException {
        String state = UUID.randomUUID().toString();
        session.setAttribute("oauth2_state", state);
        String redirectUri = getBaseUrl() + "/api/auth/oauth2/callback/microsoft";
        String authUrl = UriComponentsBuilder
                .fromUriString("https://login.microsoftonline.com/common/oauth2/v2.0/authorize")
                .queryParam("client_id", microsoftClientId)
                .queryParam("redirect_uri", redirectUri)
                .queryParam("response_type", "code")
                .queryParam("scope", "openid email profile")
                .queryParam("response_mode", "query")
                .queryParam("state", state)
                .build()
                .toUriString();
        response.sendRedirect(authUrl);
    }

    // Google OAuth2 callback
    @GetMapping("/callback/google")
    public void googleCallback(@RequestParam("code") String code,
                               @RequestParam(value = "error", required = false) String error,
                               @RequestParam(value = "state", required = false) String state,
                               HttpSession session,
                               HttpServletResponse response) throws IOException {
        if (error != null) {
            response.sendRedirect(frontendUrl + "/login?error=oauth_denied");
            return;
        }
        // Validate CSRF state parameter
        String expectedState = (String) session.getAttribute("oauth2_state");
        session.removeAttribute("oauth2_state");
        if (expectedState == null || !expectedState.equals(state)) {
            response.sendRedirect(frontendUrl + "/login?error=oauth_state_mismatch");
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

            // Generate JWT + refresh token
            String token = jwtService.generateToken(user.getId(), user.getEmail(), user.getRole().name());
            String refreshToken = generateAndSaveRefreshToken(user);

            // Redirect to frontend with tokens
            response.sendRedirect(frontendUrl + "/oauth/callback?token=" + URLEncoder.encode(token, StandardCharsets.UTF_8)
                    + "&refreshToken=" + URLEncoder.encode(refreshToken, StandardCharsets.UTF_8));
        } catch (Exception e) {
            response.sendRedirect(frontendUrl + "/login?error=oauth_failed");
        }
    }

    // Microsoft OAuth2 callback
    @GetMapping("/callback/microsoft")
    public void microsoftCallback(@RequestParam("code") String code,
                                  @RequestParam(value = "error", required = false) String error,
                                  @RequestParam(value = "state", required = false) String state,
                                  HttpSession session,
                                  HttpServletResponse response) throws IOException {
        if (error != null) {
            response.sendRedirect(frontendUrl + "/login?error=oauth_denied");
            return;
        }
        // Validate CSRF state parameter
        String expectedState = (String) session.getAttribute("oauth2_state");
        session.removeAttribute("oauth2_state");
        if (expectedState == null || !expectedState.equals(state)) {
            response.sendRedirect(frontendUrl + "/login?error=oauth_state_mismatch");
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

            // Generate JWT + refresh token
            String token = jwtService.generateToken(user.getId(), user.getEmail(), user.getRole().name());
            String refreshToken = generateAndSaveRefreshToken(user);

            // Redirect to frontend with tokens
            response.sendRedirect(frontendUrl + "/oauth/callback?token=" + URLEncoder.encode(token, StandardCharsets.UTF_8)
                    + "&refreshToken=" + URLEncoder.encode(refreshToken, StandardCharsets.UTF_8));
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
        if (response.getBody() == null) {
            throw new RuntimeException("Empty response from Google token endpoint");
        }
        return response.getBody();
    }

    private Map<String, Object> getGoogleUserInfo(String accessToken) {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(accessToken);
        HttpEntity<?> request = new HttpEntity<>(headers);

        ResponseEntity<Map> response = restTemplate.exchange(
                "https://www.googleapis.com/oauth2/v3/userinfo",
                HttpMethod.GET, request, Map.class);
        if (response.getBody() == null) {
            throw new RuntimeException("Empty response from Google userinfo endpoint");
        }
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
        if (response.getBody() == null) {
            throw new RuntimeException("Empty response from Microsoft token endpoint");
        }
        return response.getBody();
    }

    private Map<String, Object> getMicrosoftUserInfo(String accessToken) {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(accessToken);
        HttpEntity<?> request = new HttpEntity<>(headers);

        ResponseEntity<Map> response = restTemplate.exchange(
                "https://graph.microsoft.com/v1.0/me",
                HttpMethod.GET, request, Map.class);
        if (response.getBody() == null) {
            throw new RuntimeException("Empty response from Microsoft Graph endpoint");
        }
        return response.getBody();
    }

    private String generateAndSaveRefreshToken(UserEntity user) {
        String refreshToken = UUID.randomUUID().toString();
        user.setRefreshToken(refreshToken);
        user.setRefreshTokenExpiresAt(LocalDateTime.now().plusDays(refreshExpirationDays));
        userRepository.save(user);
        return refreshToken;
    }

    private UserEntity findOrCreateOAuthUser(String email, String name, String providerId, UserEntity.AuthProvider provider) {
        Optional<UserEntity> existingUser = userRepository.findByEmail(email);

        if (existingUser.isPresent()) {
            UserEntity user = existingUser.get();
            // If user registered with LOCAL auth, do NOT overwrite their auth provider.
            // They must continue using password login. Only update OAuth ID if already OAuth.
            if (user.getAuthProvider() == provider) {
                // Same provider - update provider ID if changed
                if (providerId != null && !providerId.equals(user.getOauthProviderId())) {
                    user.setOauthProviderId(providerId);
                    userRepository.save(user);
                }
            } else if (user.getAuthProvider() == UserEntity.AuthProvider.LOCAL) {
                // LOCAL user trying OAuth - reject to prevent account hijack
                throw new RuntimeException("Account exists with email/password login. Please use password to sign in.");
            }
            // If different OAuth provider, just return the existing user without changing provider

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
        user.setAccountTier(UserEntity.AccountTier.FREE);
        user.setTrialEndsAt(LocalDateTime.now().plusDays(14));
        user.setUnsubscribeToken(UUID.randomUUID().toString());

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
