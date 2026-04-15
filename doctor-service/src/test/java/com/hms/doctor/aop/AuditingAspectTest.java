package com.hms.doctor.aop;

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

@DisplayName("Doctor AuditingAspect Tests")
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
    @DisplayName("Should audit doctor creation")
    void testAuditDoctorCreation() {
        // Arrange
        when(joinPoint.getTarget()).thenReturn(new TestDoctorService());
        when(joinPoint.getSignature()).thenReturn(signature);
        when(signature.getName()).thenReturn("createDoctor");
        when(auditable.action()).thenReturn("CREATE");
        when(auditable.value()).thenReturn("Doctor created");

        // Act & Assert
        assertDoesNotThrow(() -> auditingAspect.auditMethodCall(joinPoint, auditable, "doctor"));
    }

    @Test
    @DisplayName("Should audit doctor update")
    void testAuditDoctorUpdate() {
        // Arrange
        when(joinPoint.getTarget()).thenReturn(new TestDoctorService());
        when(joinPoint.getSignature()).thenReturn(signature);
        when(signature.getName()).thenReturn("updateDoctor");

        // Act & Assert
        assertDoesNotThrow(() -> auditingAspect.logAudit(joinPoint));
    }

    // Test helper class
    static class TestDoctorService {
        public void createDoctor() {
        }

        public void updateDoctor(Long id) {
        }
    }
}
