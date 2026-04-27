package com.hms.auth.service;

import com.hms.auth.dto.AuthResponse;
import com.hms.auth.dto.RegisterRequest;
import com.hms.auth.dto.UserResponse;
import com.hms.auth.entity.User;
import com.hms.auth.exception.InvalidRefreshTokenException;
import com.hms.auth.repository.UserRepository;
import com.hms.auth.security.JwtUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("AuthService Tests")
class AuthServiceTest {

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
        testUser.setPassword("password123");
        testUser.setRole("PATIENT");
    }

    @Test
    @DisplayName("Should register a user successfully")
    void testRegisterUser() {
        RegisterRequest request = new RegisterRequest();
        request.setUsername("testuser");
        request.setPassword("password123");
        request.setRole("PATIENT");

        when(userRepository.existsByUsernameIgnoreCase("testuser")).thenReturn(false);
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User u = invocation.getArgument(0);
            u.setId(1L);
            return u;
        });

        UserResponse result = authService.register(request, null);

        assertNotNull(result);
        assertEquals(1L, result.getId());
        assertEquals("testuser", result.getUsername());
        assertEquals("PATIENT", result.getRole());
        verify(userRepository, times(1)).save(any(User.class));
    }

    @Test
    @DisplayName("Should encode password during registration")
    void testRegisterUserPasswordEncoding() {
        String plainPassword = "plainPassword123";
        RegisterRequest request = new RegisterRequest();
        request.setUsername("newuser");
        request.setPassword(plainPassword);
        request.setRole("doctor"); // verify normalization

        when(userRepository.existsByUsernameIgnoreCase("newuser")).thenReturn(false);
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User u = invocation.getArgument(0);
            u.setId(2L);
            return u;
        });

        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);

        UserResponse result = authService.register(request, null);

        assertNotNull(result);
        assertEquals(2L, result.getId());
        assertEquals("newuser", result.getUsername());
        assertEquals("DOCTOR", result.getRole());

        verify(userRepository).save(userCaptor.capture());
        User saved = userCaptor.getValue();
        assertNotNull(saved.getPassword());
        assertNotEquals(plainPassword, saved.getPassword());
        assertTrue(new BCryptPasswordEncoder().matches(plainPassword, saved.getPassword()));
    }

    @Test
    @DisplayName("Should login successfully with valid credentials")
    void testLoginSuccess() {
        String username = "testuser";
        String password = "password123";
        String expectedToken = "jwt.token.here";

        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
        User userWithEncodedPassword = new User();
        userWithEncodedPassword.setId(1L);
        userWithEncodedPassword.setUsername(username);
        userWithEncodedPassword.setPassword(encoder.encode(password));
        userWithEncodedPassword.setRole("PATIENT");

        when(userRepository.findByUsername(username))
            .thenReturn(Optional.of(userWithEncodedPassword));
        when(jwtUtil.generateToken(username, "PATIENT", 1L))
            .thenReturn(expectedToken);

        AuthResponse response = authService.login(username, password);

        assertNotNull(response);
        assertEquals(expectedToken, response.getToken());
        assertNotNull(response.getRefreshToken());
        assertEquals("PATIENT", response.getRole());
        assertNotNull(response.getExpiresIn());

        verify(userRepository, times(1)).findByUsername(username);
        verify(jwtUtil, times(1)).generateToken(username, "PATIENT", 1L);
    }

    @Test
    @DisplayName("Should throw exception when user not found")
    void testLoginUserNotFound() {
        String username = "nonexistent";
        String password = "password123";

        when(userRepository.findByUsername(username))
            .thenReturn(Optional.empty());

        assertThrows(RuntimeException.class, () -> authService.login(username, password));
        verify(userRepository, times(1)).findByUsername(username);
        verify(jwtUtil, never()).generateToken(anyString(), any(), any());
    }

    @Test
    @DisplayName("Should throw exception when password is incorrect")
    void testLoginInvalidPassword() {
        String username = "testuser";
        String correctPassword = "password123";
        String wrongPassword = "wrongpassword";

        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
        User userWithEncodedPassword = new User();
        userWithEncodedPassword.setId(1L);
        userWithEncodedPassword.setUsername(username);
        userWithEncodedPassword.setPassword(encoder.encode(correctPassword));
        userWithEncodedPassword.setRole("PATIENT");

        when(userRepository.findByUsername(username))
            .thenReturn(Optional.of(userWithEncodedPassword));

        assertThrows(RuntimeException.class, () -> authService.login(username, wrongPassword));
        verify(userRepository, times(1)).findByUsername(username);
        verify(jwtUtil, never()).generateToken(anyString(), any(), any());
    }

    @Test
    @DisplayName("Should generate token with correct username and role")
    void testLoginGenerateTokenWithRole() {
        String username = "testuser";
        String password = "password123";
        String role = "ADMIN";
        String expectedToken = "admin.token.here";

        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
        User adminUser = new User();
        adminUser.setId(3L);
        adminUser.setUsername(username);
        adminUser.setPassword(encoder.encode(password));
        adminUser.setRole(role);

        when(userRepository.findByUsername(username))
            .thenReturn(Optional.of(adminUser));
        when(jwtUtil.generateToken(username, role, 3L))
            .thenReturn(expectedToken);

        AuthResponse response = authService.login(username, password);

        assertEquals(expectedToken, response.getToken());
        verify(jwtUtil, times(1)).generateToken(username, role, 3L);
    }

     @Test
     @DisplayName("Should handle user with null role")
     void testLoginWithNullRole() {
         String username = "testuser";
         String password = "password123";
         String expectedToken = "token.with.null.role";

         BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
         User userWithNullRole = new User();
         userWithNullRole.setId(4L);
         userWithNullRole.setUsername(username);
         userWithNullRole.setPassword(encoder.encode(password));
         userWithNullRole.setRole(null);

         when(userRepository.findByUsername(username))
             .thenReturn(Optional.of(userWithNullRole));
         when(jwtUtil.generateToken(username, null, 4L))
             .thenReturn(expectedToken);

         AuthResponse response = authService.login(username, password);

         assertEquals(expectedToken, response.getToken());
         verify(jwtUtil, times(1)).generateToken(username, null, 4L);
     }

     @Test
     @DisplayName("Should verify password encoding during registration")
     void testRegisterVerifyPasswordEncoding() {
         String plainPassword = "myPassword123";
         RegisterRequest request = new RegisterRequest();
         request.setUsername("encodetest");
         request.setPassword(plainPassword);
         request.setRole("patient");

        when(userRepository.existsByUsernameIgnoreCase("encodetest")).thenReturn(false);
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User u = invocation.getArgument(0);
            u.setId(10L);
            return u;
        });

        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);

        UserResponse result = authService.register(request, null);

        assertNotNull(result);
        assertEquals("encodetest", result.getUsername());
        assertEquals("PATIENT", result.getRole());

        verify(userRepository).save(userCaptor.capture());
        assertTrue(new BCryptPasswordEncoder().matches(plainPassword, userCaptor.getValue().getPassword()));
    }

    @Test
    @DisplayName("Should throw exception with correct message on invalid credentials")
    void testLoginInvalidCredentialsMessage() {
        String username = "testuser";
        String wrongPassword = "wrongpass";

        when(userRepository.findByUsername(username)).thenReturn(Optional.empty());

        RuntimeException exception = assertThrows(RuntimeException.class,
            () -> authService.login(username, wrongPassword));

        // InvalidCredentialsException carries the message "Invalid username or password"
        assertEquals("Invalid username or password", exception.getMessage());
    }

    @Test
    @DisplayName("Should call JwtUtil with correct parameters")
    void testLoginCallsJwtUtilWithCorrectParams() {
        String username = "testuser";
        String password = "password123";
        String role = "PATIENT";

        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
        User user = new User();
        user.setId(1L);
        user.setUsername(username);
        user.setPassword(encoder.encode(password));
        user.setRole(role);

        when(userRepository.findByUsername(username)).thenReturn(Optional.of(user));
        when(jwtUtil.generateToken(username, role, 1L)).thenReturn("token");

        authService.login(username, password);

        verify(jwtUtil, times(1)).generateToken(username, role, 1L);
    }

    @Test
    @DisplayName("Should not call JwtUtil if user not found")
    void testLoginDoesNotCallJwtUtilIfUserNotFound() {
        String username = "nonexistent";
        String password = "password123";

        when(userRepository.findByUsername(username)).thenReturn(Optional.empty());

        try {
            authService.login(username, password);
        } catch (RuntimeException e) {
            // Expected
        }

        verify(jwtUtil, never()).generateToken(anyString(), any(), any());
    }

    @Test
    @DisplayName("Should save user with all fields preserved")
    void testRegisterPreserveAllFields() {
        RegisterRequest request = new RegisterRequest();
        request.setUsername("preservetest");
        request.setPassword("passpasspass");
        request.setRole("DOCTOR");

        when(userRepository.existsByUsernameIgnoreCase("preservetest")).thenReturn(false);
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User u = invocation.getArgument(0);
            u.setId(20L);
            return u;
        });

        UserResponse result = authService.register(request, null);

        assertEquals("DOCTOR", result.getRole());
        assertEquals("preservetest", result.getUsername());
        verify(userRepository, times(1)).save(any(User.class));
    }

    @Test
    @DisplayName("Should handle register with admin role")
    void testRegisterAdminUser() {
        RegisterRequest request = new RegisterRequest();
        request.setUsername("admin");
        request.setPassword("adminpass123");
        request.setRole("ADMIN");

        when(userRepository.existsByUsernameIgnoreCase("admin")).thenReturn(false);
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User u = invocation.getArgument(0);
            u.setId(30L);
            return u;
        });

        UserResponse result = authService.register(request, null);

        assertEquals("ADMIN", result.getRole());
        verify(userRepository, times(1)).save(any(User.class));
    }

    @Test
    @DisplayName("Should verify repository.save called in register")
    void testRegisterCallsRepositorySave() {
        RegisterRequest request = new RegisterRequest();
        request.setUsername("savetest");
        request.setPassword("passpasspass");
        request.setRole("PATIENT");

        when(userRepository.existsByUsernameIgnoreCase("savetest")).thenReturn(false);
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User u = invocation.getArgument(0);
            u.setId(40L);
            return u;
        });

        authService.register(request, null);

        verify(userRepository, times(1)).save(any(User.class));
    }

    @Test
    @DisplayName("Should block admin registration when no admin caller")
    void testRegisterAdminBlockedWithoutCaller() {
        RegisterRequest request = new RegisterRequest();
        request.setUsername("newadmin");
        request.setPassword("pass");
        request.setRole("ADMIN");

        when(userRepository.count()).thenReturn(1L);
        // make these stubs lenient to avoid UnnecessaryStubbingException under Mockito strictness
        lenient().when(userRepository.count()).thenReturn(1L);
        lenient().when(userRepository.existsByUsernameIgnoreCase("newadmin")).thenReturn(false);

        assertThrows(SecurityException.class, () -> authService.register(request, null));
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    @DisplayName("Should allow admin registration when caller is ADMIN")
    void testRegisterAdminAllowedWithCaller() {
        RegisterRequest request = new RegisterRequest();
        request.setUsername("newadmin");
        request.setPassword("pass");
        request.setRole("ADMIN");

        lenient().when(userRepository.count()).thenReturn(1L);
        when(userRepository.existsByUsernameIgnoreCase("newadmin")).thenReturn(false);
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        UserResponse response = authService.register(request, "ADMIN");

        assertEquals("ADMIN", response.getRole());
        verify(userRepository).save(any(User.class));
    }

    @Test
    @DisplayName("Should verify code and update user")
    void testVerifyCodeSuccess() {
        User user = new User();
        user.setId(10L);
        user.setVerificationCode("1234");
        user.setIsVerified(false);

        when(userRepository.findById(10L)).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        boolean result = authService.verifyCode(10L, "1234");

        assertTrue(result);
        assertTrue(user.getIsVerified());
        assertEquals(null, user.getVerificationCode());
    }

    @Test
    @DisplayName("Should return false when verification fails")
    void testVerifyCodeFailure() {
        when(userRepository.findById(10L)).thenReturn(Optional.empty());

        boolean result = authService.verifyCode(10L, "1234");

        assertFalse(result);
    }

    @Test
    @DisplayName("Should admin-verify user")
    void testAdminVerifyUser() {
        User user = new User();
        user.setId(12L);
        user.setIsVerified(false);
        user.setVerificationCode("9999");

        when(userRepository.findById(12L)).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        authService.adminVerifyUser(12L);

        assertTrue(user.getIsVerified());
        assertEquals(null, user.getVerificationCode());
        verify(userRepository).save(user);
    }

    @Test
    @DisplayName("Should refresh token and revoke old refresh token")
    void testRefreshTokenFlow() {
        String username = "testuser";
        String password = "password123";
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
        User user = new User();
        user.setId(1L);
        user.setUsername(username);
        user.setPassword(encoder.encode(password));
        user.setRole("PATIENT");
        user.setIsVerified(true);

        when(userRepository.findByUsername(username)).thenReturn(Optional.of(user));
        when(jwtUtil.generateToken(username, "PATIENT", 1L)).thenReturn("token1", "token2");

        AuthResponse login = authService.login(username, password);
        AuthResponse refreshed = authService.refresh(login.getRefreshToken());

        assertEquals("token2", refreshed.getToken());
        assertNotNull(refreshed.getRefreshToken());
        assertNotEquals(login.getRefreshToken(), refreshed.getRefreshToken());

        assertThrows(InvalidRefreshTokenException.class, () -> authService.refresh(login.getRefreshToken()));
    }

    @Test
    @DisplayName("Should logout and invalidate refresh token")
    void testLogoutInvalidatesToken() {
        String username = "testuser";
        String password = "password123";
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
        User user = new User();
        user.setId(1L);
        user.setUsername(username);
        user.setPassword(encoder.encode(password));
        user.setRole("PATIENT");
        user.setIsVerified(true);

        when(userRepository.findByUsername(username)).thenReturn(Optional.of(user));
        when(jwtUtil.generateToken(username, "PATIENT", 1L)).thenReturn("token1");

        AuthResponse login = authService.login(username, password);
        authService.logout(login.getRefreshToken());

        assertThrows(InvalidRefreshTokenException.class, () -> authService.refresh(login.getRefreshToken()));
    }

    @Test
    @DisplayName("Should throw when refresh token is invalid")
    void testRefreshInvalidToken() {
        assertThrows(InvalidRefreshTokenException.class, () -> authService.refresh("missing"));
    }
}
