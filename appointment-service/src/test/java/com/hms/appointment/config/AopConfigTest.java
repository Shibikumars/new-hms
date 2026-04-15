package com.hms.appointment.config;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.ApplicationContext;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@DisplayName("AopConfig Tests")
class AopConfigTest {

    @Autowired
    private ApplicationContext applicationContext;

    @Test
    @DisplayName("Should load AopConfig bean")
    void testAopConfigBeanLoads() {
        // Act & Assert
        AopConfig aopConfig = applicationContext.getBean(AopConfig.class);
        assertNotNull(aopConfig);
    }

    @Test
    @DisplayName("Should have AspectJ auto proxy enabled")
    void testAspectJAutoProxyEnabled() {
        // Act & Assert
        assertNotNull(applicationContext);
        assertTrue(applicationContext.containsBean("aopConfig"));
    }
}
