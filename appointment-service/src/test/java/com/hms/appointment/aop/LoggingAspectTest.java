package com.hms.appointment.aop;

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

@DisplayName("LoggingAspect Tests")
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
    @DisplayName("Should log method execution successfully")
    void testLogMethodExecutionSuccess() throws Throwable {
        // Arrange
        when(joinPoint.getTarget()).thenReturn(new TestService());
        when(joinPoint.getSignature()).thenReturn(signature);
        when(signature.getName()).thenReturn("testMethod");
        when(joinPoint.getArgs()).thenReturn(new Object[]{"arg1", "arg2"});
        when(joinPoint.proceed()).thenReturn("result");

        // Act
        Object result = loggingAspect.logMethodExecution(joinPoint);

        // Assert
        assertEquals("result", result);
        verify(joinPoint).proceed();
    }

    @Test
    @DisplayName("Should handle exception in method execution")
    void testLogMethodExecutionException() throws Throwable {
        // Arrange
        when(joinPoint.getTarget()).thenReturn(new TestService());
        when(joinPoint.getSignature()).thenReturn(signature);
        when(signature.getName()).thenReturn("testMethod");
        when(joinPoint.getArgs()).thenReturn(new Object[]{"arg1"});
        when(joinPoint.proceed()).thenThrow(new RuntimeException("Test exception"));

        // Act & Assert
        assertThrows(RuntimeException.class, () -> loggingAspect.logMethodExecution(joinPoint));
        verify(joinPoint).proceed();
    }

    @Test
    @DisplayName("Should log controller method entry")
    void testLogControllerMethodEntry() {
        // Arrange
        when(joinPoint.getTarget()).thenReturn(new TestController());
        when(joinPoint.getSignature()).thenReturn(signature);
        when(signature.getName()).thenReturn("getAll");
        when(joinPoint.getArgs()).thenReturn(new Object[0]);

        // Act & Assert
        assertDoesNotThrow(() -> loggingAspect.logControllerMethodEntry(joinPoint));
        verify(joinPoint).getTarget();
    }

    @Test
    @DisplayName("Should log controller method exit")
    void testLogControllerMethodExit() {
        // Arrange
        when(joinPoint.getTarget()).thenReturn(new TestController());
        when(joinPoint.getSignature()).thenReturn(signature);
        when(signature.getName()).thenReturn("getAll");

        // Act & Assert
        assertDoesNotThrow(() -> loggingAspect.logControllerMethodExit(joinPoint, "result"));
        verify(joinPoint).getTarget();
    }

    @Test
    @DisplayName("Should log controller method exception")
    void testLogControllerMethodException() {
        // Arrange
        when(joinPoint.getTarget()).thenReturn(new TestController());
        when(joinPoint.getSignature()).thenReturn(signature);
        when(signature.getName()).thenReturn("getAll");
        Exception exception = new RuntimeException("Test error");

        // Act & Assert
        assertDoesNotThrow(() -> loggingAspect.logControllerMethodException(joinPoint, exception));
        verify(joinPoint).getTarget();
    }

    // Test helper classes
    static class TestService {
        public String testMethod(String arg1, String arg2) {
            return "result";
        }
    }

    static class TestController {
        public Object getAll() {
            return "list";
        }
    }
}
