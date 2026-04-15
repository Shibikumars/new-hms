package com.hms.appointment.exception;

public class DoctorUnavailableException extends RuntimeException {
    public DoctorUnavailableException(String message) {
        super(message);
    }
}