package com.dorachecker.service;

import com.dorachecker.model.ChatRequest;
import com.dorachecker.model.ChatResponse;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

@Service
public class ChatService {

  private static final Logger log = LoggerFactory.getLogger(ChatService.class);

  private static final int ANONYMOUS_LIMIT = 5;
  private static final long RATE_WINDOW_MS = 3_600_000; // 1 hour
  private static final long SESSION_TTL_MS = 7_200_000; // 2 hours
  private static final int MAX_TURNS = 20;
  private static final int MAX_REPLY_TOKENS = 1024;
  private static final int MAX_SESSIONS = 10_000;

  private final ClaudeApiService claudeApi;

  // sessionId -> list of {role, content} maps
  private final ConcurrentHashMap<String, List<Map<String, String>>> sessions =
      new ConcurrentHashMap<>();
  private final ConcurrentHashMap<String, Long> sessionLastAccess = new ConcurrentHashMap<>();

  // rateLimitKey (IP or "user:id") -> list of timestamps
  private final ConcurrentHashMap<String, List<Long>> rateLimits = new ConcurrentHashMap<>();

  public ChatService(ClaudeApiService claudeApi) {
    this.claudeApi = claudeApi;
  }

  public ChatResponse sendMessage(ChatRequest request, Long userId, String clientIp) {
    boolean authenticated = userId != null;
    String rateLimitKey = authenticated ? "user:" + userId : "ip:" + clientIp;

    // Rate limiting for anonymous users only
    if (!authenticated) {
      int used = countRecentRequests(rateLimitKey);
      if (used >= ANONYMOUS_LIMIT) {
        return new ChatResponse(null, true, used, ANONYMOUS_LIMIT, null, null, List.of());
      }
      recordRequest(rateLimitKey);
    }

    // Generate server-side session ID — do NOT trust client-supplied session IDs
    // to prevent session hijacking across users
    String userSessionPrefix = authenticated ? "user:" + userId : "ip:" + clientIp;
    String clientSessionId = request.sessionId();
    String sessionId;
    if (clientSessionId != null && clientSessionId.startsWith(userSessionPrefix + ":")) {
      sessionId = clientSessionId;
    } else {
      sessionId = userSessionPrefix + ":" + UUID.randomUUID().toString();
    }
    String language = request.language() != null ? request.language() : "en";

    // Get or create session (with bounded size to prevent memory exhaustion)
    if (!sessions.containsKey(sessionId) && sessions.size() >= MAX_SESSIONS) {
      String errorMsg =
          "et".equals(language)
              ? "Liiga palju aktiivseid sessioone. Proovige hiljem uuesti."
              : "Too many active sessions. Please try again later.";
      return new ChatResponse(errorMsg, false, 0, 0, null, null, List.of());
    }
    List<Map<String, String>> messages =
        sessions.computeIfAbsent(sessionId, k -> new ArrayList<>());
    sessionLastAccess.put(sessionId, System.currentTimeMillis());

    // Trim old turns if over limit
    while (messages.size() >= MAX_TURNS * 2) {
      messages.remove(0);
      messages.remove(0);
    }

    // Add user message
    messages.add(Map.of("role", "user", "content", request.message()));

    // Build system prompt
    String systemPrompt = buildSystemPrompt(language, request.currentPage());

    try {
      String reply = claudeApi.analyzeChat(systemPrompt, List.copyOf(messages), MAX_REPLY_TOKENS);

      // Parse follow-up suggestions from reply
      String cleanReply = reply;
      List<String> followups = new ArrayList<>();
      int followupMarker = reply.indexOf("---FOLLOWUPS---");
      if (followupMarker >= 0) {
        cleanReply = reply.substring(0, followupMarker).trim();
        String followupSection = reply.substring(followupMarker + 15).trim();
        for (String line : followupSection.split("\\n")) {
          String q = line.replaceFirst("^[-\\d.\\s*]+", "").trim();
          if (!q.isEmpty() && q.length() > 5) {
            followups.add(q);
          }
        }
        if (followups.size() > 3) followups = followups.subList(0, 3);
      }

      // Add assistant reply to session (clean version without followup markers)
      messages.add(Map.of("role", "assistant", "content", cleanReply));

      // Extract tool suggestion
      String suggestedTool = extractToolSuggestion(cleanReply);
      String suggestedToolName =
          suggestedTool != null ? getToolName(suggestedTool, language) : null;

      int used = authenticated ? 0 : countRecentRequests(rateLimitKey);
      int limit = authenticated ? 0 : ANONYMOUS_LIMIT;

      return new ChatResponse(
          cleanReply, false, used, limit, suggestedTool, suggestedToolName, followups);
    } catch (Exception e) {
      log.error("Chat API error: {}", e.getMessage());
      // Remove the user message since we failed
      if (!messages.isEmpty()) {
        messages.remove(messages.size() - 1);
      }
      String errorMsg =
          switch (language) {
            case "et" -> "Vabandust, tehniline viga. Palun proovige uuesti.";
            default -> "Sorry, a technical error occurred. Please try again.";
          };
      int used = authenticated ? 0 : countRecentRequests(rateLimitKey);
      int limit = authenticated ? 0 : ANONYMOUS_LIMIT;
      return new ChatResponse(errorMsg, false, used, limit, null, null, List.of());
    }
  }

