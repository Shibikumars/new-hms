package com.hms.auth.controller;

import com.hms.auth.dto.AuthRequest;
import com.hms.auth.dto.AuthResponse;
import com.hms.auth.dto.RefreshRequest;
import com.hms.auth.dto.RegisterRequest;
import com.hms.auth.dto.UserResponse;
import com.hms.auth.security.JwtUtil;
import com.hms.auth.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/auth")
public class AuthController {

    @Autowired
    private AuthService authService;

    @Autowired
    private JwtUtil jwtUtil;

    @PostMapping("/register")
    public ResponseEntity<UserResponse> register(
            @Valid @RequestBody RegisterRequest request,
            @RequestHeader(value = "X-User-Role", required = false) String callerRole
    ) {
        UserResponse saved = authService.register(request, callerRole);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody AuthRequest request) {
        return ResponseEntity.ok(authService.login(request.getUsername(), request.getPassword()));
    }

    @PostMapping("/verify")
    public ResponseEntity<?> verify(@RequestParam Long userId, @RequestParam String code) {
        boolean success = authService.verifyCode(userId, code);
        if (success) {
            return ResponseEntity.ok(Map.of("message", "Verification successful"));
        }
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", "Invalid or expired code"));
    }

    @PostMapping("/admin/verify/{userId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> adminVerify(@PathVariable Long userId) {
        authService.adminVerifyUser(userId);
        return ResponseEntity.ok(Map.of("message", "User verified by admin"));
    }

    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refresh(@Valid @RequestBody RefreshRequest request) {
        return ResponseEntity.ok(authService.refresh(request.getRefreshToken()));
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(@Valid @RequestBody RefreshRequest request) {
        authService.logout(request.getRefreshToken());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/debug/users")
    public ResponseEntity<?> debugUsers() {
        return ResponseEntity.ok(authService.debugListUsers());
    }

    @GetMapping("/validate")
    public ResponseEntity<?> validate(
            @RequestHeader(value = "Authorization", required = false) String authHeader
    ) {
        try {
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                return ResponseEntity.status(401).body("Missing or invalid Authorization header");
            }
            String token = authHeader.substring(7);
            String username = jwtUtil.extractUsername(token);
            String role = jwtUtil.extractRole(token);

            Map<String, String> result = new HashMap<>();
            result.put("username", username);
            if (role != null) {
                result.put("role", role);
            }
            result.put("status", "valid");
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.status(401).body("Invalid or expired token");
        }
    }
}
