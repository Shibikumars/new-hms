package com.hms.appointment.aop;

import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.annotation.AfterReturning;
import org.aspectj.lang.annotation.Aspect;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

/**
 * Auditing Aspect for appointment-service.
 * Tracks data modification operations (create, update, delete).
 */
@Aspect
@Component
public class AuditingAspect {

    private static final Logger auditLogger = LoggerFactory.getLogger("AUDIT_LOGGER");
    private static final DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    /**
     * Audit methods marked with @Auditable annotation
     */
    @AfterReturning(pointcut = "@annotation(auditable)", returning = "result")
    public void auditMethodCall(JoinPoint joinPoint, Auditable auditable, Object result) {
        String className = joinPoint.getTarget().getClass().getSimpleName();
        String methodName = joinPoint.getSignature().getName();
        String action = auditable.action();
        String description = auditable.value();
        LocalDateTime timestamp = LocalDateTime.now();

        String auditLog = String.format(
            "[%s] ACTION: %s | CLASS: %s | METHOD: %s | DESCRIPTION: %s | RESULT: %s",
            formatter.format(timestamp),
            action,
            className,
            methodName,
            description,
            result
        );

        auditLogger.info(auditLog);
    }

    /**
     * Audit method execution with error handling
     */
    @AfterReturning(pointcut = "@annotation(com.hms.appointment.aop.Auditable)")
    public void logAudit(JoinPoint joinPoint) {
        String className = joinPoint.getTarget().getClass().getSimpleName();
        String methodName = joinPoint.getSignature().getName();
        LocalDateTime timestamp = LocalDateTime.now();

        String auditLog = String.format(
            "[%s] AUDIT: %s.%s() executed successfully",
            formatter.format(timestamp),
            className,
            methodName
        );

        auditLogger.debug(auditLog);
    }
}
