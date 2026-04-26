package com.hms.auth.controller;

import com.hms.auth.dto.AuthRequest;
import com.hms.auth.dto.AuthResponse;
import com.hms.auth.dto.RegisterRequest;
import com.hms.auth.dto.RefreshRequest;
import com.hms.auth.dto.UserResponse;
import com.hms.auth.security.JwtUtil;
import com.hms.auth.service.AuthService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.junit.jupiter.api.extension.ExtendWith;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@DisplayName("AuthController unit tests (no Spring)")
@ExtendWith(MockitoExtension.class)
class AuthControllerUnitTest {

    @InjectMocks
    private AuthController controller;

    @Mock
    private AuthService authService;

    @Mock
    private JwtUtil jwtUtil;

    @Test
    void testRegisterReturnsCreated() {
        RegisterRequest req = new RegisterRequest();
        req.setUsername("u"); req.setPassword("p"); req.setRole("PATIENT");
        when(authService.register(req, null)).thenReturn(new UserResponse(1L, "u", "PATIENT"));

        var resp = controller.register(req, null);
        assertEquals(201, resp.getStatusCodeValue());
        assertNotNull(resp.getBody());
        assertEquals("u", resp.getBody().getUsername());
    }

    @Test
    void testValidateMissingHeader() {
        var resp = controller.validate(null);
        assertEquals(401, resp.getStatusCodeValue());
        assertEquals("Missing or invalid Authorization header", resp.getBody());
    }

    @Test
    void testValidateValidToken() {
        when(jwtUtil.extractUsername("tok")).thenReturn("alice");
        when(jwtUtil.extractRole("tok")).thenReturn("PATIENT");

        var resp = controller.validate("Bearer tok");
        assertEquals(200, resp.getStatusCodeValue());
        @SuppressWarnings("unchecked")
        Map<String, String> body = (Map<String, String>) resp.getBody();
        assertEquals("alice", body.get("username"));
        assertEquals("PATIENT", body.get("role"));
        assertEquals("valid", body.get("status"));
    }

    @Test
    void testLogoutNoContent() {
        RefreshRequest r = new RefreshRequest();
        r.setRefreshToken("rt");
        var resp = controller.logout(r);
        assertEquals(204, resp.getStatusCodeValue());
        verify(authService, times(1)).logout("rt");
    }

    @Test
    void testVerifySuccess() {
        when(authService.verifyCode(1L, "123")).thenReturn(true);
        var resp = controller.verify(1L, "123");
        assertEquals(200, resp.getStatusCodeValue());
    }

    @Test
    void testVerifyFailure() {
        when(authService.verifyCode(1L, "wrong")).thenReturn(false);
        var resp = controller.verify(1L, "wrong");
        assertEquals(400, resp.getStatusCodeValue());
    }

    @Test
    void testAdminVerify() {
        var resp = controller.adminVerify(1L);
        assertEquals(200, resp.getStatusCodeValue());
        verify(authService).adminVerifyUser(1L);
    }

    @Test
    void testDebugListUsers() {
        var resp = controller.debugListUsers();
        assertEquals(200, resp.getStatusCodeValue());
        verify(authService).debugListUsers();
    }

    @Test
    void testDeleteUser() {
        var resp = controller.deleteUser("bob");
        assertEquals(200, resp.getStatusCodeValue());
        verify(authService).deleteUserByUsername("bob");
    }

    @Test
    void testSuperReset() {
        var resp = controller.superReset("pass");
        assertEquals(200, resp.getStatusCodeValue());
        verify(authService).resetAllPasswords("pass");
    }
}
