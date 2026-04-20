package com.hms.auth.exception;

public class InvalidRefreshTokenException extends RuntimeException {
    public InvalidRefreshTokenException() {
        super("Session expired. Please sign in again.");
    }
}
