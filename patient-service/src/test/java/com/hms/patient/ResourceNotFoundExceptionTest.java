package com.hms.patient;

import com.hms.patient.exception.ResourceNotFoundException;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class ResourceNotFoundExceptionTest {

    @Test
    void constructor_shouldSetMessage() {
        ResourceNotFoundException ex = new ResourceNotFoundException("Patient not found");
        assertEquals("Patient not found", ex.getMessage());
    }
}
