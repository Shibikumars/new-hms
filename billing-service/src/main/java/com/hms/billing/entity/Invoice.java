package com.hms.billing.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "invoices")
public class Invoice {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull
    private Long patientId;

    private String invoiceNumber;
    private LocalDate invoiceDate;
    
    private Double baseAmount;
    private Double taxAmount;
    private Double taxRate = 5.0; // 5% GST for health services
    private Double totalAmount;
    private String hospitalGstin = "29AAAAA0000A1Z5"; // Mock Hospital GSTIN
    
    private String status;
    private String claimStatus;
    private String sourceSummary;
    private String paymentMethod;
    private String paymentReference;
    private LocalDate paidAt;
    
    private String claimDecisionReason;
    private String claimDecidedBy;
    private LocalDateTime claimDecidedAt;
    private String claimRejectionCode;
    private String claimRejectionCategory;
    private Integer claimResubmissionCount;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getPatientId() { return patientId; }
    public void setPatientId(Long patientId) { this.patientId = patientId; }
    public String getInvoiceNumber() { return invoiceNumber; }
    public void setInvoiceNumber(String invoiceNumber) { this.invoiceNumber = invoiceNumber; }
    public LocalDate getInvoiceDate() { return invoiceDate; }
    public void setInvoiceDate(LocalDate invoiceDate) { this.invoiceDate = invoiceDate; }
    public Double getBaseAmount() { return baseAmount; }
    public void setBaseAmount(Double baseAmount) { this.baseAmount = baseAmount; }
    public Double getTaxAmount() { return taxAmount; }
    public void setTaxAmount(Double taxAmount) { this.taxAmount = taxAmount; }
    public Double getTaxRate() { return taxRate; }
    public void setTaxRate(Double taxRate) { this.taxRate = taxRate; }
    public Double getTotalAmount() { return totalAmount; }
    public void setTotalAmount(Double totalAmount) { this.totalAmount = totalAmount; }
    public String getHospitalGstin() { return hospitalGstin; }
    public void setHospitalGstin(String hospitalGstin) { this.hospitalGstin = hospitalGstin; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getClaimStatus() { return claimStatus; }
    public void setClaimStatus(String claimStatus) { this.claimStatus = claimStatus; }
    public String getSourceSummary() { return sourceSummary; }
    public void setSourceSummary(String sourceSummary) { this.sourceSummary = sourceSummary; }
    public String getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }
    public String getPaymentReference() { return paymentReference; }
    public void setPaymentReference(String paymentReference) { this.paymentReference = paymentReference; }
    public LocalDate getPaidAt() { return paidAt; }
    public void setPaidAt(LocalDate paidAt) { this.paidAt = paidAt; }
    public String getClaimDecisionReason() { return claimDecisionReason; }
    public void setClaimDecisionReason(String claimDecisionReason) { this.claimDecisionReason = claimDecisionReason; }
    public String getClaimDecidedBy() { return claimDecidedBy; }
    public void setClaimDecidedBy(String claimDecidedBy) { this.claimDecidedBy = claimDecidedBy; }
    public LocalDateTime getClaimDecidedAt() { return claimDecidedAt; }
    public void setClaimDecidedAt(LocalDateTime claimDecidedAt) { this.claimDecidedAt = claimDecidedAt; }
    public String getClaimRejectionCode() { return claimRejectionCode; }
    public void setClaimRejectionCode(String claimRejectionCode) { this.claimRejectionCode = claimRejectionCode; }
    public String getClaimRejectionCategory() { return claimRejectionCategory; }
    public void setClaimRejectionCategory(String claimRejectionCategory) { this.claimRejectionCategory = claimRejectionCategory; }
    public Integer getClaimResubmissionCount() { return claimResubmissionCount; }
    public void setClaimResubmissionCount(Integer claimResubmissionCount) { this.claimResubmissionCount = claimResubmissionCount; }
}
