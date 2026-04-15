package com.hms.doctor;

import com.hms.doctor.exception.GlobalExceptionHandler;
import com.hms.doctor.exception.ResourceNotFoundException;
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
        ResponseEntity<Map<String, Object>> r =
                handler.handleNotFound(new ResourceNotFoundException("not found"));
        assertEquals(HttpStatus.NOT_FOUND, r.getStatusCode());
    }

    @Test
    void handleValidation_shouldReturn400() throws Exception {
        BeanPropertyBindingResult result =
                new BeanPropertyBindingResult(new Object(), "doctor");
        result.addError(new FieldError("doctor", "fullName", "required"));
        MethodArgumentNotValidException ex =
                new MethodArgumentNotValidException(null, result);
        assertEquals(HttpStatus.BAD_REQUEST, handler.handleValidation(ex).getStatusCode());
    }

    @Test
    void handleInvalid_shouldReturn400() {
        assertEquals(HttpStatus.BAD_REQUEST,
                handler.handleInvalid(new IllegalArgumentException("x")).getStatusCode());
    }

    @Test
    void handleGeneral_shouldReturn500() {
        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR,
                handler.handleGeneral(new RuntimeException("y")).getStatusCode());
    }
}
