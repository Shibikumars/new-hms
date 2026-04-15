package com.hms.lab.config;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.ApplicationContext;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@DisplayName("Lab AopConfig Tests")
class AopConfigTest {

    @Autowired
    private ApplicationContext applicationContext;

    @Test
    @DisplayName("Should load lab AopConfig")
    void testLabAopConfigLoads() {
        // Act & Assert
        AopConfig aopConfig = applicationContext.getBean(AopConfig.class);
        assertNotNull(aopConfig);
    }

    @Test
    @DisplayName("Should register lab AopConfig bean")
    void testLabAopConfigBeanRegistered() {
        // Act & Assert
        assertTrue(applicationContext.containsBean("aopConfig"));
    }
}
