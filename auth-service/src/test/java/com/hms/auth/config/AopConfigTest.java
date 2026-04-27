package com.hms.auth.config;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.ApplicationContext;
import org.springframework.test.context.ActiveProfiles;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(properties = "hms.security.jwt.secret=test_secret_123456789012345678901234")
@ActiveProfiles("test")
@DisplayName("Auth AopConfig Tests")
class AopConfigTest {

    @Autowired
    private ApplicationContext applicationContext;

    @Test
    @DisplayName("Should load auth AopConfig")
    void testAuthAopConfigLoads() {
        // Act & Assert
        AopConfig aopConfig = applicationContext.getBean(AopConfig.class);
        assertNotNull(aopConfig);
    }

    @Test
    @DisplayName("Should register AopConfig bean")
    void testAopConfigBeanRegistered() {
        // Act & Assert
        assertTrue(applicationContext.containsBean("aopConfig"));
    }
}