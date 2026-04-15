package com.hms.auth.service;

import com.hms.auth.dto.RegisterRequest;
import com.hms.auth.dto.UserResponse;
import com.hms.auth.entity.User;
import com.hms.auth.repository.UserRepository;
import com.hms.auth.security.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Locale;
import java.util.Optional;

@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JwtUtil jwtUtil;

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

    public String login(String username, String password) {
        Optional<User> user = userRepository.findByUsername(username.trim());

        if (user.isPresent() && encoder.matches(password, user.get().getPassword())) {
            return jwtUtil.generateToken(user.get().getUsername(), user.get().getRole());
        }

        throw new RuntimeException("Invalid credentials");
    }
}
