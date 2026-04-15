package com.hms.lab.entity;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "lab_reports")
public class LabReport {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private Long labOrderId;
    private Long testId;
    private Long doctorId;
    private Long patientId;
    private String result;
    private String status;
    private LocalDate reportDate;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getLabOrderId() { return labOrderId; }
    public void setLabOrderId(Long labOrderId) { this.labOrderId = labOrderId; }
    public Long getTestId() { return testId; }
    public void setTestId(Long testId) { this.testId = testId; }
    public Long getDoctorId() { return doctorId; }
    public void setDoctorId(Long doctorId) { this.doctorId = doctorId; }
    public Long getPatientId() { return patientId; }
    public void setPatientId(Long patientId) { this.patientId = patientId; }
    public String getResult() { return result; }
    public void setResult(String result) { this.result = result; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public LocalDate getReportDate() { return reportDate; }
    public void setReportDate(LocalDate reportDate) { this.reportDate = reportDate; }
}