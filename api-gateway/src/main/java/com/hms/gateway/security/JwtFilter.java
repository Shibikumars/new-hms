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

            // ✅ Allow /auth endpoints (login/register) without token
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

            // ✅ Check role-based access for this path+method
            if (!isAllowed(path, method, role)) {
                return onError(exchange, HttpStatus.FORBIDDEN, "Access Denied for role: " + role);
            }

            // ✅ Forward role and username as headers to downstream services
            ServerHttpRequest mutatedRequest = exchange.getRequest().mutate()
                    .header("X-User-Role", role != null ? role : "")
                    .header("X-Username", username != null ? username : "")
                    .build();

            return chain.filter(exchange.mutate().request(mutatedRequest).build());
        };
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