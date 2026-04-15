package com.hms.auth.service;

import com.hms.auth.entity.User;
import com.hms.auth.repository.UserRepository;
import com.hms.auth.security.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JwtUtil jwtUtil;

    private BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

    public User register(User user) {
        user.setPassword(encoder.encode(user.getPassword()));
        return userRepository.save(user);
    }

    public String login(String username, String password) {
        Optional<User> user = userRepository.findByUsername(username);

        if (user.isPresent() && encoder.matches(password, user.get().getPassword())) {
            // ✅ pass both username AND role
            return jwtUtil.generateToken(username, user.get().getRole());
        }

        throw new RuntimeException("Invalid credentials");
    }
}