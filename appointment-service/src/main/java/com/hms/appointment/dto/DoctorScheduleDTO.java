package com.hms.appointment.dto;

import java.time.LocalTime;

public class DoctorScheduleDTO {
    private String dayOfWeek;
    private LocalTime startTime;
    private LocalTime endTime;

    public DoctorScheduleDTO() {}

    public String getDayOfWeek() { return dayOfWeek; }
    public void setDayOfWeek(String dayOfWeek) { this.dayOfWeek = dayOfWeek; }
    public LocalTime getStartTime() { return startTime; }
    public void setStartTime(LocalTime startTime) { this.startTime = startTime; }
    public LocalTime getEndTime() { return endTime; }
    public void setEndTime(LocalTime endTime) { this.endTime = endTime; }
}
