package com.hms.lab.entity;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

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
    
    private String result; // Qualitative result
    private Double numericResult; // Quantitative result for trending
    private String unit;
    private String referenceRange;
    private Boolean isCritical;
    
    private String status;
    private LocalDate reportDate;
    private String verificationStatus;
    private String verifiedBy;
    private LocalDateTime verifiedAt;
    
    private String artifactUrl;
    private String artifactChecksum;
    private LocalDateTime artifactGeneratedAt;

    // Getters and Setters
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
    public Double getNumericResult() { return numericResult; }
    public void setNumericResult(Double numericResult) { this.numericResult = numericResult; }
    public String getUnit() { return unit; }
    public void setUnit(String unit) { this.unit = unit; }
    public String getReferenceRange() { return referenceRange; }
    public void setReferenceRange(String referenceRange) { this.referenceRange = referenceRange; }
    public Boolean getIsCritical() { return isCritical; }
    public void setIsCritical(Boolean isCritical) { this.isCritical = isCritical; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public LocalDate getReportDate() { return reportDate; }
    public void setReportDate(LocalDate reportDate) { this.reportDate = reportDate; }
    public String getVerificationStatus() { return verificationStatus; }
    public void setVerificationStatus(String verificationStatus) { this.verificationStatus = verificationStatus; }
    public String getVerifiedBy() { return verifiedBy; }
    public void setVerifiedBy(String verifiedBy) { this.verifiedBy = verifiedBy; }
    public LocalDateTime getVerifiedAt() { return verifiedAt; }
    public void setVerifiedAt(LocalDateTime verifiedAt) { this.verifiedAt = verifiedAt; }
    public String getArtifactUrl() { return artifactUrl; }
    public void setArtifactUrl(String artifactUrl) { this.artifactUrl = artifactUrl; }
    public String getArtifactChecksum() { return artifactChecksum; }
    public void setArtifactChecksum(String artifactChecksum) { this.artifactChecksum = artifactChecksum; }
    public LocalDateTime getArtifactGeneratedAt() { return artifactGeneratedAt; }
    public void setArtifactGeneratedAt(LocalDateTime artifactGeneratedAt) { this.artifactGeneratedAt = artifactGeneratedAt; }
}