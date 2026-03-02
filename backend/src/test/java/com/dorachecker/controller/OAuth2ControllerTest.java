package com.dorachecker.controller;

import com.dorachecker.model.UserEntity;
import com.dorachecker.model.UserRepository;
import com.dorachecker.security.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OAuth2ControllerTest {

    @Mock private UserRepository userRepository;
    @Mock private JwtService jwtService;
    @Mock private RestTemplate mockRestTemplate;

    private OAuth2Controller controller;

    @BeforeEach
    void setUp() {
        controller = new OAuth2Controller(userRepository, jwtService);

        // Inject mock RestTemplate via reflection (constructor creates its own)
        ReflectionTestUtils.setField(controller, "restTemplate", mockRestTemplate);

        // Set @Value fields via reflection
        ReflectionTestUtils.setField(controller, "googleClientId", "google-client-id");
        ReflectionTestUtils.setField(controller, "googleClientSecret", "google-client-secret");
        ReflectionTestUtils.setField(controller, "microsoftClientId", "microsoft-client-id");
        ReflectionTestUtils.setField(controller, "microsoftClientSecret", "microsoft-client-secret");
        ReflectionTestUtils.setField(controller, "frontendUrl", "https://doraaudit.eu");
        ReflectionTestUtils.setField(controller, "refreshExpirationDays", 7);
    }

    // ------------------------------------------------------------------ helpers

    private UserEntity buildUser(String id, String email, String fullName,
                                 UserEntity.AuthProvider provider) {
        UserEntity user = new UserEntity();
        user.setId(id);
        user.setEmail(email);
        user.setFullName(fullName);
        user.setAuthProvider(provider);
        user.setRole(UserEntity.Role.USER);
        user.setAccountTier(UserEntity.AccountTier.FREE);
        user.setCreatedAt(LocalDateTime.now());
        return user;
    }

    /**
     * Stubs RestTemplate so that the Google token-exchange and userinfo calls
     * return the supplied values.
     */
    private void stubGoogleOAuthFlow(String email, String name, String sub) {
        // token exchange
        when(mockRestTemplate.postForEntity(
                contains("googleapis.com/token"), any(), eq(Map.class)))
                .thenReturn(ResponseEntity.ok(Map.of("access_token", "google-access-token")));

        // userinfo
        when(mockRestTemplate.exchange(
                contains("googleapis.com/oauth2"), eq(HttpMethod.GET), any(), eq(Map.class)))
                .thenReturn(ResponseEntity.ok(Map.of(
                        "email", email,
                        "name", name,
                        "sub", sub)));
    }

    /**
     * Stubs RestTemplate for Microsoft token-exchange and Graph /me call.
     * Accepts a full userInfo map so callers can control which fields are present.
     */
    private void stubMicrosoftOAuthFlow(Map<String, Object> userInfo) {
        // token exchange
        when(mockRestTemplate.postForEntity(
                contains("login.microsoftonline.com"), any(), eq(Map.class)))
                .thenReturn(ResponseEntity.ok(Map.of("access_token", "ms-access-token")));

        // Graph /me
        when(mockRestTemplate.exchange(
                contains("graph.microsoft.com"), eq(HttpMethod.GET), any(), eq(Map.class)))
                .thenReturn(ResponseEntity.ok(userInfo));
    }

    // =====================================================================
    //  Google callback tests
    // =====================================================================
    @Nested
    class GoogleCallback {

        @Test
        void withError_redirectsToLoginError() throws Exception {
            MockHttpServletResponse response = new MockHttpServletResponse();

            controller.googleCallback("unused-code", "access_denied", response);

            assertThat(response.getRedirectedUrl())
                    .isEqualTo("https://doraaudit.eu/login?error=oauth_denied");
            verifyNoInteractions(mockRestTemplate);
        }

        @Test
        void success_redirectsWithTokens() throws Exception {
            // Arrange
            stubGoogleOAuthFlow("alice@example.com", "Alice", "google-id-123");

            UserEntity savedUser = buildUser("u1", "alice@example.com", "Alice",
                    UserEntity.AuthProvider.GOOGLE);
            when(userRepository.findByEmail("alice@example.com")).thenReturn(Optional.empty());
            when(userRepository.save(any(UserEntity.class))).thenReturn(savedUser);
            when(jwtService.generateToken("u1", "alice@example.com", "USER"))
                    .thenReturn("jwt-token-123");

            MockHttpServletResponse response = new MockHttpServletResponse();

            // Act
            controller.googleCallback("auth-code", null, response);

            // Assert
            String redirectUrl = response.getRedirectedUrl();
            assertThat(redirectUrl).startsWith("https://doraaudit.eu/oauth/callback?token=");
            assertThat(redirectUrl).contains("jwt-token-123");
            assertThat(redirectUrl).contains("refreshToken=");

            // Verify user was saved twice: once for creation, once for refresh token
            verify(userRepository, times(2)).save(any(UserEntity.class));
        }

        @Test
        void exchangeFailure_redirectsToOAuthFailed() throws Exception {
            // Arrange — token exchange throws
            when(mockRestTemplate.postForEntity(
                    contains("googleapis.com/token"), any(), eq(Map.class)))
                    .thenThrow(new RestClientException("Connection refused"));

            MockHttpServletResponse response = new MockHttpServletResponse();

            // Act
            controller.googleCallback("bad-code", null, response);

            // Assert
            assertThat(response.getRedirectedUrl())
                    .isEqualTo("https://doraaudit.eu/login?error=oauth_failed");
        }
    }

    // =====================================================================
    //  Tests for findOrCreateOAuthUser (exercised through googleCallback)
    // =====================================================================
    @Nested
    class FindOrCreateOAuthUser {

        @Test
        void existingLocalUser_updatesToGoogleProvider() throws Exception {
            // Arrange
            UserEntity existingUser = buildUser("u1", "local@example.com", "Local User",
                    UserEntity.AuthProvider.LOCAL);
            stubGoogleOAuthFlow("local@example.com", "Local User", "gid-456");

            when(userRepository.findByEmail("local@example.com")).thenReturn(Optional.of(existingUser));
            when(userRepository.save(any(UserEntity.class))).thenReturn(existingUser);
            when(jwtService.generateToken(anyString(), anyString(), anyString())).thenReturn("jwt");

            MockHttpServletResponse response = new MockHttpServletResponse();

            // Act
            controller.googleCallback("code", null, response);

            // Assert — provider was updated and user was saved
            ArgumentCaptor<UserEntity> captor = ArgumentCaptor.forClass(UserEntity.class);
            verify(userRepository, atLeastOnce()).save(captor.capture());

            // The first save updates the provider
            UserEntity firstSave = captor.getAllValues().get(0);
            assertThat(firstSave.getAuthProvider()).isEqualTo(UserEntity.AuthProvider.GOOGLE);
            assertThat(firstSave.getOauthProviderId()).isEqualTo("gid-456");
        }

        @Test
        void existingGoogleUser_returnsWithoutUpdate() throws Exception {
            // Arrange — user already has GOOGLE provider
            UserEntity existingUser = buildUser("u2", "google@example.com", "Google User",
                    UserEntity.AuthProvider.GOOGLE);
            existingUser.setOauthProviderId("existing-gid");
            stubGoogleOAuthFlow("google@example.com", "Google User", "new-gid");

            when(userRepository.findByEmail("google@example.com")).thenReturn(Optional.of(existingUser));
            when(userRepository.save(any(UserEntity.class))).thenReturn(existingUser);
            when(jwtService.generateToken(anyString(), anyString(), anyString())).thenReturn("jwt");

            MockHttpServletResponse response = new MockHttpServletResponse();

            // Act
            controller.googleCallback("code", null, response);

            // Assert — save is called only once (for the refresh token), not for provider update
            verify(userRepository, times(1)).save(any(UserEntity.class));
            // Provider id stays as the original
            assertThat(existingUser.getOauthProviderId()).isEqualTo("existing-gid");
        }

        @Test
        void newUser_createsWithGoogleProvider() throws Exception {
            // Arrange
            stubGoogleOAuthFlow("new@example.com", "New User", "gid-new");

            UserEntity savedUser = buildUser("u3", "new@example.com", "New User",
                    UserEntity.AuthProvider.GOOGLE);
            when(userRepository.findByEmail("new@example.com")).thenReturn(Optional.empty());
            when(userRepository.save(any(UserEntity.class))).thenReturn(savedUser);
            when(jwtService.generateToken(anyString(), anyString(), anyString())).thenReturn("jwt");

            MockHttpServletResponse response = new MockHttpServletResponse();

            // Act
            controller.googleCallback("code", null, response);

            // Assert
            ArgumentCaptor<UserEntity> captor = ArgumentCaptor.forClass(UserEntity.class);
            verify(userRepository, atLeastOnce()).save(captor.capture());

            UserEntity created = captor.getAllValues().get(0);
            assertThat(created.getEmail()).isEqualTo("new@example.com");
            assertThat(created.getFullName()).isEqualTo("New User");
            assertThat(created.getAuthProvider()).isEqualTo(UserEntity.AuthProvider.GOOGLE);
            assertThat(created.getOauthProviderId()).isEqualTo("gid-new");
        }

        @Test
        void newUser_setsTrialAndDefaults() throws Exception {
            // Arrange
            stubGoogleOAuthFlow("trial@example.com", "Trial User", "gid-trial");

            when(userRepository.findByEmail("trial@example.com")).thenReturn(Optional.empty());
            when(userRepository.save(any(UserEntity.class))).thenAnswer(inv -> inv.getArgument(0));
            when(jwtService.generateToken(anyString(), anyString(), anyString())).thenReturn("jwt");

            MockHttpServletResponse response = new MockHttpServletResponse();

            // Act
            controller.googleCallback("code", null, response);

            // Assert
            ArgumentCaptor<UserEntity> captor = ArgumentCaptor.forClass(UserEntity.class);
            verify(userRepository, atLeastOnce()).save(captor.capture());

            UserEntity created = captor.getAllValues().get(0);
            assertThat(created.getAccountTier()).isEqualTo(UserEntity.AccountTier.FREE);
            assertThat(created.getTrialEndsAt()).isAfter(LocalDateTime.now().plusDays(13));
            assertThat(created.getCreatedAt()).isNotNull();
            assertThat(created.getUnsubscribeToken()).isNotNull();
            assertThat(created.getPassword()).isNotNull(); // random password set
        }

        @Test
        void nullName_usesEmailPrefix() throws Exception {
            // Arrange — Google returns null name
            when(mockRestTemplate.postForEntity(
                    contains("googleapis.com/token"), any(), eq(Map.class)))
                    .thenReturn(ResponseEntity.ok(Map.of("access_token", "tok")));

            // Userinfo with name explicitly absent
            Map<String, Object> userInfo = new java.util.HashMap<>();
            userInfo.put("email", "noname@example.com");
            userInfo.put("name", null);
            userInfo.put("sub", "gid-noname");
            when(mockRestTemplate.exchange(
                    contains("googleapis.com/oauth2"), eq(HttpMethod.GET), any(), eq(Map.class)))
                    .thenReturn(ResponseEntity.ok(userInfo));

            when(userRepository.findByEmail("noname@example.com")).thenReturn(Optional.empty());
            when(userRepository.save(any(UserEntity.class))).thenAnswer(inv -> {
                UserEntity u = inv.getArgument(0);
                u.setId("u-noname");
                return u;
            });
            when(jwtService.generateToken(anyString(), anyString(), anyString())).thenReturn("jwt");

            MockHttpServletResponse response = new MockHttpServletResponse();

            // Act
            controller.googleCallback("code", null, response);

            // Assert
            ArgumentCaptor<UserEntity> captor = ArgumentCaptor.forClass(UserEntity.class);
            verify(userRepository, atLeastOnce()).save(captor.capture());

            UserEntity created = captor.getAllValues().get(0);
            assertThat(created.getFullName()).isEqualTo("noname");
        }
    }

    // =====================================================================
    //  Tests for generateAndSaveRefreshToken (exercised through googleCallback)
    // =====================================================================
    @Nested
    class GenerateAndSaveRefreshToken {

        @Test
        void generatesUniqueToken() throws Exception {
            // Arrange
            stubGoogleOAuthFlow("rt@example.com", "RT User", "gid-rt");

            UserEntity user = buildUser("u-rt", "rt@example.com", "RT User",
                    UserEntity.AuthProvider.GOOGLE);
            when(userRepository.findByEmail("rt@example.com")).thenReturn(Optional.of(user));
            when(userRepository.save(any(UserEntity.class))).thenReturn(user);
            when(jwtService.generateToken(anyString(), anyString(), anyString())).thenReturn("jwt");

            MockHttpServletResponse response = new MockHttpServletResponse();

            // Act
            controller.googleCallback("code", null, response);

            // Assert — refresh token is a UUID
            assertThat(user.getRefreshToken()).isNotNull();
            assertThat(user.getRefreshToken()).matches(
                    "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}");
        }

        @Test
        void savesTokenToUser() throws Exception {
            // Arrange
            stubGoogleOAuthFlow("save@example.com", "Save User", "gid-save");

            UserEntity user = buildUser("u-save", "save@example.com", "Save User",
                    UserEntity.AuthProvider.GOOGLE);
            when(userRepository.findByEmail("save@example.com")).thenReturn(Optional.of(user));
            when(userRepository.save(any(UserEntity.class))).thenReturn(user);
            when(jwtService.generateToken(anyString(), anyString(), anyString())).thenReturn("jwt");

            MockHttpServletResponse response = new MockHttpServletResponse();

            // Act
            controller.googleCallback("code", null, response);

            // Assert — verify save was called with user that has the refresh token set
            ArgumentCaptor<UserEntity> captor = ArgumentCaptor.forClass(UserEntity.class);
            verify(userRepository, atLeastOnce()).save(captor.capture());

            // Last save is the refresh token save
            UserEntity lastSave = captor.getAllValues().get(captor.getAllValues().size() - 1);
            assertThat(lastSave.getRefreshToken()).isNotNull().isNotBlank();
        }

        @Test
        void setsExpirationDate() throws Exception {
            // Arrange
            stubGoogleOAuthFlow("exp@example.com", "Exp User", "gid-exp");

            UserEntity user = buildUser("u-exp", "exp@example.com", "Exp User",
                    UserEntity.AuthProvider.GOOGLE);
            when(userRepository.findByEmail("exp@example.com")).thenReturn(Optional.of(user));
            when(userRepository.save(any(UserEntity.class))).thenReturn(user);
            when(jwtService.generateToken(anyString(), anyString(), anyString())).thenReturn("jwt");

            MockHttpServletResponse response = new MockHttpServletResponse();

            // Act
            controller.googleCallback("code", null, response);

            // Assert — expiration should be ~7 days in the future
            assertThat(user.getRefreshTokenExpiresAt()).isNotNull();
            assertThat(user.getRefreshTokenExpiresAt())
                    .isAfter(LocalDateTime.now().plusDays(6))
                    .isBefore(LocalDateTime.now().plusDays(8));
        }
    }

    // =====================================================================
    //  Microsoft callback tests
    // =====================================================================
    @Nested
    class MicrosoftCallback {

        @Test
        void withError_redirectsToLoginError() throws Exception {
            MockHttpServletResponse response = new MockHttpServletResponse();

            controller.microsoftCallback("unused-code", "access_denied", response);

            assertThat(response.getRedirectedUrl())
                    .isEqualTo("https://doraaudit.eu/login?error=oauth_denied");
            verifyNoInteractions(mockRestTemplate);
        }

        @Test
        void success_withPrimaryFields() throws Exception {
            // Arrange — all primary fields present
            Map<String, Object> msUserInfo = Map.of(
                    "email", "ms@example.com",
                    "displayName", "MS User",
                    "sub", "ms-sub-123"
            );
            stubMicrosoftOAuthFlow(msUserInfo);

            UserEntity savedUser = buildUser("u-ms", "ms@example.com", "MS User",
                    UserEntity.AuthProvider.MICROSOFT);
            when(userRepository.findByEmail("ms@example.com")).thenReturn(Optional.empty());
            when(userRepository.save(any(UserEntity.class))).thenReturn(savedUser);
            when(jwtService.generateToken("u-ms", "ms@example.com", "USER"))
                    .thenReturn("ms-jwt");

            MockHttpServletResponse response = new MockHttpServletResponse();

            // Act
            controller.microsoftCallback("code", null, response);

            // Assert
            String redirectUrl = response.getRedirectedUrl();
            assertThat(redirectUrl).startsWith("https://doraaudit.eu/oauth/callback?token=");
            assertThat(redirectUrl).contains("ms-jwt");

            ArgumentCaptor<UserEntity> captor = ArgumentCaptor.forClass(UserEntity.class);
            verify(userRepository, atLeastOnce()).save(captor.capture());

            UserEntity created = captor.getAllValues().get(0);
            assertThat(created.getEmail()).isEqualTo("ms@example.com");
            assertThat(created.getFullName()).isEqualTo("MS User");
            assertThat(created.getAuthProvider()).isEqualTo(UserEntity.AuthProvider.MICROSOFT);
            assertThat(created.getOauthProviderId()).isEqualTo("ms-sub-123");
        }

        @Test
        void success_withFallbackFields() throws Exception {
            // Arrange — primary fields missing; must fall back to alternatives
            // email -> null, falls back to userPrincipalName
            // displayName -> null, falls back to name
            // sub -> null, falls back to id
            Map<String, Object> msUserInfo = new java.util.HashMap<>();
            msUserInfo.put("email", null);
            msUserInfo.put("userPrincipalName", "fallback@contoso.com");
            msUserInfo.put("displayName", null);
            msUserInfo.put("name", "Fallback Name");
            msUserInfo.put("sub", null);
            msUserInfo.put("id", "ms-id-fallback");
            stubMicrosoftOAuthFlow(msUserInfo);

            UserEntity savedUser = buildUser("u-fb", "fallback@contoso.com", "Fallback Name",
                    UserEntity.AuthProvider.MICROSOFT);
            when(userRepository.findByEmail("fallback@contoso.com")).thenReturn(Optional.empty());
            when(userRepository.save(any(UserEntity.class))).thenReturn(savedUser);
            when(jwtService.generateToken("u-fb", "fallback@contoso.com", "USER"))
                    .thenReturn("fb-jwt");

            MockHttpServletResponse response = new MockHttpServletResponse();

            // Act
            controller.microsoftCallback("code", null, response);

            // Assert
            ArgumentCaptor<UserEntity> captor = ArgumentCaptor.forClass(UserEntity.class);
            verify(userRepository, atLeastOnce()).save(captor.capture());

            UserEntity created = captor.getAllValues().get(0);
            assertThat(created.getEmail()).isEqualTo("fallback@contoso.com");
            assertThat(created.getFullName()).isEqualTo("Fallback Name");
            assertThat(created.getOauthProviderId()).isEqualTo("ms-id-fallback");
        }

        @Test
        void exchangeFailure_redirectsToOAuthFailed() throws Exception {
            // Arrange — token exchange throws
            when(mockRestTemplate.postForEntity(
                    contains("login.microsoftonline.com"), any(), eq(Map.class)))
                    .thenThrow(new RestClientException("Timeout"));

            MockHttpServletResponse response = new MockHttpServletResponse();

            // Act
            controller.microsoftCallback("bad-code", null, response);

            // Assert
            assertThat(response.getRedirectedUrl())
                    .isEqualTo("https://doraaudit.eu/login?error=oauth_failed");
        }
    }
}