  private String buildSystemPrompt(String language, String currentPage) {
    String langInstruction =
        switch (language) {
          case "et" ->
              "IMPORTANT: Always respond in Estonian (eesti keel). The user's interface is in Estonian.";
          default -> "Respond in English.";
        };

    String pageContext = "";
    if (currentPage != null && !currentPage.isBlank()) {
      String pageName = getPageDescription(currentPage);
      if (pageName != null) {
        pageContext =
            "\nCONTEXT: The user is currently viewing the \""
                + pageName
                + "\" page ("
                + currentPage
                + "). "
                + "If their question seems related to this page, provide contextually relevant answers. "
                + "You can reference features on this page directly.\n";
      }
    }

    return "You are DoraBot, an AI compliance assistant for the DoraAudit.eu platform. "
        + "You help users understand the EU DORA regulation (Digital Operational Resilience Act, EU 2022/2554), "
        + "answer questions about compliance requirements, ICT risk management, incident reporting, "
        + "contract requirements (especially Article 30), and guide them to relevant platform tools.\n\n"
        + langInstruction
        + "\n"
        + pageContext
        + "\n"
        + "RULES:\n"
        + "- Be concise but thorough. Use bullet points for clarity.\n"
        + "- When a question relates to a specific platform tool, mention it with its path (e.g., /assessment, /contract-analysis).\n"
        + "- Always cite specific DORA articles when relevant (e.g., Art. 30(2)(a)).\n"
        + "- If a question is outside DORA/NIS2 scope, politely redirect to DORA topics.\n"
        + "- Never invent regulatory requirements. If unsure, say so.\n"
        + "- Keep responses under 300 words.\n"
        + "- IMPORTANT: After your response, add a line with exactly '---FOLLOWUPS---' followed by 2-3 short follow-up questions the user might want to ask next (one per line, in the same language as your response). These should be natural continuations of the topic.\n\n"
        + DoraKnowledgeBase.getKnowledge();
  }

  private String getPageDescription(String path) {
    // Strip language prefix
    String clean = path.replaceFirst("^/(en|et)/", "/").replaceFirst("^/(en|et)$", "/");
    return switch (clean) {
      case "/", "" -> "Landing Page";
      case "/assessment" -> "DORA Self-Assessment";
      case "/contract-analysis" -> "ICT Contract Analysis (Art. 30)";
      case "/contract-generator" -> "ICT Contract Generator";
      case "/contract-checklist" -> "DORA Art. 30 Contract Checklist";
      case "/incident-reporting" -> "Incident Reporting (Art. 19)";
      case "/incident-decision-tree" -> "Incident Classification Decision Tree (Art. 18)";
      case "/tlpt" -> "TLPT Module (Art. 26-27)";
      case "/concentration-risk" -> "Concentration Risk Analysis (Art. 29)";
      case "/roi" -> "Register of Information (Art. 28)";
      case "/dora-explorer" -> "DORA Regulation Explorer";
      case "/framework-mapping" -> "Multi-Framework Compliance Mapping";
      case "/training-quiz" -> "DORA Staff Training Quiz";
      case "/fine-calculator" -> "DORA Fine Calculator";
      case "/playbook" -> "DORA Action Playbook";
      case "/policy-generator" -> "Policy Document Generator";
      case "/guardian" -> "Guardian Contract Monitoring";
      case "/command-center" -> "Compliance Command Center";
      case "/supply-chain" -> "ICT Supply Chain Management";
      case "/risk-heatmap" -> "Risk Heat Map";
      case "/maturity" -> "Maturity Model Assessment";
      case "/workspace" -> "Compliance Workspace";
      case "/pricing" -> "Pricing Plans";
      case "/dashboard" -> "User Dashboard";
      default -> null;
    };
  }

  private int countRecentRequests(String key) {
    List<Long> timestamps = rateLimits.get(key);
    if (timestamps == null) return 0;
    long cutoff = System.currentTimeMillis() - RATE_WINDOW_MS;
    synchronized (timestamps) {
      timestamps.removeIf(ts -> ts < cutoff);
      return timestamps.size();
    }
  }

