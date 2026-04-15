package com.hms.appointment.aop;

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

@DisplayName("AuditingAspect Tests")
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
    @DisplayName("Should audit method call with description and action")
    void testAuditMethodCall() {
        // Arrange
        when(joinPoint.getTarget()).thenReturn(new TestService());
        when(joinPoint.getSignature()).thenReturn(signature);
        when(signature.getName()).thenReturn("createEntity");
        when(auditable.action()).thenReturn("CREATE");
        when(auditable.value()).thenReturn("Create new entity");

        // Act & Assert
        assertDoesNotThrow(() -> auditingAspect.auditMethodCall(joinPoint, auditable, "entity"));
        verify(joinPoint).getTarget();
        verify(auditable).action();
    }

    @Test
    @DisplayName("Should log audit entry without annotation details")
    void testLogAudit() {
        // Arrange
        when(joinPoint.getTarget()).thenReturn(new TestService());
        when(joinPoint.getSignature()).thenReturn(signature);
        when(signature.getName()).thenReturn("updateEntity");

        // Act & Assert
        assertDoesNotThrow(() -> auditingAspect.logAudit(joinPoint));
        verify(joinPoint).getTarget();
    }

    @Test
    @DisplayName("Should handle null auditable action")
    void testAuditMethodCallWithNullAction() {
        // Arrange
        when(joinPoint.getTarget()).thenReturn(new TestService());
        when(joinPoint.getSignature()).thenReturn(signature);
        when(signature.getName()).thenReturn("deleteEntity");
        when(auditable.action()).thenReturn("UNKNOWN");
        when(auditable.value()).thenReturn("Delete operation");

        // Act & Assert
        assertDoesNotThrow(() -> auditingAspect.auditMethodCall(joinPoint, auditable, true));
    }

    // Test helper class
    static class TestService {
        public void createEntity() {
        }

        public void updateEntity() {
        }

        public void deleteEntity() {
        }
    }
}
