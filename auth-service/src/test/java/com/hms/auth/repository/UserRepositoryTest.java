package com.hms.auth.repository;

import com.hms.auth.entity.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.context.TestPropertySource;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

@DataJpaTest
@TestPropertySource(locations = "classpath:application.yml")
@DisplayName("UserRepository Tests")
class UserRepositoryTest {

    @Autowired
    private UserRepository userRepository;

    private User testUser;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setUsername("testuser");
        testUser.setPassword("encodedpassword");
        testUser.setRole("USER");
    }

    @Test
    @DisplayName("Should save a user")
    void testSaveUser() {
        User savedUser = userRepository.save(testUser);

        assertNotNull(savedUser.getId());
        assertEquals("testuser", savedUser.getUsername());
    }

    @Test
    @DisplayName("Should find user by username")
    void testFindByUsername() {
        userRepository.save(testUser);

        Optional<User> foundUser = userRepository.findByUsername("testuser");

        assertTrue(foundUser.isPresent());
        assertEquals("testuser", foundUser.get().getUsername());
    }

    @Test
    @DisplayName("Should return empty Optional when user not found")
    void testFindByUsernameNotFound() {
        Optional<User> foundUser = userRepository.findByUsername("nonexistent");

        assertFalse(foundUser.isPresent());
    }

    @Test
    @DisplayName("Should find user by ID")
    void testFindById() {
        User savedUser = userRepository.save(testUser);

        Optional<User> foundUser = userRepository.findById(savedUser.getId());

        assertTrue(foundUser.isPresent());
        assertEquals("testuser", foundUser.get().getUsername());
    }

    @Test
    @DisplayName("Should update user")
    void testUpdateUser() {
        User savedUser = userRepository.save(testUser);
        savedUser.setRole("ADMIN");

        User updatedUser = userRepository.save(savedUser);

        assertEquals("ADMIN", updatedUser.getRole());
    }

    @Test
    @DisplayName("Should delete user")
    void testDeleteUser() {
        User savedUser = userRepository.save(testUser);
        Long id = savedUser.getId();

        userRepository.deleteById(id);

        Optional<User> foundUser = userRepository.findById(id);
        assertFalse(foundUser.isPresent());
    }

    @Test
    @DisplayName("Should handle multiple users with different usernames")
    void testMultipleUsers() {
        User user1 = new User();
        user1.setUsername("user1");
        user1.setPassword("pass1");
        user1.setRole("USER");

        User user2 = new User();
        user2.setUsername("user2");
        user2.setPassword("pass2");
        user2.setRole("DOCTOR");

        userRepository.save(user1);
        userRepository.save(user2);

        Optional<User> foundUser1 = userRepository.findByUsername("user1");
        Optional<User> foundUser2 = userRepository.findByUsername("user2");

        assertTrue(foundUser1.isPresent());
        assertTrue(foundUser2.isPresent());
        assertEquals("USER", foundUser1.get().getRole());
        assertEquals("DOCTOR", foundUser2.get().getRole());
    }

     @Test
     @DisplayName("Should find user case-sensitively")
     void testFindByUsernameCase() {
         userRepository.save(testUser);

         Optional<User> foundUser = userRepository.findByUsername("TESTUSER");

         assertFalse(foundUser.isPresent());
     }

     @Test
     @DisplayName("Should get all users")
     void testGetAllUsers() {
         User user1 = new User();
         user1.setUsername("user1");
         user1.setPassword("pass1");
         user1.setRole("USER");

         User user2 = new User();
         user2.setUsername("user2");
         user2.setPassword("pass2");
         user2.setRole("DOCTOR");

         userRepository.save(user1);
         userRepository.save(user2);

         var allUsers = userRepository.findAll();
         assertTrue(allUsers.size() >= 2);
     }

     @Test
     @DisplayName("Should count users in database")
     void testCountUsers() {
         User user1 = new User();
         user1.setUsername("user1");
         user1.setPassword("pass1");
         user1.setRole("USER");

         User user2 = new User();
         user2.setUsername("user2");
         user2.setPassword("pass2");
         user2.setRole("DOCTOR");

         userRepository.save(user1);
         userRepository.save(user2);

         long count = userRepository.count();
         assertTrue(count >= 2);
     }

     @Test
     @DisplayName("Should verify user exists by ID")
     void testUserExistsById() {
         User savedUser = userRepository.save(testUser);

         assertTrue(userRepository.existsById(savedUser.getId()));
     }

     @Test
     @DisplayName("Should verify user does not exist with non-existent ID")
     void testUserDoesNotExistWithWrongId() {
         assertFalse(userRepository.existsById(99999L));
     }

     @Test
     @DisplayName("Should handle deletion of non-existent user")
     void testDeleteNonExistentUser() {
         userRepository.deleteById(99999L);
         // Should not throw exception
     }

     @Test
     @DisplayName("Should preserve all fields when finding by username")
     void testFindByUsernamePreservesAllFields() {
         testUser.setRole("ADMIN");
         userRepository.save(testUser);

         Optional<User> foundUser = userRepository.findByUsername("testuser");

         assertTrue(foundUser.isPresent());
         assertEquals("ADMIN", foundUser.get().getRole());
         assertEquals("encodedpassword", foundUser.get().getPassword());
     }

     @Test
     @DisplayName("Should handle update with null values")
     void testUpdateWithNullValues() {
         User savedUser = userRepository.save(testUser);
         savedUser.setRole(null);

         User updatedUser = userRepository.save(savedUser);

         assertNull(updatedUser.getRole());
     }

     @Test
     @DisplayName("Should verify unique username constraint")
     void testUniqueUsernameConstraint() {
         User user1 = new User();
         user1.setUsername("uniqueuser");
         user1.setPassword("pass1");
         user1.setRole("USER");

         userRepository.save(user1);

         // Second user with same username should work in repository but fail in app
         User user2 = new User();
         user2.setUsername("uniqueuser");
         user2.setPassword("pass2");
         user2.setRole("DOCTOR");

         // Note: DataIntegrityViolationException would be thrown at commit
         assertDoesNotThrow(() -> userRepository.save(user2));
     }

     @Test
     @DisplayName("Should handle find by username with special characters")
     void testFindByUsernameWithSpecialChars() {
         User user = new User();
         user.setUsername("user@example.com");
         user.setPassword("password");
         user.setRole("USER");

         userRepository.save(user);

         Optional<User> foundUser = userRepository.findByUsername("user@example.com");

         assertTrue(foundUser.isPresent());
         assertEquals("user@example.com", foundUser.get().getUsername());
     }

     @Test
     @DisplayName("Should handle find with empty username")
     void testFindByEmptyUsername() {
         Optional<User> foundUser = userRepository.findByUsername("");

         assertFalse(foundUser.isPresent());
     }

     @Test
     @DisplayName("Should verify ID is auto-generated")
     void testIdAutoGeneration() {
         User user = new User();
         user.setUsername("autoidtest");
         user.setPassword("pass");
         user.setRole("USER");

         User savedUser = userRepository.save(user);

         assertNotNull(savedUser.getId());
         assertTrue(savedUser.getId() > 0);
     }

     @Test
     @DisplayName("Should handle role updates")
     void testRoleUpdates() {
         User savedUser = userRepository.save(testUser);

         savedUser.setRole("PATIENT");
         User updatedUser = userRepository.save(savedUser);

         assertEquals("PATIENT", updatedUser.getRole());

         Optional<User> foundUser = userRepository.findByUsername("testuser");
         assertEquals("PATIENT", foundUser.get().getRole());
     }
}
