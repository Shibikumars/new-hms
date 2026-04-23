package com.hms.auth.service;

import com.hms.auth.dto.RegisterRequest;
import com.hms.auth.dto.AuthResponse;
import com.hms.auth.dto.UserResponse;
import com.hms.auth.entity.RefreshTokenSession;
import com.hms.auth.entity.User;
import com.hms.auth.exception.InvalidCredentialsException;
import com.hms.auth.exception.InvalidRefreshTokenException;
import com.hms.auth.repository.RefreshTokenSessionRepository;
import com.hms.auth.repository.UserRepository;
import com.hms.auth.security.JwtUtil;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Locale;
import java.util.Optional;
import java.util.UUID;
import java.util.Random;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;

@Service
public class AuthService {

    private static final long ACCESS_TOKEN_EXPIRY_SECONDS = 15 * 60;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired(required = false)
    private RefreshTokenSessionRepository refreshTokenSessionRepository;

    @Value("${hms.auth.refresh-token-expiry-seconds:604800}")
    private long refreshTokenExpirySeconds;

    private final ConcurrentMap<String, RefreshSession> refreshTokens = new ConcurrentHashMap<>();
    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
    private final Random random = new Random();

    public UserResponse register(RegisterRequest request, String callerRole) {
        String normalizedUsername = request.getUsername().trim();
        String normalizedRole = request.getRole().trim().toUpperCase(Locale.ROOT);

        if ("ADMIN".equals(normalizedRole)) {
            if (userRepository.count() > 0) {
                if (callerRole == null || !"ADMIN".equals(callerRole.toUpperCase(Locale.ROOT))) {
                    throw new SecurityException("Only an existing ADMIN can register a new ADMIN");
                }
            }
        }

        if (userRepository.existsByUsernameIgnoreCase(normalizedUsername)) {
            throw new IllegalArgumentException("Username already exists");
        }

        User user = new User();
        user.setUsername(normalizedUsername);
        user.setPassword(encoder.encode(request.getPassword()));
        user.setRole(normalizedRole);
        
        // Generate a 6-digit mock OTP
        String otp = String.format("%06d", random.nextInt(999999));
        user.setVerificationCode(otp);
        user.setIsVerified(false);

        User saved = userRepository.save(user);
        
        System.out.println(">>> MOCK EMAIL SENT to " + saved.getUsername() + " with OTP: " + otp);
        
        return new UserResponse(saved.getId(), saved.getUsername(), saved.getRole());
    }

    public AuthResponse login(String username, String password) {
        Optional<User> userOpt = userRepository.findByUsername(username.trim());

        if (userOpt.isPresent() && encoder.matches(password, userOpt.get().getPassword())) {
            User user = userOpt.get();
            String token = jwtUtil.generateToken(user.getUsername(), user.getRole(), user.getId());
            String refreshToken = UUID.randomUUID().toString();
            RefreshSession session = new RefreshSession(user.getId(), user.getUsername(), user.getRole());
            persistRefreshToken(refreshToken, session);

            return new AuthResponse(token, refreshToken, user.getRole(), ACCESS_TOKEN_EXPIRY_SECONDS, !user.getIsVerified());
        }

        throw new InvalidCredentialsException();
    }

    public boolean verifyCode(Long userId, String code) {
        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            if (code != null && code.equals(user.getVerificationCode())) {
                user.setIsVerified(true);
                user.setVerificationCode(null);
                userRepository.save(user);
                return true;
            }
        }
        return false;
    }

    public AuthResponse refresh(String refreshToken) {
        RefreshSession session = getActiveRefreshSession(refreshToken);
        if (session == null) throw new InvalidRefreshTokenException();

        revokeRefreshToken(refreshToken);
        String newRefreshToken = UUID.randomUUID().toString();
        persistRefreshToken(newRefreshToken, session);

        String token = jwtUtil.generateToken(session.username(), session.role(), session.userId());
        return new AuthResponse(token, newRefreshToken, session.role(), ACCESS_TOKEN_EXPIRY_SECONDS, false);
    }

    public void logout(String refreshToken) {
        if (refreshToken == null || refreshToken.isBlank()) return;
        revokeRefreshToken(refreshToken);
    }

    private void persistRefreshToken(String refreshToken, RefreshSession session) {
        refreshTokens.put(refreshToken, session);
        if (refreshTokenSessionRepository == null) return;

        RefreshTokenSession entity = new RefreshTokenSession();
        entity.setRefreshToken(refreshToken);
        entity.setUserId(session.userId());
        entity.setUsername(session.username());
        entity.setRole(session.role());
        entity.setRevoked(false);
        entity.setCreatedAt(LocalDateTime.now());
        entity.setExpiresAt(LocalDateTime.now().plusSeconds(refreshTokenExpirySeconds));
        refreshTokenSessionRepository.save(entity);
    }

    private RefreshSession getActiveRefreshSession(String refreshToken) {
        if (refreshTokenSessionRepository != null) {
            Optional<RefreshTokenSession> record = refreshTokenSessionRepository.findByRefreshTokenAndRevokedFalse(refreshToken)
                .filter(t -> t.getExpiresAt() != null && t.getExpiresAt().isAfter(LocalDateTime.now()));

            if (record.isPresent()) {
                RefreshTokenSession value = record.get();
                return new RefreshSession(value.getUserId(), value.getUsername(), value.getRole());
            }
        }
        return refreshTokens.get(refreshToken);
    }

    private void revokeRefreshToken(String refreshToken) {
        refreshTokens.remove(refreshToken);
        if (refreshTokenSessionRepository == null) return;
        refreshTokenSessionRepository.findByRefreshTokenAndRevokedFalse(refreshToken).ifPresent(token -> {
            token.setRevoked(true);
            token.setRevokedAt(LocalDateTime.now());
            refreshTokenSessionRepository.save(token);
        });
    }

    private record RefreshSession(Long userId, String username, String role) {}
}
