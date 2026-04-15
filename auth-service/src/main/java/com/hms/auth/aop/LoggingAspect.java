package com.hms.auth.aop;

import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

@Aspect
@Component
public class LoggingAspect {

    private static final Logger logger = LoggerFactory.getLogger(LoggingAspect.class);

    @Pointcut("@annotation(com.hms.auth.aop.Loggable)")
    public void loggableMethod() {
    }

    @Pointcut("execution(* com.hms.auth.controller.*.*(..))")
    public void allControllerMethods() {
    }

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

    @Before("allControllerMethods()")
    public void logControllerMethodEntry(JoinPoint joinPoint) {
        String className = joinPoint.getTarget().getClass().getSimpleName();
        String methodName = joinPoint.getSignature().getName();
        String args = java.util.Arrays.toString(joinPoint.getArgs());
        logger.debug("REST API CALL: {}.{}() - Args: {}", className, methodName, args);
    }

    @AfterReturning(pointcut = "allControllerMethods()", returning = "result")
    public void logControllerMethodExit(JoinPoint joinPoint, Object result) {
        String className = joinPoint.getTarget().getClass().getSimpleName();
        String methodName = joinPoint.getSignature().getName();
        logger.debug("REST API RESPONSE: {}.{}() - Result: {}", className, methodName, result);
    }

    @AfterThrowing(pointcut = "allControllerMethods()", throwing = "ex")
    public void logControllerMethodException(JoinPoint joinPoint, Exception ex) {
        String className = joinPoint.getTarget().getClass().getSimpleName();
        String methodName = joinPoint.getSignature().getName();
        logger.error("REST API ERROR: {}.{}() - Exception: {}", className, methodName, ex.getMessage());
    }
}
