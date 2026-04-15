package com.hms.appointment;

import com.hms.appointment.exception.*;
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
    void handleSlot_shouldReturn400() {
        ResponseEntity<Map<String, Object>> r =
                handler.handleSlot(new SlotAlreadyBookedException("slot booked"));
        assertEquals(HttpStatus.BAD_REQUEST, r.getStatusCode());
    }

    @Test
    void handleAvailability_shouldReturn400() {
        ResponseEntity<Map<String, Object>> r =
                handler.handleAvailability(new DoctorUnavailableException("unavailable"));
        assertEquals(HttpStatus.BAD_REQUEST, r.getStatusCode());
    }

    @Test
    void handleValidation_shouldReturn400() throws Exception {
        BeanPropertyBindingResult result =
                new BeanPropertyBindingResult(new Object(), "appointment");
        result.addError(new FieldError("appointment", "patientId", "required"));
        MethodArgumentNotValidException ex =
                new MethodArgumentNotValidException(null, result);
        assertEquals(HttpStatus.BAD_REQUEST, handler.handleValidation(ex).getStatusCode());
    }

    @Test
    void handleInvalid_shouldReturn400() {
        assertEquals(HttpStatus.BAD_REQUEST,
                handler.handleInvalid(new IllegalArgumentException("bad")).getStatusCode());
    }

    @Test
    void handleGeneral_shouldReturn500() {
        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR,
                handler.handleGeneral(new RuntimeException("error")).getStatusCode());
    }
}
