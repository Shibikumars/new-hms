package com.hms.lab.aop;

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

@DisplayName("Lab AuditingAspect Tests")
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
    @DisplayName("Should audit lab test creation")
    void testAuditLabTestCreation() {
        // Arrange
        when(joinPoint.getTarget()).thenReturn(new TestLabService());
        when(joinPoint.getSignature()).thenReturn(signature);
        when(signature.getName()).thenReturn("addTest");
        when(auditable.action()).thenReturn("CREATE");
        when(auditable.value()).thenReturn("Lab test created");

        // Act & Assert
        assertDoesNotThrow(() -> auditingAspect.auditMethodCall(joinPoint, auditable, "test"));
    }

    @Test
    @DisplayName("Should audit report generation")
    void testAuditReportGeneration() {
        // Arrange
        when(joinPoint.getTarget()).thenReturn(new TestLabService());
        when(joinPoint.getSignature()).thenReturn(signature);
        when(signature.getName()).thenReturn("generateReport");

        // Act & Assert
        assertDoesNotThrow(() -> auditingAspect.logAudit(joinPoint));
    }

    // Test helper class
    static class TestLabService {
        public void addTest() {
        }

        public void generateReport(Long reportId) {
        }
    }
}
