package com.hms.doctor;

import com.hms.doctor.exception.ResourceNotFoundException;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class ResourceNotFoundExceptionTest {

    @Test
    void constructor_shouldSetMessage() {
        ResourceNotFoundException ex = new ResourceNotFoundException("Doctor not found");
        assertEquals("Doctor not found", ex.getMessage());
    }
}
