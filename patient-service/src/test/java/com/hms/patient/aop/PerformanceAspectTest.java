package com.hms.patient.aop;

import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.Signature;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import static org.mockito.Mockito.*;
import static org.junit.jupiter.api.Assertions.*;

@DisplayName("Patient PerformanceAspect Tests")
class PerformanceAspectTest {

    @InjectMocks
    private PerformanceAspect performanceAspect;

    @Mock
    private ProceedingJoinPoint joinPoint;

    @Mock
    private Signature signature;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    @DisplayName("Should monitor patient query performance")
    void testMonitorPatientQueryPerformance() throws Throwable {
        // Arrange
        when(joinPoint.getTarget()).thenReturn(new TestPatientService());
        when(joinPoint.getSignature()).thenReturn(signature);
        when(signature.getName()).thenReturn("getAllPatients");
        when(joinPoint.proceed()).thenReturn("patients");

        // Act
        Object result = performanceAspect.monitorPerformance(joinPoint);

        // Assert
        assertEquals("patients", result);
        verify(joinPoint).proceed();
    }

    @Test
    @DisplayName("Should warn on slow patient query")
    void testSlowPatientQueryWarning() throws Throwable {
        // Arrange
        when(joinPoint.getTarget()).thenReturn(new TestPatientService());
        when(joinPoint.getSignature()).thenReturn(signature);
        when(signature.getName()).thenReturn("getAllPatients");
        when(joinPoint.proceed()).thenAnswer(invocation -> {
            Thread.sleep(1100);
            return "patients";
        });

        // Act
        Object result = performanceAspect.monitorPerformance(joinPoint);

        // Assert
        assertEquals("patients", result);
    }

    @Test
    @DisplayName("Should handle patient query error")
    void testPatientQueryError() throws Throwable {
        // Arrange
        when(joinPoint.getTarget()).thenReturn(new TestPatientService());
        when(joinPoint.getSignature()).thenReturn(signature);
        when(signature.getName()).thenReturn("getPatientById");
        when(joinPoint.proceed()).thenThrow(new RuntimeException("Database error"));

        // Act & Assert
        assertThrows(RuntimeException.class, () -> performanceAspect.monitorPerformance(joinPoint));
    }

    // Test helper class
    static class TestPatientService {
        public String getAllPatients() {
            return "patients";
        }

        public String getPatientById(Long id) {
            return "patient";
        }
    }
}
