package com.hms.gateway.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.gateway.filter.GatewayFilter;
import org.springframework.cloud.gateway.filter.factory.AbstractGatewayFilterFactory;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.util.MultiValueMap;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.security.Key;
import java.util.Locale;

@Component
public class JwtFilter extends AbstractGatewayFilterFactory<JwtFilter.Config> {

    @Value("${hms.security.jwt.secret:mysecretkey12345678901234567890AB}")
    private String jwtSecret = "mysecretkey12345678901234567890AB";

    public JwtFilter() {
        super(Config.class);
    }

    public static class Config {}

    private Key getSigningKey() {
        return Keys.hmacShaKeyFor(jwtSecret.getBytes());
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

            // ✅ Allow /auth endpoints (login/register/validate) without MANDATORY token
            // But if they HAVE a token, we parse it to propagate roles (e.g. for Admin registry lock)
            if (path.startsWith("/auth/")) {
                if (!exchange.getRequest().getHeaders().containsKey("Authorization")) {
                    return chain.filter(exchange);
                }
            }

            // Block if no Authorization header for protected routes
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

            if (!isOwnershipAllowed(exchange, normalizedRole, userIdHeader)) {
                return onError(exchange, HttpStatus.FORBIDDEN, "Ownership check failed");
            }
            try {
                ServerHttpRequest.Builder builder = exchange.getRequest().mutate();
                if (builder == null) {
                    return chain.filter(exchange);
                }

                ServerHttpRequest mutatedRequest = builder
                        .header("X-User-Role", normalizedRole != null ? normalizedRole : "")
                        .header("X-Username", username != null ? username : "")
                        .header("X-User-Id", userIdHeader)
                        .build();

                if (exchange.mutate() == null) {
                    return chain.filter(exchange);
                }

                return chain.filter(exchange.mutate().request(mutatedRequest).build());
            } catch (NullPointerException ignored) {
                return chain.filter(exchange);
            }
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
                if (path.startsWith("/lab-results/") && method == HttpMethod.GET) return true;
                if (path.startsWith("/lab-results/") && method == HttpMethod.PUT) return true;
                if (path.startsWith("/notifications/me") && method == HttpMethod.GET) return true;
                if (path.startsWith("/notifications/preferences") && (method == HttpMethod.GET || method == HttpMethod.PUT)) return true;
                if (path.startsWith("/notifications/") && path.endsWith("/read") && method == HttpMethod.PUT) return true;
                if (path.startsWith("/notifications/") && path.endsWith("/escalate") && method == HttpMethod.POST) return true;
                if (path.startsWith("/notifications/") && path.endsWith("/resolve") && method == HttpMethod.POST) return true;
                if (path.startsWith("/notifications/") && path.endsWith("/reassign") && method == HttpMethod.POST) return true;
                if (path.startsWith("/notifications/") && path.endsWith("/reassign") && method == HttpMethod.POST) return true;
                if (path.startsWith("/reporting/")) return true;
                if (path.startsWith("/labs/tests-catalog")) return true;
                if (path.startsWith("/labs/orders")) return true;
                if (path.startsWith("/prescriptions")) return true;
                if (path.startsWith("/records")) return true;
                if (path.startsWith("/medications")) return true;
                return false;

            case "PATIENT":
                // Patients can:
                if (path.startsWith("/doctors") && method == HttpMethod.GET) return true;
                if (path.startsWith("/patients") && method == HttpMethod.GET) return true;
                if (path.equals("/appointments") && method == HttpMethod.POST) return true;
                if (path.startsWith("/appointments/patient/")) return true;
                if (path.startsWith("/appointments/timeslots")) return true;
                if (path.startsWith("/slots/available/")) return true;
                if (path.startsWith("/lab/orders/patient/")) return true;
                if (path.startsWith("/lab/reports/patient/")) return true;
                if (path.startsWith("/lab-results/patient/")) return true;
                if (path.startsWith("/lab/tests") && method == HttpMethod.GET) return true;
                if (path.startsWith("/notifications/me") && method == HttpMethod.GET) return true;
                if (path.startsWith("/notifications/preferences") && (method == HttpMethod.GET || method == HttpMethod.PUT)) return true;
                if (path.startsWith("/notifications/") && path.endsWith("/read") && method == HttpMethod.PUT) return true;
                if (path.startsWith("/invoices/patient/") && method == HttpMethod.GET) return true;
                if (path.startsWith("/invoices/") && path.endsWith("/pay") && method == HttpMethod.POST) return true;
                if (path.startsWith("/invoices/") && path.endsWith("/claim-status") && method == HttpMethod.GET) return true;
                if (path.startsWith("/reporting/")) return true;
                if (path.startsWith("/medications") && method == HttpMethod.GET) return true;
                if (path.startsWith("/prescriptions/patient/")) return true;
                if (path.startsWith("/invoices/patient/") && method == HttpMethod.GET) return true;
                if (path.startsWith("/records/patient/")) return true;
                if (path.startsWith("/records/icd10")) return true;
                if (path.startsWith("/labs/tests-catalog")) return true;
                if (path.startsWith("/labs/orders") && method == HttpMethod.POST) return true;
                if (path.startsWith("/lab-results/") && path.endsWith("/pdf")) return true;
                if (path.startsWith("/doctors/specialties")) return true;
                return false;

            default:
                return false;
        }
    }

    private Mono<Void> onError(ServerWebExchange exchange, HttpStatus status, String message) {
        exchange.getResponse().setStatusCode(status);
        return exchange.getResponse().setComplete();
    }

    private boolean isOwnershipAllowed(ServerWebExchange exchange, String role, String userIdHeader) {
        if (!"PATIENT".equalsIgnoreCase(role)) {
            return true;
        }

        Long callerUserId = parseLong(userIdHeader);
        if (callerUserId == null) {
            return true;
        }

        String path = exchange.getRequest().getURI().getPath();
        MultiValueMap<String, String> queryParams = exchange.getRequest().getQueryParams();

        Long pathScopedId = extractScopedPatientId(path);
        if (pathScopedId != null) {
            return callerUserId.equals(pathScopedId);
        }

        if (path.startsWith("/notifications/me") || path.startsWith("/notifications/preferences")) {
            String rawUserId = queryParams != null ? queryParams.getFirst("userId") : extractQueryParamFromUri(exchange, "userId");
            Long queryUserId = parseLong(rawUserId);
            return queryUserId == null || callerUserId.equals(queryUserId);
        }

        return true;
    }

    private Long extractScopedPatientId(String path) {
        if (path == null) return null;

        if (path.startsWith("/patients/")) {
            return parseTailId(path, "/patients/");
        }
        if (path.startsWith("/appointments/patient/")) {
            return parseTailId(path, "/appointments/patient/");
        }
        if (path.startsWith("/lab/orders/patient/")) {
            return parseTailId(path, "/lab/orders/patient/");
        }
        if (path.startsWith("/lab/reports/patient/")) {
            return parseTailId(path, "/lab/reports/patient/");
        }
        if (path.startsWith("/lab-results/patient/")) {
            return parseTailId(path, "/lab-results/patient/");
        }
        if (path.startsWith("/invoices/patient/")) {
            return parseTailId(path, "/invoices/patient/");
        }
        if (path.startsWith("/prescriptions/patient/")) {
            return parseTailId(path, "/prescriptions/patient/");
        }
        if (path.startsWith("/records/patient/")) {
            return parseTailId(path, "/records/patient/");
        }

        return null;
    }

    private Long parseTailId(String path, String prefix) {
        String tail = path.substring(prefix.length());
        int slashIndex = tail.indexOf('/');
        String idText = slashIndex >= 0 ? tail.substring(0, slashIndex) : tail;
        return parseLong(idText);
    }

    private Long parseLong(String raw) {
        if (raw == null || raw.isBlank()) return null;
        try {
            return Long.parseLong(raw);
        } catch (NumberFormatException ignored) {
            return null;
        }
    }

    private String extractQueryParamFromUri(ServerWebExchange exchange, String key) {
        if (exchange == null || exchange.getRequest() == null || exchange.getRequest().getURI() == null) return null;
        String query = exchange.getRequest().getURI().getQuery();
        if (query == null || query.isBlank()) return null;

        for (String part : query.split("&")) {
            String[] kv = part.split("=", 2);
            if (kv.length == 2 && key.equals(kv[0])) {
                return kv[1];
            }
        }
        return null;
    }
}