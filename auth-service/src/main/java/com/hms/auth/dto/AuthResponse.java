package com.hms.auth.dto;

public class AuthResponse {

    private String token;
    private String refreshToken;
    private String role;
    private Long expiresIn;
    private boolean verificationRequired;

    public AuthResponse() {
    }

    public AuthResponse(String token, String refreshToken, String role, Long expiresIn, boolean verificationRequired) {
        this.token = token;
        this.refreshToken = refreshToken;
        this.role = role;
        this.expiresIn = expiresIn;
        this.verificationRequired = verificationRequired;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public String getRefreshToken() {
        return refreshToken;
    }

    public void setRefreshToken(String refreshToken) {
        this.refreshToken = refreshToken;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public Long getExpiresIn() {
        return expiresIn;
    }

    public void setExpiresIn(Long expiresIn) {
        this.expiresIn = expiresIn;
    }

    public boolean isVerificationRequired() {
        return verificationRequired;
    }

    public void setVerificationRequired(boolean verificationRequired) {
        this.verificationRequired = verificationRequired;
    }
}
