package com.hms.patient.config;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.ApplicationContext;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@DisplayName("Patient AopConfig Tests")
class AopConfigTest {

    @Autowired
    private ApplicationContext applicationContext;

    @Test
    @DisplayName("Should load patient AopConfig")
    void testPatientAopConfigLoads() {
        // Act & Assert
        AopConfig aopConfig = applicationContext.getBean(AopConfig.class);
        assertNotNull(aopConfig);
    }

    @Test
    @DisplayName("Should register patient AopConfig bean")
    void testPatientAopConfigBeanRegistered() {
        // Act & Assert
        assertTrue(applicationContext.containsBean("aopConfig"));
    }
}
