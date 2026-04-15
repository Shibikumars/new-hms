package com.hms.auth.aop;

import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

@Aspect
@Component
public class PerformanceAspect {

    private static final Logger logger = LoggerFactory.getLogger(PerformanceAspect.class);
    private static final long SLOW_THRESHOLD_MS = 1000;

    @Around("@annotation(com.hms.auth.aop.Monitored)")
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
