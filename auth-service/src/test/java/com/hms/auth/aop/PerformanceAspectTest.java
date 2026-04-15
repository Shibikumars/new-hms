package com.hms.auth.aop;

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

@DisplayName("Auth PerformanceAspect Tests")
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
    @DisplayName("Should monitor authentication performance")
    void testMonitorAuthenticationPerformance() throws Throwable {
        // Arrange
        when(joinPoint.getTarget()).thenReturn(new TestAuthService());
        when(joinPoint.getSignature()).thenReturn(signature);
        when(signature.getName()).thenReturn("authenticate");
        when(joinPoint.proceed()).thenReturn("token");

        // Act
        Object result = performanceAspect.monitorPerformance(joinPoint);

        // Assert
        assertEquals("token", result);
        verify(joinPoint).proceed();
    }

    @Test
    @DisplayName("Should warn on slow authentication")
    void testSlowAuthenticationWarning() throws Throwable {
        // Arrange
        when(joinPoint.getTarget()).thenReturn(new TestAuthService());
        when(joinPoint.getSignature()).thenReturn(signature);
        when(signature.getName()).thenReturn("authenticate");
        when(joinPoint.proceed()).thenAnswer(invocation -> {
            Thread.sleep(1100);
            return "token";
        });

        // Act
        Object result = performanceAspect.monitorPerformance(joinPoint);

        // Assert
        assertEquals("token", result);
    }

    @Test
    @DisplayName("Should handle authentication error with timing")
    void testAuthenticationErrorTiming() throws Throwable {
        // Arrange
        when(joinPoint.getTarget()).thenReturn(new TestAuthService());
        when(joinPoint.getSignature()).thenReturn(signature);
        when(signature.getName()).thenReturn("authenticate");
        when(joinPoint.proceed()).thenThrow(new RuntimeException("Auth failed"));

        // Act & Assert
        assertThrows(RuntimeException.class, () -> performanceAspect.monitorPerformance(joinPoint));
    }

    // Test helper class
    static class TestAuthService {
        public String authenticate(String username, String password) {
            return "token";
        }
    }
}
