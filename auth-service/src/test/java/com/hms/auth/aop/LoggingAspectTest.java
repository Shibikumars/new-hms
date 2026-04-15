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

@DisplayName("Auth LoggingAspect Tests")
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
    @DisplayName("Should log method execution with arguments")
    void testLogMethodExecutionWithArguments() throws Throwable {
        // Arrange
        when(joinPoint.getTarget()).thenReturn(new TestAuthService());
        when(joinPoint.getSignature()).thenReturn(signature);
        when(signature.getName()).thenReturn("authenticate");
        when(joinPoint.getArgs()).thenReturn(new Object[]{"user", "password"});
        when(joinPoint.proceed()).thenReturn("token");

        // Act
        Object result = loggingAspect.logMethodExecution(joinPoint);

        // Assert
        assertEquals("token", result);
        verify(joinPoint).proceed();
    }

    @Test
    @DisplayName("Should log authentication method entry")
    void testLogAuthMethodEntry() {
        // Arrange
        when(joinPoint.getTarget()).thenReturn(new TestAuthController());
        when(joinPoint.getSignature()).thenReturn(signature);
        when(signature.getName()).thenReturn("login");
        when(joinPoint.getArgs()).thenReturn(new Object[]{"username", "password"});

        // Act & Assert
        assertDoesNotThrow(() -> loggingAspect.logControllerMethodEntry(joinPoint));
    }

    @Test
    @DisplayName("Should log authentication success")
    void testLogAuthSuccess() {
        // Arrange
        when(joinPoint.getTarget()).thenReturn(new TestAuthController());
        when(joinPoint.getSignature()).thenReturn(signature);
        when(signature.getName()).thenReturn("login");

        // Act & Assert
        assertDoesNotThrow(() -> loggingAspect.logControllerMethodExit(joinPoint, "token"));
    }

    @Test
    @DisplayName("Should log authentication failure")
    void testLogAuthFailure() {
        // Arrange
        when(joinPoint.getTarget()).thenReturn(new TestAuthController());
        when(joinPoint.getSignature()).thenReturn(signature);
        when(signature.getName()).thenReturn("login");
        Exception exception = new RuntimeException("Invalid credentials");

        // Act & Assert
        assertDoesNotThrow(() -> loggingAspect.logControllerMethodException(joinPoint, exception));
    }

    // Test helper classes
    static class TestAuthService {
        public String authenticate(String username, String password) {
            return "token";
        }
    }

    static class TestAuthController {
        public String login(String username, String password) {
            return "token";
        }
    }
}
