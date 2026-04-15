package com.hms.appointment.dto;

public class DoctorDTO {

    private Long id;
    private String fullName;
    private String availability;   // ADD THIS

    public DoctorDTO() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public String getAvailability() { return availability; }   // ADD THIS
    public void setAvailability(String availability) { this.availability = availability; }  // ADD THIS
}