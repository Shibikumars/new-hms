package com.hms.auth;

import com.hms.auth.dto.AuthResponse;
import com.hms.auth.dto.RegisterRequest;
import com.hms.auth.entity.User;
import com.hms.auth.repository.UserRepository;
import com.hms.auth.security.JwtUtil;
import com.hms.auth.service.AuthService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@DisplayName("Auth Service Integration Tests")
class AuthServiceIntegrationTest {

    @Autowired
    private AuthService authService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JwtUtil jwtUtil;

    private BCryptPasswordEncoder encoder;

    @BeforeEach
    void setUp() {
        encoder = new BCryptPasswordEncoder();
        userRepository.deleteAll();
    }

    @Test
    @DisplayName("Should register and login user successfully")
    void testRegisterAndLoginUser() {
        // Register
        RegisterRequest newUser = new RegisterRequest();
        newUser.setUsername("integrationtest");
        newUser.setPassword("password123");
        newUser.setRole("PATIENT");

        authService.register(newUser);

        // Login
        AuthResponse auth = authService.login("integrationtest", "password123");
        assertNotNull(auth);
        assertNotNull(auth.getToken());
        assertFalse(auth.getToken().isEmpty());
    }

    @Test
    @DisplayName("Should not login with wrong password")
    void testLoginWithWrongPassword() {
        RegisterRequest newUser = new RegisterRequest();
        newUser.setUsername("wrongpasstest");
        newUser.setPassword("correctpass123");
        newUser.setRole("PATIENT");

        authService.register(newUser);

        assertThrows(RuntimeException.class, () ->
            authService.login("wrongpasstest", "incorrectpass")
        );
    }

    @Test
    @DisplayName("Should generate valid JWT token")
    void testGeneratesValidJWTToken() {
        RegisterRequest newUser = new RegisterRequest();
        newUser.setUsername("jwttest");
        newUser.setPassword("password123");
        newUser.setRole("DOCTOR");

        authService.register(newUser);
        AuthResponse auth = authService.login("jwttest", "password123");

        String username = jwtUtil.extractUsername(auth.getToken());
        String role = jwtUtil.extractRole(auth.getToken());

        assertEquals("jwttest", username);
        assertEquals("DOCTOR", role);
    }

    @Test
    @DisplayName("Should handle multiple user registrations")
    void testMultipleUserRegistrations() {
        RegisterRequest user1 = new RegisterRequest();
        user1.setUsername("user1");
        user1.setPassword("password1");
        user1.setRole("ADMIN");

        RegisterRequest user2 = new RegisterRequest();
        user2.setUsername("user2");
        user2.setPassword("password2");
        user2.setRole("DOCTOR");

        authService.register(user1);
        authService.register(user2);

        AuthResponse auth1 = authService.login("user1", "password1");
        AuthResponse auth2 = authService.login("user2", "password2");

        assertNotEquals(auth1.getToken(), auth2.getToken());
    }

    @Test
    @DisplayName("Should preserve user role in token")
    void testPreserveUserRoleInToken() {
        RegisterRequest user = new RegisterRequest();
        user.setUsername("roletest");
        user.setPassword("password123");
        user.setRole("PATIENT");

        authService.register(user);
        AuthResponse auth = authService.login("roletest", "password123");

        String extractedRole = jwtUtil.extractRole(auth.getToken());
        assertEquals("PATIENT", extractedRole);
    }

    @Test
    @DisplayName("Should handle case-sensitive usernames")
    void testCaseSensitiveUsername() {
        RegisterRequest user = new RegisterRequest();
        user.setUsername("CaseTest");
        user.setPassword("password123");
        user.setRole("PATIENT");

        authService.register(user);

        assertDoesNotThrow(() -> authService.login("CaseTest", "password123"));
        assertThrows(RuntimeException.class, () -> authService.login("casetest", "password123"));
    }

    @Test
    @DisplayName("Should find registered user in repository")
    void testFindUserInRepository() {
        RegisterRequest user = new RegisterRequest();
        user.setUsername("repotest");
        user.setPassword("password123");
        user.setRole("PATIENT");

        authService.register(user);

        assertTrue(userRepository.findByUsername("repotest").isPresent());
    }

    @Test
    @DisplayName("Should encode password on registration")
    void testPasswordEncodingOnRegistration() {
        String plainPassword = "plainPassword123";
        RegisterRequest user = new RegisterRequest();
        user.setUsername("encodingtest");
        user.setPassword(plainPassword);
        user.setRole("PATIENT");

        authService.register(user);

        User savedUser = userRepository.findByUsername("encodingtest").get();
        assertNotEquals(plainPassword, savedUser.getPassword());
        assertTrue(encoder.matches(plainPassword, savedUser.getPassword()));
    }

    @Test
    @DisplayName("Should handle user with admin role throughout lifecycle")
    void testAdminUserLifecycle() {
        RegisterRequest adminUser = new RegisterRequest();
        adminUser.setUsername("admin");
        adminUser.setPassword("adminpass123");
        adminUser.setRole("ADMIN");

        authService.register(adminUser);

        AuthResponse auth = authService.login("admin", "adminpass123");
        assertEquals("ADMIN", jwtUtil.extractRole(auth.getToken()));
    }

    @Test
    @DisplayName("Should extract correct username from token")
    void testExtractUsernameFromToken() {
        RegisterRequest user = new RegisterRequest();
        user.setUsername("extracttest");
        user.setPassword("password123");
        user.setRole("PATIENT");

        authService.register(user);
        AuthResponse auth = authService.login("extracttest", "password123");

        String extractedUsername = jwtUtil.extractUsername(auth.getToken());
        assertEquals("extracttest", extractedUsername);
    }

    @Test
    @DisplayName("Should not find non-existent user")
    void testNonExistentUserNotFound() {
        assertFalse(userRepository.findByUsername("nonexistent").isPresent());
    }
}