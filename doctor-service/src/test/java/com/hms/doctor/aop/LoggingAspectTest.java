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

@DisplayName("Doctor LoggingAspect Tests")
class LoggingAspectTest {

    @InjectMocks
    private LoggingAspect loggingAspect;

    @Mock
    private ProceedingJoinPoint joinPoint;

    @Mock
    private Signature signature;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    @DisplayName("Should log doctor method execution")
    void testLogDoctorMethodExecution() throws Throwable {
        // Arrange
        when(joinPoint.getTarget()).thenReturn(new TestDoctorService());
        when(joinPoint.getSignature()).thenReturn(signature);
        when(signature.getName()).thenReturn("getDoctorById");
        when(joinPoint.getArgs()).thenReturn(new Object[]{1L});
        when(joinPoint.proceed()).thenReturn("doctor");

        // Act
        Object result = loggingAspect.logMethodExecution(joinPoint);

        // Assert
        assertEquals("doctor", result);
        verify(joinPoint).proceed();
    }

    @Test
    @DisplayName("Should log doctor controller entry")
    void testLogDoctorControllerEntry() {
        // Arrange
        when(joinPoint.getTarget()).thenReturn(new TestDoctorController());
        when(joinPoint.getSignature()).thenReturn(signature);
        when(signature.getName()).thenReturn("getAllDoctors");
        when(joinPoint.getArgs()).thenReturn(new Object[0]);

        // Act & Assert
        assertDoesNotThrow(() -> loggingAspect.logControllerMethodEntry(joinPoint));
    }

    @Test
    @DisplayName("Should log doctor controller exit")
    void testLogDoctorControllerExit() {
        // Arrange
        when(joinPoint.getTarget()).thenReturn(new TestDoctorController());
        when(joinPoint.getSignature()).thenReturn(signature);
        when(signature.getName()).thenReturn("getAllDoctors");

        // Act & Assert
        assertDoesNotThrow(() -> loggingAspect.logControllerMethodExit(joinPoint, "doctors"));
    }

    @Test
    @DisplayName("Should log doctor controller exception")
    void testLogDoctorControllerException() {
        // Arrange
        when(joinPoint.getTarget()).thenReturn(new TestDoctorController());
        when(joinPoint.getSignature()).thenReturn(signature);
        when(signature.getName()).thenReturn("getDoctorById");
        Exception exception = new RuntimeException("Doctor not found");

        // Act & Assert
        assertDoesNotThrow(() -> loggingAspect.logControllerMethodException(joinPoint, exception));
    }

    // Test helper classes
    static class TestDoctorService {
        public String getDoctorById(Long id) {
            return "doctor";
        }
    }

    static class TestDoctorController {
        public String getAllDoctors() {
            return "doctors";
        }

        public String getDoctorById(Long id) {
            return "doctor";
        }
    }
}
