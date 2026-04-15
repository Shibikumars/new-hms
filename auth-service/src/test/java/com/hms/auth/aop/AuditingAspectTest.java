package com.hms.auth.aop;

import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.Signature;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import static org.mockito.Mockito.*;
import static org.junit.jupiter.api.Assertions.*;

@DisplayName("Auth AuditingAspect Tests")
class AuditingAspectTest {

    @InjectMocks
    private AuditingAspect auditingAspect;

    @Mock
    private JoinPoint joinPoint;

    @Mock
    private Signature signature;

    @Mock
    private Auditable auditable;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    @DisplayName("Should audit user registration")
    void testAuditUserRegistration() {
        // Arrange
        when(joinPoint.getTarget()).thenReturn(new TestAuthService());
        when(joinPoint.getSignature()).thenReturn(signature);
        when(signature.getName()).thenReturn("register");
        when(auditable.action()).thenReturn("CREATE");
        when(auditable.value()).thenReturn("User registered");

        // Act & Assert
        assertDoesNotThrow(() -> auditingAspect.auditMethodCall(joinPoint, auditable, "user"));
    }

    @Test
    @DisplayName("Should log authentication audit")
    void testLogAuthenticationAudit() {
        // Arrange
        when(joinPoint.getTarget()).thenReturn(new TestAuthService());
        when(joinPoint.getSignature()).thenReturn(signature);
        when(signature.getName()).thenReturn("authenticate");

        // Act & Assert
        assertDoesNotThrow(() -> auditingAspect.logAudit(joinPoint));
    }

    // Test helper class
    static class TestAuthService {
        public void register(String username, String password) {
        }

        public void authenticate(String username, String password) {
        }
    }
}
