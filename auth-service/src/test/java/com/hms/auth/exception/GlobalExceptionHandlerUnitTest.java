package com.hms.auth.exception;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("GlobalExceptionHandler unit tests (no Spring)")
class GlobalExceptionHandlerUnitTest {

    private final GlobalExceptionHandler handler = new GlobalExceptionHandler();

    @Test
    void handleDuplicate_shouldReturnConflict() {
        ResponseEntity<Map<String, Object>> resp = handler.handleDuplicate(new DataIntegrityViolationException("dup"));
        assertEquals(HttpStatus.CONFLICT, resp.getStatusCode());
        assertEquals("Username already exists", resp.getBody().get("error"));
    }

    @Test
    void handleInvalidCredentials_shouldReturnUnauthorized() {
        ResponseEntity<Map<String, Object>> resp = handler.handleInvalidCredentials(new InvalidCredentialsException());
        assertEquals(HttpStatus.UNAUTHORIZED, resp.getStatusCode());
        assertEquals("Invalid username or password", resp.getBody().get("message"));
    }

    @Test
    void handleInvalidRefreshToken_shouldReturnUnauthorized() {
        ResponseEntity<Map<String, Object>> resp = handler.handleInvalidRefreshToken(new InvalidRefreshTokenException());
        assertEquals(HttpStatus.UNAUTHORIZED, resp.getStatusCode());
        assertEquals("Session expired. Please sign in again.", resp.getBody().get("message"));
    }

    @Test
    void handleIllegalArgument_conflictWhenMessageContainsAlreadyExists() {
        ResponseEntity<Map<String, Object>> resp = handler.handleIllegalArgument(new IllegalArgumentException("Username already exists"));
        assertEquals(HttpStatus.CONFLICT, resp.getStatusCode());
    }

    @Test
    void handleIllegalArgument_badRequestOtherwise() {
        ResponseEntity<Map<String, Object>> resp = handler.handleIllegalArgument(new IllegalArgumentException("bad input"));
        assertEquals(HttpStatus.BAD_REQUEST, resp.getStatusCode());
    }

    @Test
    void handleMessageNotReadable_returnsBadRequest() {
        HttpMessageNotReadableException ex = new HttpMessageNotReadableException("malformed");
        ResponseEntity<Map<String, Object>> resp = handler.handleMessageNotReadable(ex);
        assertEquals(HttpStatus.BAD_REQUEST, resp.getStatusCode());
        assertTrue(((String) resp.getBody().get("message")).contains("malformed") || resp.getBody().get("message") != null);
    }

    @Test
    void handleRuntime_returnsInternalServerError() {
        ResponseEntity<Map<String, Object>> resp = handler.handleRuntime(new RuntimeException("boom"));
        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, resp.getStatusCode());
    }

}
