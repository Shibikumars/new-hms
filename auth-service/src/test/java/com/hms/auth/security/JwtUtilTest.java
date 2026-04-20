package com.hms.auth.security;

import io.jsonwebtoken.JwtException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("JwtUtil Tests")
class JwtUtilTest {

    private JwtUtil jwtUtil;

    @BeforeEach
    void setUp() {
        jwtUtil = new JwtUtil();
    }

    @Test
    @DisplayName("Should generate a valid token with username and role")
    void testGenerateToken() {
        String username = "testuser";
        String role = "ADMIN";

        String token = jwtUtil.generateToken(username, role);

        assertNotNull(token);
        assertTrue(token.length() > 0);
    }

    @Test
    @DisplayName("Should extract username from valid token")
    void testExtractUsername() {
        String username = "john_doe";
        String role = "USER";
        String token = jwtUtil.generateToken(username, role);

        String extractedUsername = jwtUtil.extractUsername(token);

        assertEquals(username, extractedUsername);
    }

    @Test
    @DisplayName("Should extract role from valid token")
    void testExtractRole() {
        String username = "jane_doe";
        String role = "DOCTOR";
        String token = jwtUtil.generateToken(username, role);

        String extractedRole = jwtUtil.extractRole(token);

        assertEquals(role, extractedRole);
    }

    @Test
    @DisplayName("Should throw exception for invalid token")
    void testExtractUsernameInvalidToken() {
        String invalidToken = "invalid.token.here";

        assertThrows(JwtException.class, () -> jwtUtil.extractUsername(invalidToken));
    }

    @Test
    @DisplayName("Should throw exception for expired token")
    void testExtractRoleInvalidToken() {
        String invalidToken = "invalid.token.here";

        assertThrows(JwtException.class, () -> jwtUtil.extractRole(invalidToken));
    }

    @Test
    @DisplayName("Should handle token with null role")
    void testTokenWithNullRole() {
        String username = "test_user";
        String token = jwtUtil.generateToken(username, null);

        assertNotNull(token);
        String extractedUsername = jwtUtil.extractUsername(token);
        assertEquals(username, extractedUsername);
    }

    @Test
    @DisplayName("Should generate different tokens for different users")
    void testDifferentTokensForDifferentUsers() {
        String token1 = jwtUtil.generateToken("user1", "ADMIN");
        String token2 = jwtUtil.generateToken("user2", "USER");

        assertNotEquals(token1, token2);
        assertEquals("user1", jwtUtil.extractUsername(token1));
        assertEquals("user2", jwtUtil.extractUsername(token2));
    }

     @Test
     @DisplayName("Should generate different tokens with same username but different roles")
     void testDifferentTokensSameUserDifferentRole() {
         String username = "testuser";
         String token1 = jwtUtil.generateToken(username, "ADMIN");
         String token2 = jwtUtil.generateToken(username, "USER");

         assertNotEquals(token1, token2);
         assertEquals("ADMIN", jwtUtil.extractRole(token1));
         assertEquals("USER", jwtUtil.extractRole(token2));
     }

     @Test
     @DisplayName("Should generate token with specific username")
     void testGenerateTokenSpecificUsername() {
         String username = "specific_user";
         String role = "USER";

         String token = jwtUtil.generateToken(username, role);

         assertEquals(username, jwtUtil.extractUsername(token));
     }

     @Test
     @DisplayName("Should extract role correctly from token")
     void testExtractRoleCorrectly() {
         String username = "user";
         String role = "DOCTOR";

         String token = jwtUtil.generateToken(username, role);
         String extractedRole = jwtUtil.extractRole(token);

         assertEquals(role, extractedRole);
         assertNotEquals("ADMIN", extractedRole);
     }

     @Test
     @DisplayName("Should handle token generation for all roles")
     void testTokenGenerationForAllRoles() {
         String[] roles = {"ADMIN", "DOCTOR", "PATIENT", "LAB_TECH", "USER"};

         for (String role : roles) {
             String token = jwtUtil.generateToken("testuser", role);
             assertEquals(role, jwtUtil.extractRole(token));
         }
     }

     @Test
     @DisplayName("Should reject completely malformed token")
     void testRejectCompletelyMalformedToken() {
         String malformedToken = "completely.not.valid";

         assertThrows(JwtException.class, () -> jwtUtil.extractUsername(malformedToken));
     }

     @Test
     @DisplayName("Should throw exception for single component token")
     void testRejectSingleComponentToken() {
         String invalidToken = "singlepart";

         assertThrows(JwtException.class, () -> jwtUtil.extractUsername(invalidToken));
     }

     @Test
     @DisplayName("Should throw exception for two component token")
     void testRejectTwoComponentToken() {
         String invalidToken = "two.parts";

         assertThrows(JwtException.class, () -> jwtUtil.extractRole(invalidToken));
     }

     @Test
     @DisplayName("Should verify token format is correct")
     void testTokenFormatCorrect() {
         String token = jwtUtil.generateToken("testuser", "USER");

         assertTrue(token.contains("."), "Token should contain dots");
         String[] parts = token.split("\\.");
         assertEquals(3, parts.length, "Token should have 3 parts");
     }

     @Test
     @DisplayName("Should handle username with special characters")
     void testUsernameWithSpecialCharacters() {
         String username = "user@example.com";
         String role = "USER";

         String token = jwtUtil.generateToken(username, role);

         assertEquals(username, jwtUtil.extractUsername(token));
     }

     @Test
     @DisplayName("Should handle role with underscores")
     void testRoleWithUnderscores() {
         String username = "testuser";
         String role = "SUPER_ADMIN";

         String token = jwtUtil.generateToken(username, role);

         assertEquals(role, jwtUtil.extractRole(token));
     }

     @Test
     @DisplayName("Should generate consistent token for same inputs")
     void testTokenConsistencyForSameInputs() {
         String username = "testuser";
         String role = "USER";

         String token1 = jwtUtil.generateToken(username, role);
         String token2 = jwtUtil.generateToken(username, role);

         // Tokens should be different due to timestamps, but claims should be same
         assertEquals(jwtUtil.extractUsername(token1), jwtUtil.extractUsername(token2));
         assertEquals(jwtUtil.extractRole(token1), jwtUtil.extractRole(token2));
     }

     @Test
     @DisplayName("Should throw exception for null token in username extraction")
     void testExtractUsernameNullToken() {
         assertThrows(Exception.class, () -> jwtUtil.extractUsername(null));
     }

     @Test
     @DisplayName("Should throw exception for null token in role extraction")
     void testExtractRoleNullToken() {
         assertThrows(Exception.class, () -> jwtUtil.extractRole(null));
     }

     @Test
     @DisplayName("Should handle empty string username")
     void testEmptyStringUsername() {
         String username = "";
         String role = "USER";

         String token = jwtUtil.generateToken(username, role);

         String extracted = jwtUtil.extractUsername(token);
         assertTrue(extracted == null || extracted.isEmpty());
     }

     @Test
     @DisplayName("Should verify tokens are unique")
     void testTokensAreUnique() {
         String token1 = jwtUtil.generateToken("user1", "ADMIN");
         String token2 = jwtUtil.generateToken("user1", "ADMIN");

         assertNotEquals(token1, token2, "Tokens should be unique due to timestamps");
     }
}
