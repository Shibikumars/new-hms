package com.hms.appointment.aop;

import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

/**
 * Performance Monitoring Aspect for appointment-service.
 * Tracks execution time of methods marked with @Monitored annotation.
 */
@Aspect
@Component
public class PerformanceAspect {

    private static final Logger logger = LoggerFactory.getLogger(PerformanceAspect.class);
    private static final long SLOW_THRESHOLD_MS = 1000; // 1 second

    /**
     * Monitor execution time for methods marked with @Monitored
     */
    @Around("@annotation(com.hms.appointment.aop.Monitored)")
    public Object monitorPerformance(ProceedingJoinPoint joinPoint) throws Throwable {
        String className = joinPoint.getTarget().getClass().getSimpleName();
        String methodName = joinPoint.getSignature().getName();
        String methodInfo = className + "." + methodName;

        long startTime = System.currentTimeMillis();
        try {
            Object result = joinPoint.proceed();
            long executionTime = System.currentTimeMillis() - startTime;

            if (executionTime > SLOW_THRESHOLD_MS) {
                logger.warn("SLOW METHOD: {} executed in {}ms (Threshold: {}ms)", 
                    methodInfo, executionTime, SLOW_THRESHOLD_MS);
            } else {
                logger.debug("PERFORMANCE: {} executed in {}ms", methodInfo, executionTime);
            }

            return result;
        } catch (Throwable ex) {
            long executionTime = System.currentTimeMillis() - startTime;
            logger.error("PERFORMANCE ERROR: {} failed after {}ms with exception: {}", 
                methodInfo, executionTime, ex.getMessage());
            throw ex;
        }
    }
}
