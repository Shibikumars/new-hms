package com.hms.auth.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hms.auth.dto.AuthRequest;
import com.hms.auth.dto.AuthResponse;
import com.hms.auth.dto.RegisterRequest;
import com.hms.auth.dto.UserResponse;
import com.hms.auth.exception.InvalidCredentialsException;
import com.hms.auth.security.JwtUtil;
import com.hms.auth.service.AuthService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@TestPropertySource(locations = "classpath:application-test.yml")
@DisplayName("AuthController Tests")
@SuppressWarnings("null")
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private AuthService authService;

    @MockBean
    private JwtUtil jwtUtil;

    @Autowired
    private ObjectMapper objectMapper;

    private RegisterRequest testRequest;
    private UserResponse testResponse;
    private AuthRequest loginRequest;

    @BeforeEach
    void setUp() {
        testRequest = new RegisterRequest();
        testRequest.setUsername("testuser");
        testRequest.setPassword("password123");
        testRequest.setRole("PATIENT");

        testResponse = new UserResponse(1L, "testuser", "PATIENT");

        loginRequest = new AuthRequest();
        loginRequest.setUsername("testuser");
        loginRequest.setPassword("password123");
    }

    @Test
    @DisplayName("Should register user successfully")
    void testRegister() throws Exception {
        when(authService.register(any(RegisterRequest.class), any())).thenReturn(testResponse);

        mockMvc.perform(post("/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(testRequest)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.username").value("testuser"));

        verify(authService, times(1)).register(any(RegisterRequest.class), any());
    }

    @Test
    @DisplayName("Should login successfully with valid credentials")
    void testLoginSuccess() throws Exception {
        String token = "jwt.token.here";
        AuthResponse response = new AuthResponse(token, "refresh.token", "PATIENT", 36000L, false);

        when(authService.login("testuser", "password123"))
            .thenReturn(response);

        mockMvc.perform(post("/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value(token));

        verify(authService, times(1)).login("testuser", "password123");
    }

    @Test
    @DisplayName("Should return 401 when login fails")
    void testLoginFailure() throws Exception {
        when(authService.login("testuser", "wrongpassword"))
            .thenThrow(new InvalidCredentialsException());

        AuthRequest wrongLogin = new AuthRequest();
        wrongLogin.setUsername("testuser");
        wrongLogin.setPassword("wrongpassword");

        mockMvc.perform(post("/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(wrongLogin)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Invalid username or password"));
    }

    @Test
    @DisplayName("Should validate token successfully")
    void testValidateTokenSuccess() throws Exception {
        String token = "jwt.token.here";
        String username = "testuser";
        String role = "USER";

        when(jwtUtil.extractUsername(token)).thenReturn(username);
        when(jwtUtil.extractRole(token)).thenReturn(role);

        mockMvc.perform(get("/auth/validate")
                .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value(username))
                .andExpect(jsonPath("$.role").value(role))
                .andExpect(jsonPath("$.status").value("valid"));

        verify(jwtUtil, times(1)).extractUsername(token);
        verify(jwtUtil, times(1)).extractRole(token);
    }

    @Test
    @DisplayName("Should return 401 when Authorization header is missing")
    void testValidateTokenMissingHeader() throws Exception {
        mockMvc.perform(get("/auth/validate"))
                .andExpect(status().isUnauthorized())
                .andExpect(content().string("Missing or invalid Authorization header"));
    }

    @Test
    @DisplayName("Should return 401 when Authorization header format is invalid")
    void testValidateTokenInvalidHeaderFormat() throws Exception {
        mockMvc.perform(get("/auth/validate")
                .header("Authorization", "InvalidFormat token"))
                .andExpect(status().isUnauthorized())
                .andExpect(content().string("Missing or invalid Authorization header"));
    }

    @Test
    @DisplayName("Should return 401 when token is invalid")
    void testValidateTokenInvalid() throws Exception {
        String invalidToken = "invalid.token";

        when(jwtUtil.extractUsername(invalidToken))
            .thenThrow(new RuntimeException("Invalid token"));

        mockMvc.perform(get("/auth/validate")
                .header("Authorization", "Bearer " + invalidToken))
                .andExpect(status().isUnauthorized())
                .andExpect(content().string("Invalid or expired token"));
    }

    @Test
    @DisplayName("Should return 401 when token is expired")
    void testValidateTokenExpired() throws Exception {
        String expiredToken = "expired.token";

        when(jwtUtil.extractUsername(expiredToken))
            .thenThrow(new RuntimeException("Token expired"));

        mockMvc.perform(get("/auth/validate")
                .header("Authorization", "Bearer " + expiredToken))
                .andExpect(status().isUnauthorized())
                .andExpect(content().string("Invalid or expired token"));
    }

    @Test
    @DisplayName("Should extract role correctly during validation")
    void testValidateTokenExtractsRole() throws Exception {
        String token = "admin.token";
        String username = "admin_user";
        String role = "ADMIN";

        when(jwtUtil.extractUsername(token)).thenReturn(username);
        when(jwtUtil.extractRole(token)).thenReturn(role);

        mockMvc.perform(get("/auth/validate")
                .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.role").value("ADMIN"));
    }

     @Test
     @DisplayName("Should handle null authorization header")
     void testValidateNullAuthHeader() throws Exception {
         mockMvc.perform(get("/auth/validate")
                 .header("X-Test", "1"))
                 .andExpect(status().isUnauthorized());
     }

     @Test
     @DisplayName("Should register user with different roles")
     void testRegisterUserWithDifferentRoles() throws Exception {
         RegisterRequest adminRequest = new RegisterRequest();
         adminRequest.setUsername("admin");
         adminRequest.setPassword("adminpass123");
         adminRequest.setRole("ADMIN");

         UserResponse adminResponse = new UserResponse(2L, "admin", "ADMIN");

         when(authService.register(any(RegisterRequest.class), any())).thenReturn(adminResponse);

         mockMvc.perform(post("/auth/register")
                 .contentType(MediaType.APPLICATION_JSON)
                 .content(objectMapper.writeValueAsString(adminRequest)))
                 .andExpect(status().isCreated())
                 .andExpect(jsonPath("$.username").value("admin"))
                 .andExpect(jsonPath("$.role").value("ADMIN"));

         verify(authService, times(1)).register(any(RegisterRequest.class), any());
     }

     @Test
     @DisplayName("Should handle login with multiple failed attempts")
     void testLoginMultipleFailures() throws Exception {
        when(authService.login(anyString(), anyString()))
             .thenThrow(new InvalidCredentialsException());

         for (int i = 0; i < 3; i++) {
             mockMvc.perform(post("/auth/login")
                     .contentType(MediaType.APPLICATION_JSON)
                     .content(objectMapper.writeValueAsString(loginRequest)))
                     .andExpect(status().isUnauthorized());
         }

         verify(authService, times(3)).login(anyString(), anyString());
     }

     @Test
     @DisplayName("Should register user and return full object")
     void testRegisterReturnsFullObject() throws Exception {
         RegisterRequest fullRequest = new RegisterRequest();
         fullRequest.setUsername("fulluser");
         fullRequest.setPassword("pass1234567");
         fullRequest.setRole("PATIENT");

         UserResponse fullResponse = new UserResponse(5L, "fulluser", "PATIENT");

         when(authService.register(any(RegisterRequest.class), any())).thenReturn(fullResponse);

         mockMvc.perform(post("/auth/register")
                 .contentType(MediaType.APPLICATION_JSON)
                 .content(objectMapper.writeValueAsString(fullRequest)))
                 .andExpect(status().isCreated())
                 .andExpect(jsonPath("$.id").value(5))
                 .andExpect(jsonPath("$.username").value("fulluser"))
                 .andExpect(jsonPath("$.role").value("PATIENT"));
     }

     @Test
     @DisplayName("Should return correct HTTP status for successful login")
     void testLoginHttpStatus() throws Exception {
         AuthResponse response = new AuthResponse("jwt.token.here", "refresh.token", "PATIENT", 36000L, false);
         when(authService.login("testuser", "password123")).thenReturn(response);

         mockMvc.perform(post("/auth/login")
                 .contentType(MediaType.APPLICATION_JSON)
                 .content(objectMapper.writeValueAsString(loginRequest)))
                 .andExpect(status().isOk());
     }

     @Test
     @DisplayName("Should return correct HTTP status for failed login")
     void testLoginHttpStatusUnauthorized() throws Exception {
         when(authService.login(anyString(), anyString()))
             .thenThrow(new InvalidCredentialsException());

         mockMvc.perform(post("/auth/login")
                 .contentType(MediaType.APPLICATION_JSON)
                 .content(objectMapper.writeValueAsString(loginRequest)))
                 .andExpect(status().isUnauthorized())
                 .andExpect(jsonPath("$.message").value("Invalid username or password"));
     }

     @Test
     @DisplayName("Should validate token returns username as string")
     void testValidateTokenReturnsUsernameType() throws Exception {
         String token = "jwt.token.here";
         String username = "testuser";
         String role = "USER";

         when(jwtUtil.extractUsername(token)).thenReturn(username);
         when(jwtUtil.extractRole(token)).thenReturn(role);

         mockMvc.perform(get("/auth/validate")
                 .header("Authorization", "Bearer " + token))
                 .andExpect(status().isOk())
                 .andExpect(jsonPath("$.username").isString());
     }

     @Test
     @DisplayName("Should handle token with null role claim")
     void testValidateTokenWithNullRole() throws Exception {
         String token = "token.with.null.role";

         when(jwtUtil.extractUsername(token)).thenReturn("testuser");
         when(jwtUtil.extractRole(token)).thenReturn(null);

         mockMvc.perform(get("/auth/validate")
                 .header("Authorization", "Bearer " + token))
                 .andExpect(status().isOk())
                 .andExpect(jsonPath("$.role").doesNotExist());
     }
}