package com.hms.appointment.dto;

public class DoctorDTO {

    private Long id;
    private String fullName;
    private java.util.List<DoctorScheduleDTO> schedules;

    public DoctorDTO() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public java.util.List<DoctorScheduleDTO> getSchedules() { return schedules; }
    public void setSchedules(java.util.List<DoctorScheduleDTO> schedules) { this.schedules = schedules; }
}