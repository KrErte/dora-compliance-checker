package com.dorachecker.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import javax.crypto.SecretKey;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

@Service
public class JwtService {

  @Value("${jwt.secret}")
  private String secret;

  @Value("${jwt.expiration-ms}")
  private long expirationMs;

  // In-memory blacklist: token -> expiry timestamp
  private final Map<String, Long> blacklist = new ConcurrentHashMap<>();

  private SecretKey getSigningKey() {
    return Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
  }

  public String generateToken(String userId, String email, String role) {
    return Jwts.builder()
        .subject(userId)
        .claim("email", email)
        .claim("role", role)
        .issuedAt(new Date())
        .expiration(new Date(System.currentTimeMillis() + expirationMs))
        .signWith(getSigningKey())
        .compact();
  }

  public String getUserIdFromToken(String token) {
    return getClaims(token).getSubject();
  }

  public String getRoleFromToken(String token) {
    String role = getClaims(token).get("role", String.class);
    return role != null ? role : "USER";
  }

  public boolean isTokenValid(String token) {
    try {
      if (blacklist.containsKey(token)) {
        return false;
      }
      getClaims(token);
      return true;
    } catch (JwtException | IllegalArgumentException e) {
      return false;
    }
  }

  public void blacklistToken(String token) {
    try {
      Claims claims = getClaims(token);
      blacklist.put(token, claims.getExpiration().getTime());
    } catch (JwtException | IllegalArgumentException e) {
      // Token already invalid, no need to blacklist
    }
  }

  @Scheduled(fixedRate = 3600000) // Clean up every hour
  public void cleanupBlacklist() {
    long now = System.currentTimeMillis();
    blacklist.entrySet().removeIf(entry -> entry.getValue() < now);
  }

  private Claims getClaims(String token) {
    return Jwts.parser().verifyWith(getSigningKey()).build().parseSignedClaims(token).getPayload();
  }
}
