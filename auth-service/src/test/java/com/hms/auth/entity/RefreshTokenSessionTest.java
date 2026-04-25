package com.hms.auth.entity;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertEquals;

@DisplayName("RefreshTokenSession Entity Tests")
class RefreshTokenSessionTest {

    private RefreshTokenSession session;

    @BeforeEach
    void setUp() {
        session = new RefreshTokenSession();
    }

    @Test
    @DisplayName("Should set and get fields")
    void testSetAndGetFields() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime expiry = now.plusDays(1);
        LocalDateTime revokedAt = now.plusHours(2);

        session.setId(1L);
        session.setRefreshToken("rt-1");
        session.setUserId(10L);
        session.setUsername("user1");
        session.setRole("PATIENT");
        session.setRevoked(true);
        session.setCreatedAt(now);
        session.setExpiresAt(expiry);
        session.setRevokedAt(revokedAt);

        assertEquals(1L, session.getId());
        assertEquals("rt-1", session.getRefreshToken());
        assertEquals(10L, session.getUserId());
        assertEquals("user1", session.getUsername());
        assertEquals("PATIENT", session.getRole());
        assertEquals(true, session.isRevoked());
        assertEquals(now, session.getCreatedAt());
        assertEquals(expiry, session.getExpiresAt());
        assertEquals(revokedAt, session.getRevokedAt());
    }
}
