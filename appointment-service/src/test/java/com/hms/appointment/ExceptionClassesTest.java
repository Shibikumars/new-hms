package com.hms.appointment;

import com.hms.appointment.exception.*;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class ExceptionClassesTest {
    @Test
    void resourceNotFoundException_shouldSetMessage() {
        assertEquals("not found",
                new ResourceNotFoundException("not found").getMessage());
    }

    @Test
    void slotAlreadyBookedException_shouldSetMessage() {
        assertEquals("slot booked",
                new SlotAlreadyBookedException("slot booked").getMessage());
    }

    @Test
    void doctorUnavailableException_shouldSetMessage() {
        assertEquals("unavailable",
                new DoctorUnavailableException("unavailable").getMessage());
    }
}
