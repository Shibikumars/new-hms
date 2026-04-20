package com.hms.auth.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.security.Key;
import java.util.Date;
import java.util.UUID;

@Component
public class JwtUtil {

    @Value("${hms.security.jwt.secret:mysecretkey12345678901234567890AB}")
    private String jwtSecret = "mysecretkey12345678901234567890AB";

    private Key getSigningKey() {
        return Keys.hmacShaKeyFor(jwtSecret.getBytes());
    }

    // Backward-compatible overload
    public String generateToken(String username, String role) {
        return generateToken(username, role, null);
    }

    // Accepts role and optional user id claims
    public String generateToken(String username, String role, Long userId) {
        String subject = username != null ? username : "";
        JwtBuilder builder = Jwts.builder()
                .setSubject(subject)
                .setId(UUID.randomUUID().toString())
                .claim("role", role)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + 1000 * 60 * 60 * 10));

        if (userId != null) {
            builder.claim("userId", userId);
        }

        return builder
                .signWith(getSigningKey())
                .compact();
    }

    public String extractUsername(String token) {
        return getClaims(token).getSubject();
    }

    public String extractRole(String token) {
        return (String) getClaims(token).get("role");
    }

    private Claims getClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
    }
}