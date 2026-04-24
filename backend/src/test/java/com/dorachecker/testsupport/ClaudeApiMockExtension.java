package com.dorachecker.testsupport;

import com.github.tomakehurst.wiremock.WireMockServer;
import com.github.tomakehurst.wiremock.core.WireMockConfiguration;
import org.junit.jupiter.api.extension.AfterAllCallback;
import org.junit.jupiter.api.extension.BeforeAllCallback;
import org.junit.jupiter.api.extension.BeforeEachCallback;
import org.junit.jupiter.api.extension.ExtensionContext;

import static com.github.tomakehurst.wiremock.client.WireMock.*;

/**
 * JUnit 5 extension that starts a WireMock server mocking the Anthropic Claude API.
 * <p>
 * Usage: register the extension on your test class and use the static methods
 * to stub responses.
 * <pre>
 * {@code @RegisterExtension}
 * static ClaudeApiMockExtension claude = new ClaudeApiMockExtension();
 * </pre>
 * <p>
 * Note: the Claude API URL is currently hardcoded in services. To fully intercept
 * calls, services must be refactored to read {@code anthropic.api.base-url} from config.
 * This extension sets the system property {@code wiremock.port} so that
 * {@code application-test.properties} can reference it.
 */
public class ClaudeApiMockExtension implements BeforeAllCallback, AfterAllCallback, BeforeEachCallback {

    private WireMockServer server;

    public int getPort() {
        return server.port();
    }

    public String getBaseUrl() {
        return "http://localhost:" + server.port();
    }

    @Override
    public void beforeAll(ExtensionContext context) {
        server = new WireMockServer(WireMockConfiguration.wireMockConfig().dynamicPort());
        server.start();
        System.setProperty("wiremock.port", String.valueOf(server.port()));
    }

    @Override
    public void afterAll(ExtensionContext context) {
        if (server != null) {
            server.stop();
            System.clearProperty("wiremock.port");
        }
    }

    @Override
    public void beforeEach(ExtensionContext context) {
        server.resetAll();
    }

    /**
     * Stubs POST /v1/messages to return a successful Claude response with the given text.
     */
    public void stubSuccess(String responseText) {
        server.stubFor(post(urlPathEqualTo("/v1/messages"))
                .willReturn(okJson("""
                        {
                          "id": "msg_test_123",
                          "type": "message",
                          "role": "assistant",
                          "content": [{"type": "text", "text": "%s"}],
                          "model": "claude-sonnet-4-20250514",
                          "stop_reason": "end_turn",
                          "usage": {"input_tokens": 10, "output_tokens": 50}
                        }
                        """.formatted(responseText.replace("\"", "\\\"")))));
    }

    /**
     * Stubs POST /v1/messages to return a contract negotiation strategy response.
     */
    public void stubNegotiationStrategy(String strategyJson) {
        server.stubFor(post(urlPathEqualTo("/v1/messages"))
                .willReturn(okJson("""
                        {
                          "id": "msg_test_456",
                          "type": "message",
                          "role": "assistant",
                          "content": [{"type": "text", "text": "%s"}],
                          "model": "claude-sonnet-4-20250514",
                          "stop_reason": "end_turn",
                          "usage": {"input_tokens": 100, "output_tokens": 500}
                        }
                        """.formatted(strategyJson.replace("\"", "\\\"")))));
    }

    /**
     * Stubs POST /v1/messages to return an HTTP error.
     */
    public void stubError(int status) {
        server.stubFor(post(urlPathEqualTo("/v1/messages"))
                .willReturn(aResponse()
                        .withStatus(status)
                        .withHeader("Content-Type", "application/json")
                        .withBody("""
                                {"type": "error", "error": {"type": "api_error", "message": "Stubbed error"}}
                                """)));
    }

    /**
     * Resets all stubs and request history.
     */
    public void reset() {
        server.resetAll();
    }

    public WireMockServer getServer() {
        return server;
    }
}
