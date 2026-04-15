package com.hms.lab.aop;

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

@DisplayName("Lab LoggingAspect Tests")
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
    @DisplayName("Should log lab test execution")
    void testLogLabTestExecution() throws Throwable {
        // Arrange
        when(joinPoint.getTarget()).thenReturn(new TestLabService());
        when(joinPoint.getSignature()).thenReturn(signature);
        when(signature.getName()).thenReturn("processTest");
        when(joinPoint.getArgs()).thenReturn(new Object[]{1L});
        when(joinPoint.proceed()).thenReturn("test_result");

        // Act
        Object result = loggingAspect.logMethodExecution(joinPoint);

        // Assert
        assertEquals("test_result", result);
        verify(joinPoint).proceed();
    }

    @Test
    @DisplayName("Should log lab controller entry")
    void testLogLabControllerEntry() {
        // Arrange
        when(joinPoint.getTarget()).thenReturn(new TestLabController());
        when(joinPoint.getSignature()).thenReturn(signature);
        when(signature.getName()).thenReturn("getAllTests");
        when(joinPoint.getArgs()).thenReturn(new Object[0]);

        // Act & Assert
        assertDoesNotThrow(() -> loggingAspect.logControllerMethodEntry(joinPoint));
    }

    @Test
    @DisplayName("Should log lab report exit")
    void testLogLabReportExit() {
        // Arrange
        when(joinPoint.getTarget()).thenReturn(new TestLabController());
        when(joinPoint.getSignature()).thenReturn(signature);
        when(signature.getName()).thenReturn("getReport");

        // Act & Assert
        assertDoesNotThrow(() -> loggingAspect.logControllerMethodExit(joinPoint, "report"));
    }

    @Test
    @DisplayName("Should log lab error")
    void testLogLabError() {
        // Arrange
        when(joinPoint.getTarget()).thenReturn(new TestLabController());
        when(joinPoint.getSignature()).thenReturn(signature);
        when(signature.getName()).thenReturn("processTest");
        Exception exception = new RuntimeException("Test processing failed");

        // Act & Assert
        assertDoesNotThrow(() -> loggingAspect.logControllerMethodException(joinPoint, exception));
    }

    // Test helper classes
    static class TestLabService {
        public String processTest(Long testId) {
            return "test_result";
        }
    }

    static class TestLabController {
        public String getAllTests() {
            return "tests";
        }

        public String getReport(Long reportId) {
            return "report";
        }

        public void processTest(Long testId) {
        }
    }
}
