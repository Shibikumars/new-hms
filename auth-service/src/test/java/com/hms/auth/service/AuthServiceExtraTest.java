package com.hms.auth.service;

import com.hms.auth.entity.User;
import com.hms.auth.repository.UserRepository;
import com.hms.auth.security.JwtUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("AuthService Extra Coverage Tests")
class AuthServiceExtraTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private JwtUtil jwtUtil;

    @InjectMocks
    private AuthService authService;

    private User testUser;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId(1L);
        testUser.setUsername("testuser");
        testUser.setIsVerified(false);
    }

    @Test
    @DisplayName("Should verify user by admin")
    void testAdminVerifyUser() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));

        authService.adminVerifyUser(1L);

        assertTrue(testUser.getIsVerified());
        assertNull(testUser.getVerificationCode());
        verify(userRepository).save(testUser);
    }

    @Test
    @DisplayName("Should delete user by username")
    void testDeleteUserByUsername() {
        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(testUser));

        authService.deleteUserByUsername("testuser");

        verify(userRepository).delete(testUser);
    }

    @Test
    @DisplayName("Should reset all passwords")
    void testResetAllPasswords() {
        User user1 = new User();
        user1.setPassword("old1");
        User user2 = new User();
        user2.setPassword("old2");
        
        when(userRepository.findAll()).thenReturn(List.of(user1, user2));

        authService.resetAllPasswords("newpassword");

        verify(userRepository, times(2)).save(any(User.class));
    }

    @Test
    @DisplayName("Should debug list users")
    void testDebugListUsers() {
        testUser.setRole("DOCTOR");
        testUser.setIsVerified(true);
        testUser.setPassword("hashed");
        
        when(userRepository.findAll()).thenReturn(List.of(testUser));

        Object result = authService.debugListUsers();
        
        assertNotNull(result);
        assertTrue(result instanceof List);
        List<?> list = (List<?>) result;
        assertEquals(1, list.size());
    }

    @Test
    @DisplayName("Should handle logout with null token")
    void testLogoutNullToken() {
        assertDoesNotThrow(() -> authService.logout(null));
    }

    @Test
    @DisplayName("Should handle logout with empty token")
    void testLogoutEmptyToken() {
        assertDoesNotThrow(() -> authService.logout(""));
    }
}