  private void recordRequest(String key) {
    rateLimits
        .computeIfAbsent(key, k -> Collections.synchronizedList(new ArrayList<>()))
        .add(System.currentTimeMillis());
  }

  private static final Map<String, String[]> TOOL_KEYWORDS =
      Map.ofEntries(
          Map.entry(
              "/assessment",
              new String[] {
                "self-assessment",
                "hindamine",
                "assessment",
                "evaluate",
                "check compliance",
                "nov\u0113rt\u0113jums",
                "vertinimas"
              }),
          Map.entry(
              "/contract-analysis",
              new String[] {
                "contract analysis",
                "lepinguanalüüs",
                "upload contract",
                "analyze contract",
                "l\u012bgumu anal\u012bze",
                "sutar\u010di\u0173 analiz\u0117"
              }),
          Map.entry(
              "/contract-generator",
              new String[] {
                "generate contract", "contract template", "lepingumall", "create contract"
              }),
          Map.entry(
              "/contract-checklist",
              new String[] {"checklist", "art 30 checklist", "kontrollnimekiri"}),
          Map.entry(
              "/incident-reporting",
              new String[] {"incident report", "report incident", "intsidendi teade", "art 19"}),
          Map.entry(
              "/incident-decision-tree",
              new String[] {
                "classify incident", "incident classification", "art 18", "decision tree"
              }),
          Map.entry(
              "/tlpt", new String[] {"tlpt", "penetration test", "tiber", "art 26", "art 27"}),
          Map.entry(
              "/concentration-risk",
              new String[] {"concentration risk", "provider dependency", "art 29"}),
          Map.entry("/roi", new String[] {"register of information", "roi", "art 28", "xbrl"}),
          Map.entry(
              "/dora-explorer",
              new String[] {"browse articles", "read dora", "article text", "regulation text"}),
          Map.entry(
              "/framework-mapping",
              new String[] {"iso 27001", "nis2 mapping", "gdpr mapping", "framework comparison"}),
          Map.entry(
              "/training-quiz",
              new String[] {"quiz", "training", "staff awareness", "test knowledge"}),
          Map.entry("/fine-calculator", new String[] {"fine", "penalty", "sanction", "trahv"}),
          Map.entry("/playbook", new String[] {"action plan", "playbook", "tegevuskava"}),
          Map.entry(
              "/policy-generator", new String[] {"policy", "document generator", "poliitika"}),
          Map.entry(
              "/guardian", new String[] {"monitoring", "alerts", "contract expiry", "teavitused"}),
          Map.entry(
              "/command-center",
              new String[] {"dashboard", "overview", "command center", "ülevaade"}));

  private String extractToolSuggestion(String reply) {
    String lowerReply = reply.toLowerCase();
    for (var entry : TOOL_KEYWORDS.entrySet()) {
      for (String keyword : entry.getValue()) {
        if (lowerReply.contains(keyword.toLowerCase())) {
          return entry.getKey();
        }
      }
    }
    return null;
  }

