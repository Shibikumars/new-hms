package com.hms.auth;

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
        User newUser = new User();
        newUser.setUsername("integrationtest");
        newUser.setPassword("password123");
        newUser.setRole("USER");

        User registeredUser = authService.register(newUser);
        assertNotNull(registeredUser.getId());

        // Login
        String token = authService.login("integrationtest", "password123");
        assertNotNull(token);
        assertFalse(token.isEmpty());
    }

    @Test
    @DisplayName("Should not login with wrong password")
    void testLoginWithWrongPassword() {
        User newUser = new User();
        newUser.setUsername("wrongpasstest");
        newUser.setPassword("correctpass");
        newUser.setRole("USER");

        authService.register(newUser);

        assertThrows(RuntimeException.class, () ->
            authService.login("wrongpasstest", "incorrectpass")
        );
    }

    @Test
    @DisplayName("Should generate valid JWT token")
    void testGeneratesValidJWTToken() {
        User newUser = new User();
        newUser.setUsername("jwttest");
        newUser.setPassword("password123");
        newUser.setRole("DOCTOR");

        authService.register(newUser);
        String token = authService.login("jwttest", "password123");

        String username = jwtUtil.extractUsername(token);
        String role = jwtUtil.extractRole(token);

        assertEquals("jwttest", username);
        assertEquals("DOCTOR", role);
    }

    @Test
    @DisplayName("Should handle multiple user registrations")
    void testMultipleUserRegistrations() {
        User user1 = new User();
        user1.setUsername("user1");
        user1.setPassword("pass1");
        user1.setRole("ADMIN");

        User user2 = new User();
        user2.setUsername("user2");
        user2.setPassword("pass2");
        user2.setRole("DOCTOR");

        authService.register(user1);
        authService.register(user2);

        String token1 = authService.login("user1", "pass1");
        String token2 = authService.login("user2", "pass2");

        assertNotEquals(token1, token2);
    }

    @Test
    @DisplayName("Should preserve user role in token")
    void testPreserveUserRoleInToken() {
        User user = new User();
        user.setUsername("roletest");
        user.setPassword("password");
        user.setRole("PATIENT");

        authService.register(user);
        String token = authService.login("roletest", "password");

        String extractedRole = jwtUtil.extractRole(token);
        assertEquals("PATIENT", extractedRole);
    }

    @Test
    @DisplayName("Should handle case-sensitive usernames")
    void testCaseSensitiveUsername() {
        User user = new User();
        user.setUsername("CaseTest");
        user.setPassword("password");
        user.setRole("USER");

        authService.register(user);

        assertDoesNotThrow(() -> authService.login("CaseTest", "password"));
        assertThrows(RuntimeException.class, () -> authService.login("casetest", "password"));
    }

    @Test
    @DisplayName("Should find registered user in repository")
    void testFindUserInRepository() {
        User user = new User();
        user.setUsername("repotest");
        user.setPassword("password");
        user.setRole("USER");

        authService.register(user);

        assertTrue(userRepository.findByUsername("repotest").isPresent());
    }

    @Test
    @DisplayName("Should encode password on registration")
    void testPasswordEncodingOnRegistration() {
        String plainPassword = "plainPassword123";
        User user = new User();
        user.setUsername("encodingtest");
        user.setPassword(plainPassword);
        user.setRole("USER");

        authService.register(user);

        User savedUser = userRepository.findByUsername("encodingtest").get();
        assertNotEquals(plainPassword, savedUser.getPassword());
        assertTrue(encoder.matches(plainPassword, savedUser.getPassword()));
    }

    @Test
    @DisplayName("Should handle user with admin role throughout lifecycle")
    void testAdminUserLifecycle() {
        User adminUser = new User();
        adminUser.setUsername("admin");
        adminUser.setPassword("adminpass");
        adminUser.setRole("ADMIN");

        User registered = authService.register(adminUser);
        assertEquals("ADMIN", registered.getRole());

        String token = authService.login("admin", "adminpass");
        assertEquals("ADMIN", jwtUtil.extractRole(token));
    }

    @Test
    @DisplayName("Should extract correct username from token")
    void testExtractUsernameFromToken() {
        User user = new User();
        user.setUsername("extracttest");
        user.setPassword("password");
        user.setRole("USER");

        authService.register(user);
        String token = authService.login("extracttest", "password");

        String extractedUsername = jwtUtil.extractUsername(token);
        assertEquals("extracttest", extractedUsername);
    }

    @Test
    @DisplayName("Should not find non-existent user")
    void testNonExistentUserNotFound() {
        assertFalse(userRepository.findByUsername("nonexistent").isPresent());
    }
}
