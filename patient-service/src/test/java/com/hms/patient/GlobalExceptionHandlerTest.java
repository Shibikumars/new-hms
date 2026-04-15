package com.hms.patient;

import com.hms.patient.exception.GlobalExceptionHandler;
import com.hms.patient.exception.ResourceNotFoundException;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.BeanPropertyBindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

class GlobalExceptionHandlerTest {

    private final GlobalExceptionHandler handler = new GlobalExceptionHandler();

    @Test
    void handleNotFound_shouldReturn404() {
        ResponseEntity<Map<String, Object>> response =
                handler.handleNotFound(new ResourceNotFoundException("not found"));
        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
        assertEquals("not found", response.getBody().get("error"));
    }

    @Test
    void handleValidation_shouldReturn400() throws Exception {
        // Build a fake MethodArgumentNotValidException
        BeanPropertyBindingResult bindingResult =
                new BeanPropertyBindingResult(new Object(), "patient");
        bindingResult.addError(new FieldError("patient", "fullName", "Full name is required"));
        MethodArgumentNotValidException ex =
                new MethodArgumentNotValidException(null, bindingResult);

        ResponseEntity<Map<String, Object>> response = handler.handleValidation(ex);
        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertTrue(response.getBody().get("error").toString().contains("fullName"));
    }

    @Test
    void handleInvalid_shouldReturn400() {
        ResponseEntity<Map<String, Object>> response =
                handler.handleInvalid(new IllegalArgumentException("bad arg"));
        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertEquals("bad arg", response.getBody().get("error"));
    }

    @Test
    void handleGeneral_shouldReturn500() {
        ResponseEntity<Map<String, Object>> response =
                handler.handleGeneral(new RuntimeException("something broke"));
        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, response.getStatusCode());
        assertEquals("something broke", response.getBody().get("error"));
    }
}
