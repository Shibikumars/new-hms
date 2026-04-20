package com.hms.notification.controller;

import com.hms.notification.entity.NotificationItem;
import com.hms.notification.entity.NotificationPreference;
import com.hms.notification.service.NotificationService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/notifications")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping("/me")
    public List<NotificationItem> getMe(
        @RequestParam("userId") Long userId,
        @RequestParam(value = "escalatedOnly", defaultValue = "false") boolean escalatedOnly,
        @RequestParam(value = "resolvedOnly", defaultValue = "false") boolean resolvedOnly,
        @RequestHeader(value = "X-User-Role", required = false) String role,
        @RequestHeader(value = "X-User-Id", required = false) String authUserId
    ) {
        enforcePatientOwnership(userId, role, authUserId);
        return notificationService.getUserNotifications(userId, escalatedOnly, resolvedOnly);
    }

    @PutMapping("/{id}/read")
    public NotificationItem markRead(
        @PathVariable("id") Long id,
        @RequestHeader(value = "X-User-Role", required = false) String role,
        @RequestHeader(value = "X-User-Id", required = false) String authUserId
    ) {
        NotificationItem existing = notificationService.getById(id);
        enforcePatientOwnership(existing.getUserId(), role, authUserId);
        return notificationService.markRead(id);
    }

    @GetMapping("/preferences")
    public NotificationPreference getPreferences(
        @RequestParam("userId") Long userId,
        @RequestHeader(value = "X-User-Role", required = false) String role,
        @RequestHeader(value = "X-User-Id", required = false) String authUserId
    ) {
        enforcePatientOwnership(userId, role, authUserId);
        return notificationService.getPreference(userId);
    }

    @PutMapping("/preferences")
    public NotificationPreference updatePreferences(
        @RequestParam("userId") Long userId,
        @RequestBody NotificationPreference preference,
        @RequestHeader(value = "X-User-Role", required = false) String role,
        @RequestHeader(value = "X-User-Id", required = false) String authUserId
    ) {
        enforcePatientOwnership(userId, role, authUserId);
        return notificationService.savePreference(userId, preference);
    }

    @PostMapping("/publish")
    public NotificationItem publish(
        @RequestBody NotificationItem notificationItem,
        @RequestHeader(value = "X-Idempotency-Key", required = false) String idempotencyKey
    ) {
        return notificationService.publish(notificationItem, idempotencyKey);
    }

    @PostMapping("/{id}/escalate")
    public NotificationItem escalate(
        @PathVariable("id") Long id,
        @RequestParam("target") String target,
        @RequestParam(value = "owner", required = false) String owner,
        @RequestHeader(value = "X-Username", required = false) String username,
        @RequestHeader(value = "X-User-Role", required = false) String role,
        @RequestHeader(value = "X-User-Id", required = false) String authUserId
    ) {
        enforceEscalationActionRole(role);
        NotificationItem existing = notificationService.getById(id);
        enforcePatientOwnership(existing.getUserId(), role, authUserId);
        String resolvedOwner = (owner != null && !owner.isBlank()) ? owner : (username != null ? username : "SYSTEM");
        return notificationService.escalate(id, target, resolvedOwner);
    }

    @PostMapping("/{id}/resolve")
    public NotificationItem resolveEscalation(
        @PathVariable("id") Long id,
        @RequestParam(value = "note", required = false) String note,
        @RequestHeader(value = "X-Username", required = false) String username,
        @RequestHeader(value = "X-User-Role", required = false) String role,
        @RequestHeader(value = "X-User-Id", required = false) String authUserId
    ) {
        enforceEscalationActionRole(role);
        NotificationItem existing = notificationService.getById(id);
        enforcePatientOwnership(existing.getUserId(), role, authUserId);
        return notificationService.resolveEscalation(id, username != null ? username : "SYSTEM", note);
    }

    @PostMapping("/{id}/reassign")
    public NotificationItem reassignEscalation(
        @PathVariable("id") Long id,
        @RequestParam("target") String target,
        @RequestParam(value = "owner", required = false) String owner,
        @RequestHeader(value = "X-Username", required = false) String username,
        @RequestHeader(value = "X-User-Role", required = false) String role,
        @RequestHeader(value = "X-User-Id", required = false) String authUserId
    ) {
        enforceEscalationActionRole(role);
        NotificationItem existing = notificationService.getById(id);
        enforcePatientOwnership(existing.getUserId(), role, authUserId);
        String resolvedOwner = (owner != null && !owner.isBlank()) ? owner : (username != null ? username : "SYSTEM");
        return notificationService.reassignEscalation(id, target, resolvedOwner);
    }

    private void enforceEscalationActionRole(String role) {
        if (role == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Escalation action denied");
        }

        if (!"ADMIN".equalsIgnoreCase(role) && !"DOCTOR".equalsIgnoreCase(role)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Escalation actions require ADMIN or DOCTOR role");
        }
    }

    private void enforcePatientOwnership(Long requestedUserId, String role, String authUserId) {
        if (requestedUserId == null || role == null || !"PATIENT".equalsIgnoreCase(role)) {
            return;
        }

        Long headerUserId = parseLong(authUserId);
        if (headerUserId != null && !requestedUserId.equals(headerUserId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Patients can only access their own notifications");
        }
    }

    private Long parseLong(String raw) {
        if (raw == null || raw.isBlank()) return null;
        try {
            return Long.parseLong(raw);
        } catch (NumberFormatException ignored) {
            return null;
        }
    }
}
