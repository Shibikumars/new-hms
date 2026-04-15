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

@DisplayName("Patient LoggingAspect Tests")
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
    @DisplayName("Should log patient method execution")
    void testLogPatientMethodExecution() throws Throwable {
        // Arrange
        when(joinPoint.getTarget()).thenReturn(new TestPatientService());
        when(joinPoint.getSignature()).thenReturn(signature);
        when(signature.getName()).thenReturn("getPatientById");
        when(joinPoint.getArgs()).thenReturn(new Object[]{1L});
        when(joinPoint.proceed()).thenReturn("patient");

        // Act
        Object result = loggingAspect.logMethodExecution(joinPoint);

        // Assert
        assertEquals("patient", result);
        verify(joinPoint).proceed();
    }

    @Test
    @DisplayName("Should log patient controller entry")
    void testLogPatientControllerEntry() {
        // Arrange
        when(joinPoint.getTarget()).thenReturn(new TestPatientController());
        when(joinPoint.getSignature()).thenReturn(signature);
        when(signature.getName()).thenReturn("getAllPatients");
        when(joinPoint.getArgs()).thenReturn(new Object[0]);

        // Act & Assert
        assertDoesNotThrow(() -> loggingAspect.logControllerMethodEntry(joinPoint));
    }

    @Test
    @DisplayName("Should log patient controller exit")
    void testLogPatientControllerExit() {
        // Arrange
        when(joinPoint.getTarget()).thenReturn(new TestPatientController());
        when(joinPoint.getSignature()).thenReturn(signature);
        when(signature.getName()).thenReturn("getAllPatients");

        // Act & Assert
        assertDoesNotThrow(() -> loggingAspect.logControllerMethodExit(joinPoint, "patients"));
    }

    @Test
    @DisplayName("Should log patient controller exception")
    void testLogPatientControllerException() {
        // Arrange
        when(joinPoint.getTarget()).thenReturn(new TestPatientController());
        when(joinPoint.getSignature()).thenReturn(signature);
        when(signature.getName()).thenReturn("getPatientById");
        Exception exception = new RuntimeException("Patient not found");

        // Act & Assert
        assertDoesNotThrow(() -> loggingAspect.logControllerMethodException(joinPoint, exception));
    }

    // Test helper classes
    static class TestPatientService {
        public String getPatientById(Long id) {
            return "patient";
        }
    }

    static class TestPatientController {
        public String getAllPatients() {
            return "patients";
        }

        public String getPatientById(Long id) {
            return "patient";
        }
    }
}
