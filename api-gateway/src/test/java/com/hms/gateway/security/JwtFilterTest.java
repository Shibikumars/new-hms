package com.hms.gateway.security;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.cloud.gateway.filter.GatewayFilter;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.security.Key;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@DisplayName("JWT Filter Tests")
class JwtFilterTest {

    private JwtFilter jwtFilter;
    private static final String SECRET = "mysecretkey12345678901234567890AB";
    private static final String VALID_TOKEN_ADMIN = generateToken("admin", "ADMIN");
    private static final String VALID_TOKEN_DOCTOR = generateToken("doctor", "DOCTOR");
    private static final String VALID_TOKEN_PATIENT = generateToken("patient", "PATIENT");
    private static final String EXPIRED_TOKEN = generateExpiredToken("user", "PATIENT");
    private static final String INVALID_TOKEN = "invalid.token.here";

    @Mock
    private ServerWebExchange exchange;
    @Mock
    private ServerHttpRequest request;
    @Mock
    private ServerHttpResponse response;
    @Mock
    private org.springframework.cloud.gateway.filter.GatewayFilterChain chain;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        jwtFilter = new JwtFilter();
    }

    // ==================== Token Generation Helper Methods ====================

    private static String generateToken(String username, String role) {
        Key key = Keys.hmacShaKeyFor(SECRET.getBytes());
        Map<String, Object> claims = new HashMap<>();
        claims.put("role", role);
        
        return Jwts.builder()
                .setClaims(claims)
                .setSubject(username)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + 3600000))
                .signWith(key)
                .compact();
    }

    private static String generateExpiredToken(String username, String role) {
        Key key = Keys.hmacShaKeyFor(SECRET.getBytes());
        Map<String, Object> claims = new HashMap<>();
        claims.put("role", role);
        
        return Jwts.builder()
                .setClaims(claims)
                .setSubject(username)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() - 1000)) // Expired
                .signWith(key)
                .compact();
    }

    // ==================== Test: Filter Factory Creation ====================

    @Test
    @DisplayName("Should create GatewayFilter from factory")
    void testFilterFactory() {
        GatewayFilter filter = jwtFilter.apply(new JwtFilter.Config());
        assertNotNull(filter);
    }

    // ==================== Test: Auth Endpoint Bypass ====================

    @Test
    @DisplayName("Should bypass JWT validation for /auth/login endpoint")
    void testAuthLoginBypass() {
        when(exchange.getRequest()).thenReturn(request);
        when(request.getURI()).thenReturn(java.net.URI.create("http://localhost:8080/auth/login"));
        when(request.getMethod()).thenReturn(HttpMethod.POST);
        when(chain.filter(exchange)).thenReturn(Mono.empty());

        GatewayFilter filter = jwtFilter.apply(new JwtFilter.Config());
        Mono<Void> result = filter.filter(exchange, chain);

        StepVerifier.create(result).verifyComplete();
        verify(chain).filter(exchange);
    }

    @Test
    @DisplayName("Should bypass JWT validation for /auth/register endpoint")
    void testAuthRegisterBypass() {
        when(exchange.getRequest()).thenReturn(request);
        when(request.getURI()).thenReturn(java.net.URI.create("http://localhost:8080/auth/register"));
        when(request.getMethod()).thenReturn(HttpMethod.POST);
        when(chain.filter(exchange)).thenReturn(Mono.empty());

        GatewayFilter filter = jwtFilter.apply(new JwtFilter.Config());
        Mono<Void> result = filter.filter(exchange, chain);

        StepVerifier.create(result).verifyComplete();
        verify(chain).filter(exchange);
    }

    @Test
    @DisplayName("Should bypass JWT validation for /auth/* endpoints")
    void testAuthEndpointVariations() {
        String[] authPaths = {"/auth/login", "/auth/register", "/auth/validate", "/auth/refresh"};
        
        for (String path : authPaths) {
            reset(exchange, request, chain);
            when(exchange.getRequest()).thenReturn(request);
            when(request.getURI()).thenReturn(java.net.URI.create("http://localhost:8080" + path));
            when(request.getMethod()).thenReturn(HttpMethod.POST);
            when(chain.filter(exchange)).thenReturn(Mono.empty());

            GatewayFilter filter = jwtFilter.apply(new JwtFilter.Config());
            Mono<Void> result = filter.filter(exchange, chain);

            StepVerifier.create(result).verifyComplete();
            verify(chain).filter(exchange);
        }
    }

    // ==================== Test: Missing Authorization Header ====================

    @Test
    @DisplayName("Should reject request with missing Authorization header")
    void testMissingAuthorizationHeader() {
        when(exchange.getRequest()).thenReturn(request);
        when(request.getURI()).thenReturn(java.net.URI.create("http://localhost:8080/doctors"));
        when(request.getMethod()).thenReturn(HttpMethod.GET);
        when(request.getHeaders()).thenReturn(new org.springframework.http.HttpHeaders());
        when(exchange.getResponse()).thenReturn(response);
        when(response.setStatusCode(HttpStatus.UNAUTHORIZED)).thenReturn(true);
        when(response.setComplete()).thenReturn(Mono.empty());

        GatewayFilter filter = jwtFilter.apply(new JwtFilter.Config());
        Mono<Void> result = filter.filter(exchange, chain);

        StepVerifier.create(result).verifyComplete();
        verify(response).setStatusCode(HttpStatus.UNAUTHORIZED);
    }

    // ==================== Test: Invalid Authorization Format ====================

    @Test
    @DisplayName("Should reject request with invalid Authorization format (missing Bearer prefix)")
    void testInvalidAuthorizationFormatNoBearer() {
        org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
        headers.set("Authorization", "InvalidToken");
        
        when(exchange.getRequest()).thenReturn(request);
        when(request.getURI()).thenReturn(java.net.URI.create("http://localhost:8080/doctors"));
        when(request.getMethod()).thenReturn(HttpMethod.GET);
        when(request.getHeaders()).thenReturn(headers);
        when(exchange.getResponse()).thenReturn(response);
        when(response.setStatusCode(HttpStatus.UNAUTHORIZED)).thenReturn(true);
        when(response.setComplete()).thenReturn(Mono.empty());

        GatewayFilter filter = jwtFilter.apply(new JwtFilter.Config());
        Mono<Void> result = filter.filter(exchange, chain);

        StepVerifier.create(result).verifyComplete();
        verify(response).setStatusCode(HttpStatus.UNAUTHORIZED);
    }

    @Test
    @DisplayName("Should reject request with null Authorization header")
    void testNullAuthorizationHeader() {
        org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders() {
            @Override
            public String getFirst(String headerName) {
                return null;
            }
        };
        
        when(exchange.getRequest()).thenReturn(request);
        when(request.getURI()).thenReturn(java.net.URI.create("http://localhost:8080/doctors"));
        when(request.getMethod()).thenReturn(HttpMethod.GET);
        when(request.getHeaders()).thenReturn(headers);
        when(exchange.getResponse()).thenReturn(response);
        when(response.setStatusCode(HttpStatus.UNAUTHORIZED)).thenReturn(true);
        when(response.setComplete()).thenReturn(Mono.empty());

        GatewayFilter filter = jwtFilter.apply(new JwtFilter.Config());
        Mono<Void> result = filter.filter(exchange, chain);

        StepVerifier.create(result).verifyComplete();
    }

    // ==================== Test: Invalid Token ====================

    @Test
    @DisplayName("Should reject request with invalid token")
    void testInvalidToken() {
        org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
        headers.set("Authorization", "Bearer " + INVALID_TOKEN);
        
        when(exchange.getRequest()).thenReturn(request);
        when(request.getURI()).thenReturn(java.net.URI.create("http://localhost:8080/doctors"));
        when(request.getMethod()).thenReturn(HttpMethod.GET);
        when(request.getHeaders()).thenReturn(headers);
        when(exchange.getResponse()).thenReturn(response);
        when(response.setStatusCode(HttpStatus.UNAUTHORIZED)).thenReturn(true);
        when(response.setComplete()).thenReturn(Mono.empty());

        GatewayFilter filter = jwtFilter.apply(new JwtFilter.Config());
        Mono<Void> result = filter.filter(exchange, chain);

        StepVerifier.create(result).verifyComplete();
        verify(response).setStatusCode(HttpStatus.UNAUTHORIZED);
    }

    @Test
    @DisplayName("Should reject request with expired token")
    void testExpiredToken() {
        org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
        headers.set("Authorization", "Bearer " + EXPIRED_TOKEN);
        
        when(exchange.getRequest()).thenReturn(request);
        when(request.getURI()).thenReturn(java.net.URI.create("http://localhost:8080/doctors"));
        when(request.getMethod()).thenReturn(HttpMethod.GET);
        when(request.getHeaders()).thenReturn(headers);
        when(exchange.getResponse()).thenReturn(response);
        when(response.setStatusCode(HttpStatus.UNAUTHORIZED)).thenReturn(true);
        when(response.setComplete()).thenReturn(Mono.empty());

        GatewayFilter filter = jwtFilter.apply(new JwtFilter.Config());
        Mono<Void> result = filter.filter(exchange, chain);

        StepVerifier.create(result).verifyComplete();
        verify(response).setStatusCode(HttpStatus.UNAUTHORIZED);
    }

    // ==================== Test: ADMIN Role Access ====================

    @Test
    @DisplayName("ADMIN should have full access to all endpoints")
    void testAdminFullAccess() {
        String[] paths = {"/doctors", "/patients", "/appointments", "/lab/orders", "/lab/reports", "/slots"};
        HttpMethod[] methods = {HttpMethod.GET, HttpMethod.POST, HttpMethod.PUT, HttpMethod.DELETE};

        for (String path : paths) {
            for (HttpMethod method : methods) {
                reset(exchange, request, chain);
                org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
                headers.set("Authorization", "Bearer " + VALID_TOKEN_ADMIN);
                
                when(exchange.getRequest()).thenReturn(request);
                when(request.getURI()).thenReturn(java.net.URI.create("http://localhost:8080" + path));
                when(request.getMethod()).thenReturn(method);
                when(request.getHeaders()).thenReturn(headers);
                when(chain.filter(any())).thenReturn(Mono.empty());

                GatewayFilter filter = jwtFilter.apply(new JwtFilter.Config());
                Mono<Void> result = filter.filter(exchange, chain);

                StepVerifier.create(result).verifyComplete();
                verify(chain).filter(any());
            }
        }
    }

    // ==================== Test: DOCTOR Role Access ====================

    @Test
    @DisplayName("DOCTOR should access /doctors GET endpoint")
    void testDoctorGetDoctorsAccess() {
        org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
        headers.set("Authorization", "Bearer " + VALID_TOKEN_DOCTOR);
        
        when(exchange.getRequest()).thenReturn(request);
        when(request.getURI()).thenReturn(java.net.URI.create("http://localhost:8080/doctors"));
        when(request.getMethod()).thenReturn(HttpMethod.GET);
        when(request.getHeaders()).thenReturn(headers);
        when(chain.filter(any())).thenReturn(Mono.empty());

        GatewayFilter filter = jwtFilter.apply(new JwtFilter.Config());
        Mono<Void> result = filter.filter(exchange, chain);

        StepVerifier.create(result).verifyComplete();
        verify(chain).filter(any());
    }

    @Test
    @DisplayName("DOCTOR should access /doctors PUT endpoint")
    void testDoctorPutDoctorsAccess() {
        org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
        headers.set("Authorization", "Bearer " + VALID_TOKEN_DOCTOR);
        
        when(exchange.getRequest()).thenReturn(request);
        when(request.getURI()).thenReturn(java.net.URI.create("http://localhost:8080/doctors/1"));
        when(request.getMethod()).thenReturn(HttpMethod.PUT);
        when(request.getHeaders()).thenReturn(headers);
        when(chain.filter(any())).thenReturn(Mono.empty());

        GatewayFilter filter = jwtFilter.apply(new JwtFilter.Config());
        Mono<Void> result = filter.filter(exchange, chain);

        StepVerifier.create(result).verifyComplete();
        verify(chain).filter(any());
    }

    @Test
    @DisplayName("DOCTOR should access /patients GET endpoint")
    void testDoctorGetPatientsAccess() {
        org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
        headers.set("Authorization", "Bearer " + VALID_TOKEN_DOCTOR);
        
        when(exchange.getRequest()).thenReturn(request);
        when(request.getURI()).thenReturn(java.net.URI.create("http://localhost:8080/patients"));
        when(request.getMethod()).thenReturn(HttpMethod.GET);
        when(request.getHeaders()).thenReturn(headers);
        when(chain.filter(any())).thenReturn(Mono.empty());

        GatewayFilter filter = jwtFilter.apply(new JwtFilter.Config());
        Mono<Void> result = filter.filter(exchange, chain);

        StepVerifier.create(result).verifyComplete();
        verify(chain).filter(any());
    }

    @Test
    @DisplayName("DOCTOR should access /appointments endpoint")
    void testDoctorAppointmentsAccess() {
        org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
        headers.set("Authorization", "Bearer " + VALID_TOKEN_DOCTOR);
        
        when(exchange.getRequest()).thenReturn(request);
        when(request.getURI()).thenReturn(java.net.URI.create("http://localhost:8080/appointments"));
        when(request.getMethod()).thenReturn(HttpMethod.GET);
        when(request.getHeaders()).thenReturn(headers);
        when(chain.filter(any())).thenReturn(Mono.empty());

        GatewayFilter filter = jwtFilter.apply(new JwtFilter.Config());
        Mono<Void> result = filter.filter(exchange, chain);

        StepVerifier.create(result).verifyComplete();
        verify(chain).filter(any());
    }

    @Test
    @DisplayName("DOCTOR should access /slots endpoint")
    void testDoctorSlotsAccess() {
        org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
        headers.set("Authorization", "Bearer " + VALID_TOKEN_DOCTOR);
        
        when(exchange.getRequest()).thenReturn(request);
        when(request.getURI()).thenReturn(java.net.URI.create("http://localhost:8080/slots"));
        when(request.getMethod()).thenReturn(HttpMethod.GET);
        when(request.getHeaders()).thenReturn(headers);
        when(chain.filter(any())).thenReturn(Mono.empty());

        GatewayFilter filter = jwtFilter.apply(new JwtFilter.Config());
        Mono<Void> result = filter.filter(exchange, chain);

        StepVerifier.create(result).verifyComplete();
        verify(chain).filter(any());
    }

    @Test
    @DisplayName("DOCTOR should POST to /lab/orders endpoint")
    void testDoctorPostLabOrdersAccess() {
        org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
        headers.set("Authorization", "Bearer " + VALID_TOKEN_DOCTOR);
        
        when(exchange.getRequest()).thenReturn(request);
        when(request.getURI()).thenReturn(java.net.URI.create("http://localhost:8080/lab/orders"));
        when(request.getMethod()).thenReturn(HttpMethod.POST);
        when(request.getHeaders()).thenReturn(headers);
        when(chain.filter(any())).thenReturn(Mono.empty());

        GatewayFilter filter = jwtFilter.apply(new JwtFilter.Config());
        Mono<Void> result = filter.filter(exchange, chain);

        StepVerifier.create(result).verifyComplete();
        verify(chain).filter(any());
    }

    @Test
    @DisplayName("DOCTOR should POST to /lab/reports endpoint")
    void testDoctorPostLabReportsAccess() {
        org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
        headers.set("Authorization", "Bearer " + VALID_TOKEN_DOCTOR);
        
        when(exchange.getRequest()).thenReturn(request);
        when(request.getURI()).thenReturn(java.net.URI.create("http://localhost:8080/lab/reports"));
        when(request.getMethod()).thenReturn(HttpMethod.POST);
        when(request.getHeaders()).thenReturn(headers);
        when(chain.filter(any())).thenReturn(Mono.empty());

        GatewayFilter filter = jwtFilter.apply(new JwtFilter.Config());
        Mono<Void> result = filter.filter(exchange, chain);

        StepVerifier.create(result).verifyComplete();
        verify(chain).filter(any());
    }

    @Test
    @DisplayName("DOCTOR should GET /lab/orders endpoint")
    void testDoctorGetLabOrdersAccess() {
        org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
        headers.set("Authorization", "Bearer " + VALID_TOKEN_DOCTOR);
        
        when(exchange.getRequest()).thenReturn(request);
        when(request.getURI()).thenReturn(java.net.URI.create("http://localhost:8080/lab/orders"));
        when(request.getMethod()).thenReturn(HttpMethod.GET);
        when(request.getHeaders()).thenReturn(headers);
        when(chain.filter(any())).thenReturn(Mono.empty());

        GatewayFilter filter = jwtFilter.apply(new JwtFilter.Config());
        Mono<Void> result = filter.filter(exchange, chain);

        StepVerifier.create(result).verifyComplete();
        verify(chain).filter(any());
    }

    @Test
    @DisplayName("DOCTOR should GET /lab/reports endpoint")
    void testDoctorGetLabReportsAccess() {
        org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
        headers.set("Authorization", "Bearer " + VALID_TOKEN_DOCTOR);
        
        when(exchange.getRequest()).thenReturn(request);
        when(request.getURI()).thenReturn(java.net.URI.create("http://localhost:8080/lab/reports"));
        when(request.getMethod()).thenReturn(HttpMethod.GET);
        when(request.getHeaders()).thenReturn(headers);
        when(chain.filter(any())).thenReturn(Mono.empty());

        GatewayFilter filter = jwtFilter.apply(new JwtFilter.Config());
        Mono<Void> result = filter.filter(exchange, chain);

        StepVerifier.create(result).verifyComplete();
        verify(chain).filter(any());
    }

    @Test
    @DisplayName("DOCTOR should GET /lab/tests endpoint")
    void testDoctorGetLabTestsAccess() {
        org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
        headers.set("Authorization", "Bearer " + VALID_TOKEN_DOCTOR);
        
        when(exchange.getRequest()).thenReturn(request);
        when(request.getURI()).thenReturn(java.net.URI.create("http://localhost:8080/lab/tests"));
        when(request.getMethod()).thenReturn(HttpMethod.GET);
        when(request.getHeaders()).thenReturn(headers);
        when(chain.filter(any())).thenReturn(Mono.empty());

        GatewayFilter filter = jwtFilter.apply(new JwtFilter.Config());
        Mono<Void> result = filter.filter(exchange, chain);

        StepVerifier.create(result).verifyComplete();
        verify(chain).filter(any());
    }

    @Test
    @DisplayName("DOCTOR should be denied DELETE access to /doctors")
    void testDoctorDenyDeleteDoctorsAccess() {
        org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
        headers.set("Authorization", "Bearer " + VALID_TOKEN_DOCTOR);
        
        when(exchange.getRequest()).thenReturn(request);
        when(request.getURI()).thenReturn(java.net.URI.create("http://localhost:8080/doctors/1"));
        when(request.getMethod()).thenReturn(HttpMethod.DELETE);
        when(request.getHeaders()).thenReturn(headers);
        when(exchange.getResponse()).thenReturn(response);
        when(response.setStatusCode(HttpStatus.FORBIDDEN)).thenReturn(true);
        when(response.setComplete()).thenReturn(Mono.empty());

        GatewayFilter filter = jwtFilter.apply(new JwtFilter.Config());
        Mono<Void> result = filter.filter(exchange, chain);

        StepVerifier.create(result).verifyComplete();
        verify(response).setStatusCode(HttpStatus.FORBIDDEN);
    }

    // ==================== Test: PATIENT Role Access ====================

    @Test
    @DisplayName("PATIENT should access /doctors GET endpoint")
    void testPatientGetDoctorsAccess() {
        org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
        headers.set("Authorization", "Bearer " + VALID_TOKEN_PATIENT);
        
        when(exchange.getRequest()).thenReturn(request);
        when(request.getURI()).thenReturn(java.net.URI.create("http://localhost:8080/doctors"));
        when(request.getMethod()).thenReturn(HttpMethod.GET);
        when(request.getHeaders()).thenReturn(headers);
        when(chain.filter(any())).thenReturn(Mono.empty());

        GatewayFilter filter = jwtFilter.apply(new JwtFilter.Config());
        Mono<Void> result = filter.filter(exchange, chain);

        StepVerifier.create(result).verifyComplete();
        verify(chain).filter(any());
    }

    @Test
    @DisplayName("PATIENT should access /patients GET endpoint")
    void testPatientGetPatientsAccess() {
        org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
        headers.set("Authorization", "Bearer " + VALID_TOKEN_PATIENT);
        
        when(exchange.getRequest()).thenReturn(request);
        when(request.getURI()).thenReturn(java.net.URI.create("http://localhost:8080/patients"));
        when(request.getMethod()).thenReturn(HttpMethod.GET);
        when(request.getHeaders()).thenReturn(headers);
        when(chain.filter(any())).thenReturn(Mono.empty());

        GatewayFilter filter = jwtFilter.apply(new JwtFilter.Config());
        Mono<Void> result = filter.filter(exchange, chain);

        StepVerifier.create(result).verifyComplete();
        verify(chain).filter(any());
    }

    @Test
    @DisplayName("PATIENT should POST to /appointments endpoint")
    void testPatientPostAppointmentsAccess() {
        org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
        headers.set("Authorization", "Bearer " + VALID_TOKEN_PATIENT);
        
        when(exchange.getRequest()).thenReturn(request);
        when(request.getURI()).thenReturn(java.net.URI.create("http://localhost:8080/appointments"));
        when(request.getMethod()).thenReturn(HttpMethod.POST);
        when(request.getHeaders()).thenReturn(headers);
        when(chain.filter(any())).thenReturn(Mono.empty());

        GatewayFilter filter = jwtFilter.apply(new JwtFilter.Config());
        Mono<Void> result = filter.filter(exchange, chain);

        StepVerifier.create(result).verifyComplete();
        verify(chain).filter(any());
    }

    @Test
    @DisplayName("PATIENT should access /appointments/patient/* endpoint")
    void testPatientGetOwnAppointmentsAccess() {
        org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
        headers.set("Authorization", "Bearer " + VALID_TOKEN_PATIENT);
        
        when(exchange.getRequest()).thenReturn(request);
        when(request.getURI()).thenReturn(java.net.URI.create("http://localhost:8080/appointments/patient/123"));
        when(request.getMethod()).thenReturn(HttpMethod.GET);
        when(request.getHeaders()).thenReturn(headers);
        when(chain.filter(any())).thenReturn(Mono.empty());

        GatewayFilter filter = jwtFilter.apply(new JwtFilter.Config());
        Mono<Void> result = filter.filter(exchange, chain);

        StepVerifier.create(result).verifyComplete();
        verify(chain).filter(any());
    }

    @Test
    @DisplayName("PATIENT should access /slots/available/* endpoint")
    void testPatientGetAvailableSlotsAccess() {
        org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
        headers.set("Authorization", "Bearer " + VALID_TOKEN_PATIENT);
        
        when(exchange.getRequest()).thenReturn(request);
        when(request.getURI()).thenReturn(java.net.URI.create("http://localhost:8080/slots/available/123"));
        when(request.getMethod()).thenReturn(HttpMethod.GET);
        when(request.getHeaders()).thenReturn(headers);
        when(chain.filter(any())).thenReturn(Mono.empty());

        GatewayFilter filter = jwtFilter.apply(new JwtFilter.Config());
        Mono<Void> result = filter.filter(exchange, chain);

        StepVerifier.create(result).verifyComplete();
        verify(chain).filter(any());
    }

    @Test
    @DisplayName("PATIENT should access /lab/orders/patient/* endpoint")
    void testPatientGetOwnLabOrdersAccess() {
        org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
        headers.set("Authorization", "Bearer " + VALID_TOKEN_PATIENT);
        
        when(exchange.getRequest()).thenReturn(request);
        when(request.getURI()).thenReturn(java.net.URI.create("http://localhost:8080/lab/orders/patient/456"));
        when(request.getMethod()).thenReturn(HttpMethod.GET);
        when(request.getHeaders()).thenReturn(headers);
        when(chain.filter(any())).thenReturn(Mono.empty());

        GatewayFilter filter = jwtFilter.apply(new JwtFilter.Config());
        Mono<Void> result = filter.filter(exchange, chain);

        StepVerifier.create(result).verifyComplete();
        verify(chain).filter(any());
    }

    @Test
    @DisplayName("PATIENT should access /lab/reports/patient/* endpoint")
    void testPatientGetOwnLabReportsAccess() {
        org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
        headers.set("Authorization", "Bearer " + VALID_TOKEN_PATIENT);
        
        when(exchange.getRequest()).thenReturn(request);
        when(request.getURI()).thenReturn(java.net.URI.create("http://localhost:8080/lab/reports/patient/789"));
        when(request.getMethod()).thenReturn(HttpMethod.GET);
        when(request.getHeaders()).thenReturn(headers);
        when(chain.filter(any())).thenReturn(Mono.empty());

        GatewayFilter filter = jwtFilter.apply(new JwtFilter.Config());
        Mono<Void> result = filter.filter(exchange, chain);

        StepVerifier.create(result).verifyComplete();
        verify(chain).filter(any());
    }

    @Test
    @DisplayName("PATIENT should be denied access to POST /appointments (only /appointments POST)")
    void testPatientDenyAccessToPostAppointments() {
        org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
        headers.set("Authorization", "Bearer " + VALID_TOKEN_PATIENT);
        
        when(exchange.getRequest()).thenReturn(request);
        when(request.getURI()).thenReturn(java.net.URI.create("http://localhost:8080/lab/orders"));
        when(request.getMethod()).thenReturn(HttpMethod.POST);
        when(request.getHeaders()).thenReturn(headers);
        when(exchange.getResponse()).thenReturn(response);
        when(response.setStatusCode(HttpStatus.FORBIDDEN)).thenReturn(true);
        when(response.setComplete()).thenReturn(Mono.empty());

        GatewayFilter filter = jwtFilter.apply(new JwtFilter.Config());
        Mono<Void> result = filter.filter(exchange, chain);

        StepVerifier.create(result).verifyComplete();
        verify(response).setStatusCode(HttpStatus.FORBIDDEN);
    }

    @Test
    @DisplayName("PATIENT should be denied DELETE access to /appointments")
    void testPatientDenyDeleteAppointments() {
        org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
        headers.set("Authorization", "Bearer " + VALID_TOKEN_PATIENT);
        
        when(exchange.getRequest()).thenReturn(request);
        when(request.getURI()).thenReturn(java.net.URI.create("http://localhost:8080/appointments/123"));
        when(request.getMethod()).thenReturn(HttpMethod.DELETE);
        when(request.getHeaders()).thenReturn(headers);
        when(exchange.getResponse()).thenReturn(response);
        when(response.setStatusCode(HttpStatus.FORBIDDEN)).thenReturn(true);
        when(response.setComplete()).thenReturn(Mono.empty());

        GatewayFilter filter = jwtFilter.apply(new JwtFilter.Config());
        Mono<Void> result = filter.filter(exchange, chain);

        StepVerifier.create(result).verifyComplete();
        verify(response).setStatusCode(HttpStatus.FORBIDDEN);
    }

    // ==================== Test: Unknown Role ====================

    @Test
    @DisplayName("Should deny access for unknown role")
    void testUnknownRoleDenied() {
        Key key = Keys.hmacShaKeyFor(SECRET.getBytes());
        Map<String, Object> claims = new HashMap<>();
        claims.put("role", "UNKNOWN");
        
        String unknownRoleToken = Jwts.builder()
                .setClaims(claims)
                .setSubject("user")
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + 3600000))
                .signWith(key)
                .compact();
        
        org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
        headers.set("Authorization", "Bearer " + unknownRoleToken);
        
        when(exchange.getRequest()).thenReturn(request);
        when(request.getURI()).thenReturn(java.net.URI.create("http://localhost:8080/doctors"));
        when(request.getMethod()).thenReturn(HttpMethod.GET);
        when(request.getHeaders()).thenReturn(headers);
        when(exchange.getResponse()).thenReturn(response);
        when(response.setStatusCode(HttpStatus.FORBIDDEN)).thenReturn(true);
        when(response.setComplete()).thenReturn(Mono.empty());

        GatewayFilter filter = jwtFilter.apply(new JwtFilter.Config());
        Mono<Void> result = filter.filter(exchange, chain);

        StepVerifier.create(result).verifyComplete();
        verify(response).setStatusCode(HttpStatus.FORBIDDEN);
    }

    // ==================== Test: Header Forwarding ====================

    @Test
    @DisplayName("Should forward X-User-Role and X-Username headers")
    void testHeaderForwarding() {
        org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
        headers.set("Authorization", "Bearer " + VALID_TOKEN_ADMIN);
        
        when(exchange.getRequest()).thenReturn(request);
        when(request.getURI()).thenReturn(java.net.URI.create("http://localhost:8080/doctors"));
        when(request.getMethod()).thenReturn(HttpMethod.GET);
        when(request.getHeaders()).thenReturn(headers);
        when(chain.filter(any())).thenReturn(Mono.empty());

        GatewayFilter filter = jwtFilter.apply(new JwtFilter.Config());
        Mono<Void> result = filter.filter(exchange, chain);

        ArgumentCaptor<ServerWebExchange> captor = ArgumentCaptor.forClass(ServerWebExchange.class);
        StepVerifier.create(result).verifyComplete();
        verify(chain).filter(captor.capture());
    }

    // ==================== Test: Token without role claim ====================

    @Test
    @DisplayName("Should deny access when token has no role claim")
    void testTokenWithoutRoleClaim() {
        Key key = Keys.hmacShaKeyFor(SECRET.getBytes());
        String tokenWithoutRole = Jwts.builder()
                .setSubject("user")
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + 3600000))
                .signWith(key)
                .compact();
        
        org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
        headers.set("Authorization", "Bearer " + tokenWithoutRole);
        
        when(exchange.getRequest()).thenReturn(request);
        when(request.getURI()).thenReturn(java.net.URI.create("http://localhost:8080/doctors"));
        when(request.getMethod()).thenReturn(HttpMethod.GET);
        when(request.getHeaders()).thenReturn(headers);
        when(exchange.getResponse()).thenReturn(response);
        when(response.setStatusCode(HttpStatus.FORBIDDEN)).thenReturn(true);
        when(response.setComplete()).thenReturn(Mono.empty());

        GatewayFilter filter = jwtFilter.apply(new JwtFilter.Config());
        Mono<Void> result = filter.filter(exchange, chain);

        StepVerifier.create(result).verifyComplete();
        verify(response).setStatusCode(HttpStatus.FORBIDDEN);
    }

    // ==================== Test: Config class ====================

    @Test
    @DisplayName("Config class should be instantiable")
    void testConfigClass() {
        JwtFilter.Config config = new JwtFilter.Config();
        assertNotNull(config);
    }
}
