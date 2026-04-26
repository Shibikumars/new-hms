package com.hms.auth.service;

import com.hms.auth.entity.RefreshTokenSession;
import com.hms.auth.entity.User;
import com.hms.auth.repository.RefreshTokenSessionRepository;
import com.hms.auth.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("AuthService admin/misc tests")
class AuthServiceAdminMiscTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private RefreshTokenSessionRepository refreshTokenSessionRepository;

    @InjectMocks
    private AuthService authService;

    private User user1;
    private User user2;

    @BeforeEach
    void setUp() {
        user1 = new User();
        user1.setId(1L);
        user1.setUsername("alice");
        user1.setPassword("oldhash1");
        user1.setRole("PATIENT");
        user1.setIsVerified(true);

        user2 = new User();
        user2.setId(2L);
        user2.setUsername("bob");
        user2.setPassword("oldhash2");
        user2.setRole("DOCTOR");
        user2.setIsVerified(false);
    }

    @Test
    @DisplayName("debugListUsers should map users to simple maps")
    void testDebugListUsers() {
        when(userRepository.findAll()).thenReturn(List.of(user1, user2));

        Object result = authService.debugListUsers();
        assertNotNull(result);
        assertTrue(result instanceof List);

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> list = (List<Map<String, Object>>) result;
        assertEquals(2, list.size());
        Map<String, Object> first = list.stream().filter(m -> "alice".equals(m.get("username"))).findFirst().orElse(null);
        assertNotNull(first);
        assertEquals("PATIENT", first.get("role"));
        assertTrue(((String) first.get("password")).startsWith("oldhash"));
        assertEquals(Boolean.TRUE, first.get("isVerified"));
    }

    @Test
    @DisplayName("deleteUserByUsername should delete when user exists")
    void testDeleteUserByUsername() {
        when(userRepository.findByUsername("alice")).thenReturn(Optional.of(user1));

        authService.deleteUserByUsername("alice");

        verify(userRepository, times(1)).delete(user1);
    }

    @Test
    @DisplayName("resetAllPasswords should update all users with hashed password")
    void testResetAllPasswords() {
        when(userRepository.findAll()).thenReturn(List.of(user1, user2));
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        authService.resetAllPasswords("new-secret-pass");

        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
        verify(userRepository, times(2)).save(captor.capture());

        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
        for (User saved : captor.getAllValues()) {
            assertNotNull(saved.getPassword());
            assertTrue(encoder.matches("new-secret-pass", saved.getPassword()));
        }
    }

    @Test
    @DisplayName("logout should revoke refresh token in repository when present")
    void testLogoutRevokesRepoToken() {
        RefreshTokenSession session = new RefreshTokenSession();
        session.setRefreshToken("rt-123");
        session.setUserId(5L);
        session.setUsername("charlie");
        session.setRole("PATIENT");
        session.setRevoked(false);
        session.setCreatedAt(LocalDateTime.now().minusDays(1));
        session.setExpiresAt(LocalDateTime.now().plusDays(1));

        when(refreshTokenSessionRepository.findByRefreshTokenAndRevokedFalse("rt-123")).thenReturn(Optional.of(session));
        when(refreshTokenSessionRepository.save(any(RefreshTokenSession.class))).thenAnswer(inv -> inv.getArgument(0));

        authService.logout("rt-123");

        ArgumentCaptor<RefreshTokenSession> captor = ArgumentCaptor.forClass(RefreshTokenSession.class);
        verify(refreshTokenSessionRepository).save(captor.capture());
        RefreshTokenSession saved = captor.getValue();
        assertTrue(saved.isRevoked());
        assertNotNull(saved.getRevokedAt());
    }
}
