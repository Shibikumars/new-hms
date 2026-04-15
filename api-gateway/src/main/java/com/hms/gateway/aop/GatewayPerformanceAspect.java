package com.hms.gateway.aop;

import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

/**
 * Gateway Performance Monitoring Aspect
 * Monitors request routing performance through the API Gateway
 */
@Aspect
@Component
public class GatewayPerformanceAspect {

    private static final Logger logger = LoggerFactory.getLogger(GatewayPerformanceAspect.class);
    private static final long SLOW_THRESHOLD_MS = 2000; // 2 seconds for gateway

    @Around("@annotation(com.hms.gateway.aop.Monitored)")
    public Object monitorGatewayPerformance(ProceedingJoinPoint joinPoint) throws Throwable {
        String className = joinPoint.getTarget().getClass().getSimpleName();
        String methodName = joinPoint.getSignature().getName();
        String methodInfo = className + "." + methodName;

        long startTime = System.currentTimeMillis();
        try {
            Object result = joinPoint.proceed();
            long executionTime = System.currentTimeMillis() - startTime;

            if (executionTime > SLOW_THRESHOLD_MS) {
                logger.warn("SLOW GATEWAY OPERATION: {} executed in {}ms (Threshold: {}ms)", 
                    methodInfo, executionTime, SLOW_THRESHOLD_MS);
            } else {
                logger.debug("GATEWAY PERFORMANCE: {} executed in {}ms", methodInfo, executionTime);
            }

            return result;
        } catch (Throwable ex) {
            long executionTime = System.currentTimeMillis() - startTime;
            logger.error("GATEWAY ERROR: {} failed after {}ms with exception: {}", 
                methodInfo, executionTime, ex.getMessage());
            throw ex;
        }
    }
}
