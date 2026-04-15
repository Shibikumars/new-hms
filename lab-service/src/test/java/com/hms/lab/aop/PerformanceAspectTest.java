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

@DisplayName("Lab PerformanceAspect Tests")
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
    @DisplayName("Should monitor lab test performance")
    void testMonitorLabTestPerformance() throws Throwable {
        // Arrange
        when(joinPoint.getTarget()).thenReturn(new TestLabService());
        when(joinPoint.getSignature()).thenReturn(signature);
        when(signature.getName()).thenReturn("processTest");
        when(joinPoint.proceed()).thenReturn("result");

        // Act
        Object result = performanceAspect.monitorPerformance(joinPoint);

        // Assert
        assertEquals("result", result);
        verify(joinPoint).proceed();
    }

    @Test
    @DisplayName("Should warn on slow lab test processing")
    void testSlowLabProcessingWarning() throws Throwable {
        // Arrange
        when(joinPoint.getTarget()).thenReturn(new TestLabService());
        when(joinPoint.getSignature()).thenReturn(signature);
        when(signature.getName()).thenReturn("generateReport");
        when(joinPoint.proceed()).thenAnswer(invocation -> {
            Thread.sleep(1100);
            return "report";
        });

        // Act
        Object result = performanceAspect.monitorPerformance(joinPoint);

        // Assert
        assertEquals("report", result);
    }

    @Test
    @DisplayName("Should handle lab error with timing")
    void testLabErrorTiming() throws Throwable {
        // Arrange
        when(joinPoint.getTarget()).thenReturn(new TestLabService());
        when(joinPoint.getSignature()).thenReturn(signature);
        when(signature.getName()).thenReturn("processTest");
        when(joinPoint.proceed()).thenThrow(new RuntimeException("Processing failed"));

        // Act & Assert
        assertThrows(RuntimeException.class, () -> performanceAspect.monitorPerformance(joinPoint));
    }

    // Test helper class
    static class TestLabService {
        public String processTest(Long testId) {
            return "result";
        }

        public String generateReport(Long reportId) {
            return "report";
        }
    }
}
