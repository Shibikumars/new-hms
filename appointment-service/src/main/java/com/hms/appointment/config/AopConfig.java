package com.hms.appointment.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.EnableAspectJAutoProxy;

/**
 * AOP Configuration for appointment-service.
 * Enables AspectJ proxy creation for all beans.
 */
@Configuration
@EnableAspectJAutoProxy(proxyTargetClass = true)
public class AopConfig {
    // AspectJ auto proxy is enabled globally
    // All @Aspect annotated beans will be automatically applied
}
