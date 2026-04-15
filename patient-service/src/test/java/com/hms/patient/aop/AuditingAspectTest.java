package com.hms.patient.aop;

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

@DisplayName("Patient AuditingAspect Tests")
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
    @DisplayName("Should audit patient creation")
    void testAuditPatientCreation() {
        // Arrange
        when(joinPoint.getTarget()).thenReturn(new TestPatientService());
        when(joinPoint.getSignature()).thenReturn(signature);
        when(signature.getName()).thenReturn("createPatient");
        when(auditable.action()).thenReturn("CREATE");
        when(auditable.value()).thenReturn("Patient created");

        // Act & Assert
        assertDoesNotThrow(() -> auditingAspect.auditMethodCall(joinPoint, auditable, "patient"));
    }

    @Test
    @DisplayName("Should audit patient update")
    void testAuditPatientUpdate() {
        // Arrange
        when(joinPoint.getTarget()).thenReturn(new TestPatientService());
        when(joinPoint.getSignature()).thenReturn(signature);
        when(signature.getName()).thenReturn("updatePatient");

        // Act & Assert
        assertDoesNotThrow(() -> auditingAspect.logAudit(joinPoint));
    }

    // Test helper class
    static class TestPatientService {
        public void createPatient() {
        }

        public void updatePatient(Long id) {
        }
    }
}
