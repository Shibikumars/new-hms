package com.hms.gateway.aop;

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

@DisplayName("GatewayPerformanceAspect Tests")
class GatewayPerformanceAspectTest {

    @InjectMocks
    private GatewayPerformanceAspect gatewayPerformanceAspect;

    @Mock
    private ProceedingJoinPoint joinPoint;

    @Mock
    private Signature signature;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    @DisplayName("Should monitor gateway routing performance")
    void testMonitorGatewayRoutingPerformance() throws Throwable {
        // Arrange
        when(joinPoint.getTarget()).thenReturn(new TestGatewayService());
        when(joinPoint.getSignature()).thenReturn(signature);
        when(signature.getName()).thenReturn("routeRequest");
        when(joinPoint.proceed()).thenReturn("routed");

        // Act
        Object result = gatewayPerformanceAspect.monitorGatewayPerformance(joinPoint);

        // Assert
        assertEquals("routed", result);
        verify(joinPoint).proceed();
    }

    @Test
    @DisplayName("Should warn on slow gateway operation")
    void testSlowGatewayOperationWarning() throws Throwable {
        // Arrange
        when(joinPoint.getTarget()).thenReturn(new TestGatewayService());
        when(joinPoint.getSignature()).thenReturn(signature);
        when(signature.getName()).thenReturn("routeRequest");
        when(joinPoint.proceed()).thenAnswer(invocation -> {
            Thread.sleep(2100); // Greater than 2000ms threshold for gateway
            return "routed";
        });

        // Act
        Object result = gatewayPerformanceAspect.monitorGatewayPerformance(joinPoint);

        // Assert
        assertEquals("routed", result);
    }

    @Test
    @DisplayName("Should handle gateway routing error")
    void testGatewayRoutingError() throws Throwable {
        // Arrange
        when(joinPoint.getTarget()).thenReturn(new TestGatewayService());
        when(joinPoint.getSignature()).thenReturn(signature);
        when(signature.getName()).thenReturn("routeRequest");
        when(joinPoint.proceed()).thenThrow(new RuntimeException("Routing failed"));

        // Act & Assert
        assertThrows(RuntimeException.class, () -> gatewayPerformanceAspect.monitorGatewayPerformance(joinPoint));
    }

    @Test
    @DisplayName("Should monitor fast gateway operation")
    void testFastGatewayOperation() throws Throwable {
        // Arrange
        when(joinPoint.getTarget()).thenReturn(new TestGatewayService());
        when(joinPoint.getSignature()).thenReturn(signature);
        when(signature.getName()).thenReturn("validateToken");
        when(joinPoint.proceed()).thenReturn("valid");

        // Act
        Object result = gatewayPerformanceAspect.monitorGatewayPerformance(joinPoint);

        // Assert
        assertEquals("valid", result);
    }

    // Test helper class
    static class TestGatewayService {
        public String routeRequest(String path) {
            return "routed";
        }

        public String validateToken(String token) {
            return "valid";
        }
    }
}
