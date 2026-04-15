package com.hms.auth.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hms.auth.entity.User;
import com.hms.auth.security.JwtUtil;
import com.hms.auth.service.AuthService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@DisplayName("AuthController Tests")
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private AuthService authService;

    @MockBean
    private JwtUtil jwtUtil;

    @Autowired
    private ObjectMapper objectMapper;

    private User testUser;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId(1L);
        testUser.setUsername("testuser");
        testUser.setPassword("password123");
        testUser.setRole("USER");
    }

    @Test
    @DisplayName("Should register user successfully")
    void testRegister() throws Exception {
        when(authService.register(any(User.class))).thenReturn(testUser);

        mockMvc.perform(post("/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(testUser)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value("testuser"));

        verify(authService, times(1)).register(any(User.class));
    }

    @Test
    @DisplayName("Should login successfully with valid credentials")
    void testLoginSuccess() throws Exception {
        String token = "jwt.token.here";
        when(authService.login("testuser", "password123"))
            .thenReturn(token);

        mockMvc.perform(post("/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(testUser)))
                .andExpect(status().isOk())
                .andExpect(content().string(token));

        verify(authService, times(1)).login("testuser", "password123");
    }

    @Test
    @DisplayName("Should return 401 when login fails")
    void testLoginFailure() throws Exception {
        when(authService.login("testuser", "wrongpassword"))
            .thenThrow(new RuntimeException("Invalid credentials"));

        mockMvc.perform(post("/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(testUser)))
                .andExpect(status().isUnauthorized())
                .andExpect(content().string("Invalid credentials"));
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
                 .header("Authorization", (String) null))
                 .andExpect(status().isUnauthorized());
     }

     @Test
     @DisplayName("Should register user with different roles")
     void testRegisterUserWithDifferentRoles() throws Exception {
         User adminUser = new User();
         adminUser.setId(2L);
         adminUser.setUsername("admin");
         adminUser.setPassword("adminpass");
         adminUser.setRole("ADMIN");

         when(authService.register(any(User.class))).thenReturn(adminUser);

         mockMvc.perform(post("/auth/register")
                 .contentType(MediaType.APPLICATION_JSON)
                 .content(objectMapper.writeValueAsString(adminUser)))
                 .andExpect(status().isOk())
                 .andExpect(jsonPath("$.username").value("admin"))
                 .andExpect(jsonPath("$.role").value("ADMIN"));

         verify(authService, times(1)).register(any(User.class));
     }

     @Test
     @DisplayName("Should handle login with multiple failed attempts")
     void testLoginMultipleFailures() throws Exception {
         when(authService.login(anyString(), anyString()))
             .thenThrow(new RuntimeException("Invalid credentials"));

         for (int i = 0; i < 3; i++) {
             mockMvc.perform(post("/auth/login")
                     .contentType(MediaType.APPLICATION_JSON)
                     .content(objectMapper.writeValueAsString(testUser)))
                     .andExpect(status().isUnauthorized());
         }

         verify(authService, times(3)).login(anyString(), anyString());
     }

     @Test
     @DisplayName("Should validate token with admin role")
     void testValidateTokenAdminRole() throws Exception {
         String token = "admin.token";
         String username = "admin";
         String role = "ADMIN";

         when(jwtUtil.extractUsername(token)).thenReturn(username);
         when(jwtUtil.extractRole(token)).thenReturn(role);

         mockMvc.perform(get("/auth/validate")
                 .header("Authorization", "Bearer " + token))
                 .andExpect(status().isOk())
                 .andExpect(jsonPath("$.username").value("admin"))
                 .andExpect(jsonPath("$.role").value("ADMIN"))
                 .andExpect(jsonPath("$.status").value("valid"));
     }

     @Test
     @DisplayName("Should validate token with doctor role")
     void testValidateTokenDoctorRole() throws Exception {
         String token = "doctor.token";
         String username = "doctor_user";
         String role = "DOCTOR";

         when(jwtUtil.extractUsername(token)).thenReturn(username);
         when(jwtUtil.extractRole(token)).thenReturn(role);

         mockMvc.perform(get("/auth/validate")
                 .header("Authorization", "Bearer " + token))
                 .andExpect(status().isOk())
                 .andExpect(jsonPath("$.role").value("DOCTOR"));
     }

     @Test
     @DisplayName("Should validate token with patient role")
     void testValidateTokenPatientRole() throws Exception {
         String token = "patient.token";
         String username = "patient_user";
         String role = "PATIENT";

         when(jwtUtil.extractUsername(token)).thenReturn(username);
         when(jwtUtil.extractRole(token)).thenReturn(role);

         mockMvc.perform(get("/auth/validate")
                 .header("Authorization", "Bearer " + token))
                 .andExpect(status().isOk())
                 .andExpect(jsonPath("$.role").value("PATIENT"));
     }

     @Test
     @DisplayName("Should handle authorization header with only Bearer")
     void testValidateOnlyBearerPrefix() throws Exception {
         mockMvc.perform(get("/auth/validate")
                 .header("Authorization", "Bearer "))
                 .andExpect(status().isUnauthorized())
                 .andExpect(content().string("Invalid or expired token"));
     }

     @Test
     @DisplayName("Should register user and return full object")
     void testRegisterReturnsFullObject() throws Exception {
         User fullUser = new User();
         fullUser.setId(5L);
         fullUser.setUsername("fulluser");
         fullUser.setPassword("encoded123");
         fullUser.setRole("USER");

         when(authService.register(any(User.class))).thenReturn(fullUser);

         mockMvc.perform(post("/auth/register")
                 .contentType(MediaType.APPLICATION_JSON)
                 .content(objectMapper.writeValueAsString(fullUser)))
                 .andExpect(status().isOk())
                 .andExpect(jsonPath("$.id").value(5))
                 .andExpect(jsonPath("$.username").value("fulluser"))
                 .andExpect(jsonPath("$.password").value("encoded123"))
                 .andExpect(jsonPath("$.role").value("USER"));
     }

     @Test
     @DisplayName("Should return correct HTTP status for successful login")
     void testLoginHttpStatus() throws Exception {
         String token = "jwt.token.here";
         when(authService.login("testuser", "password123")).thenReturn(token);

         mockMvc.perform(post("/auth/login")
                 .contentType(MediaType.APPLICATION_JSON)
                 .content(objectMapper.writeValueAsString(testUser)))
                 .andExpect(status().isOk());
     }

     @Test
     @DisplayName("Should return correct HTTP status for failed login")
     void testLoginHttpStatusUnauthorized() throws Exception {
         when(authService.login(anyString(), anyString()))
             .thenThrow(new RuntimeException("Invalid credentials"));

         mockMvc.perform(post("/auth/login")
                 .contentType(MediaType.APPLICATION_JSON)
                 .content(objectMapper.writeValueAsString(testUser)))
                 .andExpect(status().isUnauthorized());
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
