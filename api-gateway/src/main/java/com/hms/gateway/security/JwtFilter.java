package com.hms.gateway.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.cloud.gateway.filter.GatewayFilter;
import org.springframework.cloud.gateway.filter.factory.AbstractGatewayFilterFactory;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.security.Key;
import java.util.Locale;

@Component
public class JwtFilter extends AbstractGatewayFilterFactory<JwtFilter.Config> {

    private final String SECRET = "mysecretkey12345678901234567890AB";

    public JwtFilter() {
        super(Config.class);
    }

    public static class Config {}

    private Key getSigningKey() {
        return Keys.hmacShaKeyFor(SECRET.getBytes());
    }

    @Override
    public GatewayFilter apply(Config config) {
        return (exchange, chain) -> {

            String path = exchange.getRequest().getURI().getPath();
            HttpMethod method = exchange.getRequest().getMethod();

            // ✅ Allow CORS preflight requests through without auth
            if (method == HttpMethod.OPTIONS) {
                return chain.filter(exchange);
            }

            // ✅ Allow /auth endpoints (login/register/validate) without token
            if (path.startsWith("/auth/")) {
                return chain.filter(exchange);
            }

            // Block if no Authorization header
            if (!exchange.getRequest().getHeaders().containsKey("Authorization")) {
                return onError(exchange, HttpStatus.UNAUTHORIZED, "Missing Authorization Header");
            }

            String authHeader = exchange.getRequest().getHeaders().getFirst("Authorization");

            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                return onError(exchange, HttpStatus.UNAUTHORIZED, "Invalid Authorization Format");
            }

            String token = authHeader.substring(7);
            Claims claims;

            try {
                claims = Jwts.parserBuilder()
                        .setSigningKey(getSigningKey())
                        .build()
                        .parseClaimsJws(token)
                        .getBody();
            } catch (Exception e) {
                return onError(exchange, HttpStatus.UNAUTHORIZED, "Invalid or Expired Token");
            }

            String role = (String) claims.get("role");
            String username = claims.getSubject();
            Object userIdClaim = claims.get("userId");

            // Normalize role claim (handles legacy "USER" values)
            String normalizedRole = normalizeRole(role);

            // ✅ Check role-based access for this path+method
            if (!isAllowed(path, method, normalizedRole)) {
                return onError(exchange, HttpStatus.FORBIDDEN, "Access Denied for role: " + normalizedRole);
            }

            // ✅ Forward role and username as headers to downstream services
            String userIdHeader = userIdClaim != null ? String.valueOf(userIdClaim) : "";
            ServerHttpRequest mutatedRequest = exchange.getRequest().mutate()
                    .header("X-User-Role", normalizedRole != null ? normalizedRole : "")
                    .header("X-Username", username != null ? username : "")
                    .header("X-User-Id", userIdHeader)
                    .build();

            return chain.filter(exchange.mutate().request(mutatedRequest).build());
        };
    }

    private String normalizeRole(String role) {
        if (role == null) return null;
        String r = role.trim().toUpperCase(Locale.ROOT);
        // Backwards compatibility: some existing users might have been stored as USER
        if ("USER".equals(r)) return "PATIENT";
        return r;
    }

    /**
     * Role-based access rules.
     * ADMIN  = full access
     * DOCTOR = appointments, lab orders/reports, view doctors/patients
     * PATIENT = own data, book appointments, view own lab data
     */
    private boolean isAllowed(String path, HttpMethod method, String role) {
        if (role == null) return false;

        switch (role) {
            case "ADMIN":
                return true; // Admin can do everything

            case "DOCTOR":
                if (path.startsWith("/doctors") && method == HttpMethod.GET) return true;
                if (path.startsWith("/doctors") && method == HttpMethod.PUT) return true;
                if (path.startsWith("/patients") && method == HttpMethod.GET) return true;
                if (path.startsWith("/appointments")) return true;
                if (path.startsWith("/slots")) return true;
                if (path.equals("/lab/orders") && method == HttpMethod.POST) return true;
                if (path.equals("/lab/reports") && method == HttpMethod.POST) return true;
                if (path.startsWith("/lab/orders") && method == HttpMethod.GET) return true;
                if (path.startsWith("/lab/reports") && method == HttpMethod.GET) return true;
                if (path.startsWith("/lab/tests") && method == HttpMethod.GET) return true;
                return false;

            case "PATIENT":
                // Patients can:
                if (path.startsWith("/doctors") && method == HttpMethod.GET) return true;
                if (path.startsWith("/patients") && method == HttpMethod.GET) return true;
                if (path.equals("/appointments") && method == HttpMethod.POST) return true;
                if (path.startsWith("/appointments/patient/")) return true;
                if (path.startsWith("/slots/available/")) return true;
                if (path.startsWith("/lab/orders/patient/")) return true;
                if (path.startsWith("/lab/reports/patient/")) return true;
                if (path.startsWith("/notifications/me") && method == HttpMethod.GET) return true;
                if (path.startsWith("/notifications/preferences") && (method == HttpMethod.GET || method == HttpMethod.PUT)) return true;
                if (path.startsWith("/notifications/") && path.endsWith("/read") && method == HttpMethod.PUT) return true;
                if (path.startsWith("/invoices/patient/") && method == HttpMethod.GET) return true;
                if (path.startsWith("/invoices/") && path.endsWith("/pay") && method == HttpMethod.POST) return true;
                if (path.startsWith("/invoices/") && path.endsWith("/claim-status") && method == HttpMethod.GET) return true;
                return false;

            default:
                return false;
        }
    }

    private Mono<Void> onError(ServerWebExchange exchange, HttpStatus status, String message) {
        exchange.getResponse().setStatusCode(status);
        return exchange.getResponse().setComplete();
    }
}