package com.hms.auth.service;

import com.hms.auth.entity.RefreshTokenSession;
import com.hms.auth.exception.InvalidRefreshTokenException;
import com.hms.auth.repository.RefreshTokenSessionRepository;
import com.hms.auth.repository.UserRepository;
import com.hms.auth.security.JwtUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("AuthService Refresh Repository Tests")
class AuthServiceRefreshRepositoryTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private JwtUtil jwtUtil;

    @Mock
    private RefreshTokenSessionRepository refreshTokenSessionRepository;

    @InjectMocks
    private AuthService authService;

    private RefreshTokenSession session;

    @BeforeEach
    void setUp() {
        session = new RefreshTokenSession();
        session.setRefreshToken("rt-1");
        session.setUserId(10L);
        session.setUsername("user1");
        session.setRole("PATIENT");
        session.setRevoked(false);
        session.setCreatedAt(LocalDateTime.now().minusHours(1));
        session.setExpiresAt(LocalDateTime.now().plusHours(1));
    }

    @Test
    @DisplayName("Should refresh token using repository session")
    void testRefreshUsesRepository() {
        when(refreshTokenSessionRepository.findByRefreshTokenAndRevokedFalse("rt-1"))
            .thenReturn(Optional.of(session));
        when(jwtUtil.generateToken("user1", "PATIENT", 10L)).thenReturn("token2");
        when(refreshTokenSessionRepository.save(any(RefreshTokenSession.class)))
            .thenAnswer(invocation -> invocation.getArgument(0));

        var response = authService.refresh("rt-1");

        assertEquals("token2", response.getToken());
        assertNotNull(response.getRefreshToken());

        ArgumentCaptor<RefreshTokenSession> captor = ArgumentCaptor.forClass(RefreshTokenSession.class);
        verify(refreshTokenSessionRepository, atLeastOnce()).save(captor.capture());
        assertNotNull(captor.getAllValues());
    }

    @Test
    @DisplayName("Should throw when repository session expired")
    void testRefreshRejectsExpiredSession() {
        session.setExpiresAt(LocalDateTime.now().minusMinutes(1));
        when(refreshTokenSessionRepository.findByRefreshTokenAndRevokedFalse("rt-1"))
            .thenReturn(Optional.of(session));

        assertThrows(InvalidRefreshTokenException.class, () -> authService.refresh("rt-1"));
        verify(jwtUtil, never()).generateToken(anyString(), anyString(), any());
    }
}
