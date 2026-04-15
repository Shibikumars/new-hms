package com.hms.auth.service;

import com.hms.auth.entity.User;
import com.hms.auth.repository.UserRepository;
import com.hms.auth.security.JwtUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.extension.ExtendWith;
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
        testUser.setRole("USER");
    }

    @Test
    @DisplayName("Should register a user successfully")
    void testRegisterUser() {
        when(userRepository.save(any(User.class))).thenReturn(testUser);

        User result = authService.register(testUser);

        assertNotNull(result);
        assertEquals("testuser", result.getUsername());
        verify(userRepository, times(1)).save(any(User.class));
    }

    @Test
    @DisplayName("Should encode password during registration")
    void testRegisterUserPasswordEncoding() {
        String plainPassword = "plainPassword123";
        User userToRegister = new User();
        userToRegister.setUsername("newuser");
        userToRegister.setPassword(plainPassword);
        userToRegister.setRole("DOCTOR");

        User savedUser = new User();
        savedUser.setId(2L);
        savedUser.setUsername("newuser");
        savedUser.setPassword(plainPassword);
        savedUser.setRole("DOCTOR");

        when(userRepository.save(any(User.class))).thenReturn(savedUser);

        User result = authService.register(userToRegister);

        assertNotNull(result);
        verify(userRepository, times(1)).save(any(User.class));
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
        userWithEncodedPassword.setRole("USER");

        when(userRepository.findByUsername(username))
            .thenReturn(Optional.of(userWithEncodedPassword));
        when(jwtUtil.generateToken(username, "USER"))
            .thenReturn(expectedToken);

        String token = authService.login(username, password);

        assertEquals(expectedToken, token);
        verify(userRepository, times(1)).findByUsername(username);
        verify(jwtUtil, times(1)).generateToken(username, "USER");
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
        verify(jwtUtil, never()).generateToken(anyString(), anyString());
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
        userWithEncodedPassword.setRole("USER");

        when(userRepository.findByUsername(username))
            .thenReturn(Optional.of(userWithEncodedPassword));

        assertThrows(RuntimeException.class, () -> authService.login(username, wrongPassword));
        verify(userRepository, times(1)).findByUsername(username);
        verify(jwtUtil, never()).generateToken(anyString(), anyString());
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
        when(jwtUtil.generateToken(username, role))
            .thenReturn(expectedToken);

        String token = authService.login(username, password);

        assertEquals(expectedToken, token);
        verify(jwtUtil, times(1)).generateToken(username, role);
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
         when(jwtUtil.generateToken(username, null))
             .thenReturn(expectedToken);

         String token = authService.login(username, password);

         assertEquals(expectedToken, token);
         verify(jwtUtil, times(1)).generateToken(username, null);
     }

     @Test
     @DisplayName("Should verify password encoding during registration")
     void testRegisterVerifyPasswordEncoding() {
         String plainPassword = "myPassword123";
         User userToRegister = new User();
         userToRegister.setUsername("encodetest");
         userToRegister.setPassword(plainPassword);
         userToRegister.setRole("USER");

         User savedUser = new User();
         savedUser.setId(10L);
         savedUser.setUsername("encodetest");
         savedUser.setPassword(plainPassword);
         savedUser.setRole("USER");

         when(userRepository.save(any(User.class))).thenReturn(savedUser);

         User result = authService.register(userToRegister);

         assertNotNull(result);
         assertEquals("encodetest", result.getUsername());
         verify(userRepository, times(1)).save(any(User.class));
     }

     @Test
     @DisplayName("Should throw exception with correct message on invalid credentials")
     void testLoginInvalidCredentialsMessage() {
         String username = "testuser";
         String wrongPassword = "wrongpass";

         when(userRepository.findByUsername(username)).thenReturn(Optional.empty());

         RuntimeException exception = assertThrows(RuntimeException.class,
             () -> authService.login(username, wrongPassword));

         assertEquals("Invalid credentials", exception.getMessage());
     }

     @Test
     @DisplayName("Should call JwtUtil with correct parameters")
     void testLoginCallsJwtUtilWithCorrectParams() {
         String username = "testuser";
         String password = "password123";
         String role = "USER";

         BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
         User user = new User();
         user.setId(1L);
         user.setUsername(username);
         user.setPassword(encoder.encode(password));
         user.setRole(role);

         when(userRepository.findByUsername(username)).thenReturn(Optional.of(user));
         when(jwtUtil.generateToken(username, role)).thenReturn("token");

         authService.login(username, password);

         verify(jwtUtil, times(1)).generateToken(username, role);
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

         verify(jwtUtil, never()).generateToken(anyString(), anyString());
     }

     @Test
     @DisplayName("Should save user with all fields preserved")
     void testRegisterPreserveAllFields() {
         User userToRegister = new User();
         userToRegister.setUsername("preservetest");
         userToRegister.setPassword("pass");
         userToRegister.setRole("DOCTOR");

         User savedUser = new User();
         savedUser.setId(20L);
         savedUser.setUsername("preservetest");
         savedUser.setPassword("encoded");
         savedUser.setRole("DOCTOR");

         when(userRepository.save(any(User.class))).thenReturn(savedUser);

         User result = authService.register(userToRegister);

         assertEquals("DOCTOR", result.getRole());
         assertEquals("preservetest", result.getUsername());
         verify(userRepository, times(1)).save(any(User.class));
     }

     @Test
     @DisplayName("Should handle login with empty string role")
     void testLoginWithEmptyRole() {
         String username = "testuser";
         String password = "password123";

         BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
         User user = new User();
         user.setId(1L);
         user.setUsername(username);
         user.setPassword(encoder.encode(password));
         user.setRole("");

         when(userRepository.findByUsername(username)).thenReturn(Optional.of(user));
         when(jwtUtil.generateToken(username, "")).thenReturn("token");

         String token = authService.login(username, password);

         assertEquals("token", token);
         verify(jwtUtil, times(1)).generateToken(username, "");
     }

     @Test
     @DisplayName("Should handle register with admin role")
     void testRegisterAdminUser() {
         User adminUser = new User();
         adminUser.setUsername("admin");
         adminUser.setPassword("adminpass");
         adminUser.setRole("ADMIN");

         User savedAdmin = new User();
         savedAdmin.setId(30L);
         savedAdmin.setUsername("admin");
         savedAdmin.setPassword("encoded_admin");
         savedAdmin.setRole("ADMIN");

         when(userRepository.save(any(User.class))).thenReturn(savedAdmin);

         User result = authService.register(adminUser);

         assertEquals("ADMIN", result.getRole());
         verify(userRepository, times(1)).save(any(User.class));
     }

     @Test
     @DisplayName("Should handle login and return exact token")
     void testLoginReturnExactToken() {
         String username = "testuser";
         String password = "password123";
         String exactToken = "exact.jwt.token.string";

         BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
         User user = new User();
         user.setId(1L);
         user.setUsername(username);
         user.setPassword(encoder.encode(password));
         user.setRole("USER");

         when(userRepository.findByUsername(username)).thenReturn(Optional.of(user));
         when(jwtUtil.generateToken(username, "USER")).thenReturn(exactToken);

         String result = authService.login(username, password);

         assertEquals(exactToken, result);
     }

     @Test
     @DisplayName("Should verify repository.save called in register")
     void testRegisterCallsRepositorySave() {
         User userToRegister = new User();
         userToRegister.setUsername("savetest");
         userToRegister.setPassword("pass");
         userToRegister.setRole("USER");

         User savedUser = new User();
         savedUser.setId(40L);
         savedUser.setUsername("savetest");
         savedUser.setPassword("encoded");
         savedUser.setRole("USER");

         when(userRepository.save(any(User.class))).thenReturn(savedUser);

         authService.register(userToRegister);

         verify(userRepository, times(1)).save(any(User.class));
     }
}