  private static final Map<String, Map<String, String>> TOOL_NAMES =
      Map.ofEntries(
          Map.entry(
              "/assessment",
              Map.of(
                  "en",
                  "Self-Assessment",
                  "et",
                  "Enesehindamine",
                  "lv",
                  "Pa\u0161nov\u0113rt\u0113jums",
                  "lt",
                  "Savivertinimas")),
          Map.entry(
              "/contract-analysis",
              Map.of(
                  "en",
                  "Contract Analysis",
                  "et",
                  "Lepinguanalüüs",
                  "lv",
                  "L\u012bgumu anal\u012bze",
                  "lt",
                  "Sutar\u010di\u0173 analiz\u0117")),
          Map.entry(
              "/contract-generator",
              Map.of(
                  "en",
                  "Contract Generator",
                  "et",
                  "Lepingugeneraator",
                  "lv",
                  "L\u012bgumu \u0123enerators",
                  "lt",
                  "Sutar\u010di\u0173 generatorius")),
          Map.entry(
              "/contract-checklist",
              Map.of(
                  "en",
                  "Contract Checklist",
                  "et",
                  "Lepingu kontrollnimekiri",
                  "lv",
                  "L\u012bgumu kontrolsaraksts",
                  "lt",
                  "Sutarties kontrolinis s\u0105ra\u0161as")),
          Map.entry(
              "/incident-reporting",
              Map.of(
                  "en",
                  "Incident Reporting",
                  "et",
                  "Intsidendi raporteerimine",
                  "lv",
                  "Incidentu zi\u0146o\u0161ana",
                  "lt",
                  "Incident\u0173 ataskait\u0173 teikimas")),
          Map.entry(
              "/incident-decision-tree",
              Map.of(
                  "en",
                  "Incident Classification",
                  "et",
                  "Intsidendi klassifitseerimine",
                  "lv",
                  "Incidentu klasifik\u0101cija",
                  "lt",
                  "Incident\u0173 klasifikavimas")),
          Map.entry(
              "/tlpt",
              Map.of(
                  "en",
                  "TLPT Module",
                  "et",
                  "TLPT moodul",
                  "lv",
                  "TLPT modulis",
                  "lt",
                  "TLPT modulis")),
          Map.entry(
              "/concentration-risk",
              Map.of(
                  "en",
                  "Concentration Risk",
                  "et",
                  "Kontsentreerumisrisk",
                  "lv",
                  "Koncentr\u0101cijas risks",
                  "lt",
                  "Koncentracijos rizika")),
          Map.entry(
              "/roi",
              Map.of(
                  "en",
                  "Register of Information",
                  "et",
                  "Teaberegister",
                  "lv",
                  "Inform\u0101cijas re\u0123istrs",
                  "lt",
                  "Informacijos registras")),
          Map.entry(
              "/dora-explorer",
              Map.of(
                  "en",
                  "DORA Explorer",
                  "et",
                  "DORA sirvija",
                  "lv",
                  "DORA p\u0101rl\u016Bks",
                  "lt",
                  "DORA nar\u0161ykl\u0117")),
          Map.entry(
              "/framework-mapping",
              Map.of(
                  "en",
                  "Framework Mapping",
                  "et",
                  "Raamistiku kaardistus",
                  "lv",
                  "Ietvaru kartogr\u0101fija",
                  "lt",
                  "Strukt\u016Bru \u017eem\u0117lapis")),
          Map.entry(
              "/training-quiz",
              Map.of(
                  "en",
                  "Training Quiz",
                  "et",
                  "Koolitusviktoriin",
                  "lv",
                  "Apm\u0101c\u012bbu viktoriin",
                  "lt",
                  "Mokymo viktorina")),
          Map.entry(
              "/fine-calculator",
              Map.of(
                  "en",
                  "Fine Calculator",
                  "et",
                  "Trahvikalkulaator",
                  "lv",
                  "Sodu kalkulators",
                  "lt",
                  "Baud\u0173 skai\u010diuokl\u0117")),
          Map.entry(
              "/playbook",
              Map.of(
                  "en",
                  "Action Playbook",
                  "et",
                  "Tegevuskava",
                  "lv",
                  "R\u012bc\u012bbas pl\u0101ns",
                  "lt",
                  "Veiksm\u0173 planas")),
          Map.entry(
              "/policy-generator",
              Map.of(
                  "en",
                  "Policy Generator",
                  "et",
                  "Poliitikageneraator",
                  "lv",
                  "Politiku \u0123enerators",
                  "lt",
                  "Politikos generatorius")),
          Map.entry(
              "/guardian",
              Map.of(
                  "en",
                  "Guardian Monitoring",
                  "et",
                  "Guardian seire",
                  "lv",
                  "Guardian monitorings",
                  "lt",
                  "Guardian steb\u0117jimas")),
          Map.entry(
              "/command-center",
              Map.of(
                  "en",
                  "Command Center",
                  "et",
                  "Juhtimiskeskus",
                  "lv",
                  "Komandcentrs",
                  "lt",
                  "Valdymo centras")));

  private String getToolName(String toolPath, String language) {
    Map<String, String> names = TOOL_NAMES.get(toolPath);
    if (names == null) return toolPath;
    return names.getOrDefault(language, names.get("en"));
  }

  @Scheduled(fixedRate = 900_000) // every 15 minutes
  public void cleanupExpiredSessions() {
    long now = System.currentTimeMillis();
    int removed = 0;
    for (var entry : sessionLastAccess.entrySet()) {
      if (now - entry.getValue() > SESSION_TTL_MS) {
        sessions.remove(entry.getKey());
        sessionLastAccess.remove(entry.getKey());
        removed++;
      }
    }
    // Clean old rate limit entries
    long cutoff = now - RATE_WINDOW_MS;
    for (var entry : rateLimits.entrySet()) {
      synchronized (entry.getValue()) {
        entry.getValue().removeIf(ts -> ts < cutoff);
      }
      if (entry.getValue().isEmpty()) {
        rateLimits.remove(entry.getKey());
      }
    }
    if (removed > 0) {
      log.debug("Cleaned up {} expired chat sessions", removed);
    }
  }
}
