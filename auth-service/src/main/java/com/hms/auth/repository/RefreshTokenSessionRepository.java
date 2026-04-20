package com.hms.auth.repository;

import com.hms.auth.entity.RefreshTokenSession;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface RefreshTokenSessionRepository extends JpaRepository<RefreshTokenSession, Long> {
    Optional<RefreshTokenSession> findByRefreshTokenAndRevokedFalse(String refreshToken);
}
