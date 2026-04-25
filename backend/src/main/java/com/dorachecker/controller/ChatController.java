package com.dorachecker.controller;

import com.dorachecker.model.ChatRequest;
import com.dorachecker.model.ChatResponse;
import com.dorachecker.service.ChatService;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/chat")
public class ChatController {

  private final ChatService chatService;

  public ChatController(ChatService chatService) {
    this.chatService = chatService;
  }

  @PostMapping("/message")
  public ChatResponse sendMessage(
      @Valid @RequestBody ChatRequest request,
      Authentication authentication,
      @RequestHeader(value = "X-Forwarded-For", required = false) String forwardedFor,
      @RequestHeader(value = "X-Real-IP", required = false) String realIp,
      jakarta.servlet.http.HttpServletRequest httpRequest) {
    Long userId = null;
    if (authentication != null
        && authentication.isAuthenticated()
        && !"anonymousUser".equals(authentication.getPrincipal())) {
      try {
        userId = Long.parseLong(authentication.getName());
      } catch (NumberFormatException ignored) {
      }
    }

    String clientIp =
        forwardedFor != null
            ? forwardedFor.split(",")[0].trim()
            : realIp != null ? realIp : httpRequest.getRemoteAddr();

    return chatService.sendMessage(request, userId, clientIp);
  }
}
