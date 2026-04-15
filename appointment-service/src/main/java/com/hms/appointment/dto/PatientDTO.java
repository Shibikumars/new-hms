package com.hms.appointment.dto;

public class PatientDTO {

    private Long id;
    private String fullName;

    public PatientDTO() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }
}