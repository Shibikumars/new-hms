package com.hms.auth.entity;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("User Entity Tests")
class UserTest {

    private User user;

    @BeforeEach
    void setUp() {
        user = new User();
    }

    @Test
    @DisplayName("Should set and get id")
    void testSetAndGetId() {
        Long id = 1L;
        user.setId(id);

        assertEquals(id, user.getId());
    }

    @Test
    @DisplayName("Should set and get username")
    void testSetAndGetUsername() {
        String username = "testuser";
        user.setUsername(username);

        assertEquals(username, user.getUsername());
    }

    @Test
    @DisplayName("Should set and get password")
    void testSetAndGetPassword() {
        String password = "password123";
        user.setPassword(password);

        assertEquals(password, user.getPassword());
    }

    @Test
    @DisplayName("Should set and get role")
    void testSetAndGetRole() {
        String role = "ADMIN";
        user.setRole(role);

        assertEquals(role, user.getRole());
    }

    @Test
    @DisplayName("Should initialize with all fields")
    void testInitializeAllFields() {
        Long id = 2L;
        String username = "john_doe";
        String password = "securepass";
        String role = "DOCTOR";

        user.setId(id);
        user.setUsername(username);
        user.setPassword(password);
        user.setRole(role);

        assertEquals(id, user.getId());
        assertEquals(username, user.getUsername());
        assertEquals(password, user.getPassword());
        assertEquals(role, user.getRole());
    }

    @Test
    @DisplayName("Should handle null values")
    void testNullValues() {
        user.setId(null);
        user.setUsername(null);
        user.setPassword(null);
        user.setRole(null);

        assertNull(user.getId());
        assertNull(user.getUsername());
        assertNull(user.getPassword());
        assertNull(user.getRole());
    }

     @Test
     @DisplayName("Should handle empty strings")
     void testEmptyStrings() {
         user.setUsername("");
         user.setPassword("");
         user.setRole("");

         assertEquals("", user.getUsername());
         assertEquals("", user.getPassword());
         assertEquals("", user.getRole());
     }

     @Test
     @DisplayName("Should set and get with special characters")
     void testSpecialCharacters() {
         String username = "user@example.com";
         String password = "P@ssw0rd!#$%";
         String role = "SUPER_ADMIN";

         user.setUsername(username);
         user.setPassword(password);
         user.setRole(role);

         assertEquals(username, user.getUsername());
         assertEquals(password, user.getPassword());
         assertEquals(role, user.getRole());
     }

     @Test
     @DisplayName("Should handle long strings")
     void testLongStrings() {
         String longUsername = "a".repeat(255);
         String longPassword = "b".repeat(255);
         String longRole = "c".repeat(255);

         user.setUsername(longUsername);
         user.setPassword(longPassword);
         user.setRole(longRole);

         assertEquals(longUsername, user.getUsername());
         assertEquals(longPassword, user.getPassword());
         assertEquals(longRole, user.getRole());
     }

     @Test
     @DisplayName("Should allow ID 0")
     void testIdZero() {
         user.setId(0L);
         assertEquals(0L, user.getId());
     }

     @Test
     @DisplayName("Should allow large ID values")
     void testLargeIdValue() {
         Long largeId = Long.MAX_VALUE;
         user.setId(largeId);
         assertEquals(largeId, user.getId());
     }

     @Test
     @DisplayName("Should update fields multiple times")
     void testMultipleUpdates() {
         user.setUsername("user1");
         assertEquals("user1", user.getUsername());

         user.setUsername("user2");
         assertEquals("user2", user.getUsername());

         user.setUsername("user3");
         assertEquals("user3", user.getUsername());
     }

     @Test
     @DisplayName("Should maintain state consistency")
     void testStateConsistency() {
         Long id = 5L;
         String username = "consistent";
         String password = "pass";
         String role = "ROLE";

         user.setId(id);
         user.setUsername(username);
         user.setPassword(password);
         user.setRole(role);

         assertEquals(id, user.getId());
         assertEquals(username, user.getUsername());
         assertEquals(password, user.getPassword());
         assertEquals(role, user.getRole());

         // Change one field and verify others are unchanged
         user.setUsername("changed");
         assertEquals(id, user.getId());
         assertEquals("changed", user.getUsername());
         assertEquals(password, user.getPassword());
         assertEquals(role, user.getRole());
     }

     @Test
     @DisplayName("Should handle unicode characters in username")
     void testUnicodeUsername() {
         String unicodeUsername = "用户名";
         user.setUsername(unicodeUsername);

         assertEquals(unicodeUsername, user.getUsername());
     }

     @Test
     @DisplayName("Should handle whitespace in fields")
     void testWhitespaceInFields() {
         String usernameWithSpace = "user name";
         String passwordWithSpace = "pass word";
         String roleWithSpace = "ADMIN ROLE";

         user.setUsername(usernameWithSpace);
         user.setPassword(passwordWithSpace);
         user.setRole(roleWithSpace);

         assertEquals(usernameWithSpace, user.getUsername());
         assertEquals(passwordWithSpace, user.getPassword());
         assertEquals(roleWithSpace, user.getRole());
     }

     @Test
     @DisplayName("Should verify getter returns same value as setter")
     void testGetterSetterConsistency() {
         Long id = 99L;
         String username = "consistent";
         String password = "password";
         String role = "USER";

         user.setId(id);
         user.setUsername(username);
         user.setPassword(password);
         user.setRole(role);

         assertEquals(id, user.getId());
         assertEquals(username, user.getUsername());
         assertEquals(password, user.getPassword());
         assertEquals(role, user.getRole());
     }

     @Test
     @DisplayName("Should handle single character values")
     void testSingleCharacterValues() {
         user.setUsername("a");
         user.setPassword("b");
         user.setRole("c");

         assertEquals("a", user.getUsername());
         assertEquals("b", user.getPassword());
         assertEquals("c", user.getRole());
     }

     @Test
     @DisplayName("Should allow negative role assignment")
     void testNegativeFieldAssignment() {
         user.setId(-1L);
         assertEquals(-1L, user.getId());
     }
}
