package com.hms.auth.service;

import com.hms.auth.dto.RegisterRequest;
import com.hms.auth.dto.AuthResponse;
import com.hms.auth.dto.UserResponse;
import com.hms.auth.entity.User;
import com.hms.auth.repository.UserRepository;
import com.hms.auth.security.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Locale;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;

@Service
public class AuthService {

    private static final long ACCESS_TOKEN_EXPIRY_SECONDS = 10 * 60 * 60;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JwtUtil jwtUtil;

    private final ConcurrentMap<String, RefreshSession> refreshTokens = new ConcurrentHashMap<>();

    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

    public UserResponse register(RegisterRequest request) {
        String normalizedUsername = request.getUsername().trim();
        String normalizedRole = request.getRole().trim().toUpperCase(Locale.ROOT);

        if (userRepository.existsByUsernameIgnoreCase(normalizedUsername)) {
            throw new IllegalArgumentException("Username already exists");
        }

        User user = new User();
        user.setUsername(normalizedUsername);
        user.setPassword(encoder.encode(request.getPassword()));
        user.setRole(normalizedRole);

        User saved = userRepository.save(user);
        return new UserResponse(saved.getId(), saved.getUsername(), saved.getRole());
    }

    public AuthResponse login(String username, String password) {
        Optional<User> user = userRepository.findByUsername(username.trim());

        if (user.isPresent() && encoder.matches(password, user.get().getPassword())) {
            User authenticatedUser = user.get();
            String token = jwtUtil.generateToken(authenticatedUser.getUsername(), authenticatedUser.getRole(), authenticatedUser.getId());
            String refreshToken = UUID.randomUUID().toString();
            refreshTokens.put(refreshToken, new RefreshSession(authenticatedUser.getId(), authenticatedUser.getUsername(), authenticatedUser.getRole()));

            return new AuthResponse(token, refreshToken, authenticatedUser.getRole(), ACCESS_TOKEN_EXPIRY_SECONDS);
        }

        throw new RuntimeException("Invalid credentials");
    }

    public AuthResponse refresh(String refreshToken) {
        RefreshSession session = refreshTokens.get(refreshToken);
        if (session == null) {
            throw new RuntimeException("Invalid refresh token");
        }

        String token = jwtUtil.generateToken(session.username(), session.role(), session.userId());
        return new AuthResponse(token, refreshToken, session.role(), ACCESS_TOKEN_EXPIRY_SECONDS);
    }

    private record RefreshSession(Long userId, String username, String role) {
    }
}
