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

@DisplayName("PerformanceAspect Tests")
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
    @DisplayName("Should monitor fast method execution")
    void testMonitorFastMethodExecution() throws Throwable {
        // Arrange
        when(joinPoint.getTarget()).thenReturn(new TestService());
        when(joinPoint.getSignature()).thenReturn(signature);
        when(signature.getName()).thenReturn("fastMethod");
        when(joinPoint.proceed()).thenReturn("result");

        // Act
        Object result = performanceAspect.monitorPerformance(joinPoint);

        // Assert
        assertEquals("result", result);
        verify(joinPoint).proceed();
    }

    @Test
    @DisplayName("Should monitor and warn about slow method execution")
    void testMonitorSlowMethodExecution() throws Throwable {
        // Arrange
        when(joinPoint.getTarget()).thenReturn(new SlowTestService());
        when(joinPoint.getSignature()).thenReturn(signature);
        when(signature.getName()).thenReturn("slowMethod");
        when(joinPoint.proceed()).thenAnswer(invocation -> {
            Thread.sleep(1100); // Simulate slow execution
            return "result";
        });

        // Act
        Object result = performanceAspect.monitorPerformance(joinPoint);

        // Assert
        assertEquals("result", result);
        verify(joinPoint).proceed();
    }

    @Test
    @DisplayName("Should handle exception in monitored method")
    void testMonitorPerformanceException() throws Throwable {
        // Arrange
        when(joinPoint.getTarget()).thenReturn(new TestService());
        when(joinPoint.getSignature()).thenReturn(signature);
        when(signature.getName()).thenReturn("method");
        when(joinPoint.proceed()).thenThrow(new RuntimeException("Test error"));

        // Act & Assert
        assertThrows(RuntimeException.class, () -> performanceAspect.monitorPerformance(joinPoint));
        verify(joinPoint).proceed();
    }

    // Test helper classes
    static class TestService {
        public String fastMethod() {
            return "result";
        }
    }

    static class SlowTestService {
        public String slowMethod() throws InterruptedException {
            Thread.sleep(100);
            return "result";
        }
    }
}
