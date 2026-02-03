package com.qms.util;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.security.Key;
import java.util.Date;

@Component
public class JwtUtil {
  @Value("${qms.jwt.secret}")
  private String secret;
  @Value("${qms.jwt.issuer}")
  private String issuer;
  @Value("${qms.jwt.expire-minutes}")
  private Integer expireMinutes;

  private Key getSigningKey() {
    byte[] keyBytes = Decoders.BASE64.decode(java.util.Base64.getEncoder().encodeToString(secret.getBytes()));
    return Keys.hmacShaKeyFor(keyBytes);
  }

  public String generate(String subject) {
    Date now = new Date();
    Date exp = new Date(now.getTime() + expireMinutes * 60_000L);
    return Jwts.builder()
        .subject(subject)
        .issuer(issuer)
        .issuedAt(now)
        .expiration(exp)
        .signWith(getSigningKey())
        .compact();
  }

  public Claims parse(String token) {
    try {
      return Jwts.parser()
          .verifyWith((javax.crypto.SecretKey) getSigningKey())
          .build()
          .parseSignedClaims(token)
          .getPayload();
    } catch (Exception e) {
      System.err.println("JWT Parse Error: " + e.getMessage());
      e.printStackTrace();
      return null;
    }
  }
}

