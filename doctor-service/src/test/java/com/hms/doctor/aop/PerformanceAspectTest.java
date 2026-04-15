package com.hms.doctor.aop;

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

@DisplayName("Doctor PerformanceAspect Tests")
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
    @DisplayName("Should monitor doctor query performance")
    void testMonitorDoctorQueryPerformance() throws Throwable {
        // Arrange
        when(joinPoint.getTarget()).thenReturn(new TestDoctorService());
        when(joinPoint.getSignature()).thenReturn(signature);
        when(signature.getName()).thenReturn("getAllDoctors");
        when(joinPoint.proceed()).thenReturn("doctors");

        // Act
        Object result = performanceAspect.monitorPerformance(joinPoint);

        // Assert
        assertEquals("doctors", result);
        verify(joinPoint).proceed();
    }

    @Test
    @DisplayName("Should warn on slow doctor query")
    void testSlowDoctorQueryWarning() throws Throwable {
        // Arrange
        when(joinPoint.getTarget()).thenReturn(new TestDoctorService());
        when(joinPoint.getSignature()).thenReturn(signature);
        when(signature.getName()).thenReturn("getAllDoctors");
        when(joinPoint.proceed()).thenAnswer(invocation -> {
            Thread.sleep(1100);
            return "doctors";
        });

        // Act
        Object result = performanceAspect.monitorPerformance(joinPoint);

        // Assert
        assertEquals("doctors", result);
    }

    @Test
    @DisplayName("Should handle doctor query error")
    void testDoctorQueryError() throws Throwable {
        // Arrange
        when(joinPoint.getTarget()).thenReturn(new TestDoctorService());
        when(joinPoint.getSignature()).thenReturn(signature);
        when(signature.getName()).thenReturn("getDoctorById");
        when(joinPoint.proceed()).thenThrow(new RuntimeException("Database error"));

        // Act & Assert
        assertThrows(RuntimeException.class, () -> performanceAspect.monitorPerformance(joinPoint));
    }

    // Test helper class
    static class TestDoctorService {
        public String getAllDoctors() {
            return "doctors";
        }

        public String getDoctorById(Long id) {
            return "doctor";
        }
    }
}
