package com.hms.appointment.aop;

import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

/**
 * Logging Aspect for appointment-service.
 * Handles logging of method entry, exit, arguments, return values, and exceptions.
 */
@Aspect
@Component
public class LoggingAspect {

    private static final Logger logger = LoggerFactory.getLogger(LoggingAspect.class);

    /**
     * Pointcut for all methods annotated with @Loggable
     */
    @Pointcut("@annotation(com.hms.appointment.aop.Loggable)")
    public void loggableMethod() {
    }

    /**
     * Pointcut for all controller methods
     */
    @Pointcut("execution(* com.hms.appointment.controller.*.*(..))")
    public void allControllerMethods() {
    }

    /**
     * Log method entry and exit for @Loggable annotated methods
     */
    @Around("loggableMethod()")
    public Object logMethodExecution(ProceedingJoinPoint joinPoint) throws Throwable {
        String className = joinPoint.getTarget().getClass().getSimpleName();
        String methodName = joinPoint.getSignature().getName();
        Object[] args = joinPoint.getArgs();

        logger.info("ENTRY: {}.{}() with args: {}", className, methodName, args);

        long startTime = System.currentTimeMillis();
        try {
            Object result = joinPoint.proceed();
            long executionTime = System.currentTimeMillis() - startTime;
            logger.info("EXIT: {}.{}() returned: {} in {}ms", className, methodName, result, executionTime);
            return result;
        } catch (Throwable ex) {
            long executionTime = System.currentTimeMillis() - startTime;
            logger.error("EXCEPTION in {}.{}() after {}ms: {}", className, methodName, executionTime, ex.getMessage(), ex);
            throw ex;
        }
    }

    /**
     * Log all controller method calls (before execution)
     */
    @Before("allControllerMethods()")
    public void logControllerMethodEntry(JoinPoint joinPoint) {
        String className = joinPoint.getTarget().getClass().getSimpleName();
        String methodName = joinPoint.getSignature().getName();
        String args = java.util.Arrays.toString(joinPoint.getArgs());
        logger.debug("REST API CALL: {}.{}() - Args: {}", className, methodName, args);
    }

    /**
     * Log return values from controller methods
     */
    @AfterReturning(pointcut = "allControllerMethods()", returning = "result")
    public void logControllerMethodExit(JoinPoint joinPoint, Object result) {
        String className = joinPoint.getTarget().getClass().getSimpleName();
        String methodName = joinPoint.getSignature().getName();
        logger.debug("REST API RESPONSE: {}.{}() - Result: {}", className, methodName, result);
    }

    /**
     * Log exceptions from controller methods
     */
    @AfterThrowing(pointcut = "allControllerMethods()", throwing = "ex")
    public void logControllerMethodException(JoinPoint joinPoint, Exception ex) {
        String className = joinPoint.getTarget().getClass().getSimpleName();
        String methodName = joinPoint.getSignature().getName();
        logger.error("REST API ERROR: {}.{}() - Exception: {}", className, methodName, ex.getMessage());
    }
}
