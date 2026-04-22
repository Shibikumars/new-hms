package com.hms.patient.dto;

import java.util.List;

public class PatientSummaryDTO {
    private Long patientId;
    private String fullName;
    private String mrn;
    private List<Object> visits;
    private List<Object> allergies;
    private List<Object> problems;
    private List<Object> vitals;
    private List<Object> labOrders;
    private List<Object> prescriptions;

    // Getters and Setters
    public Long getPatientId() { return patientId; }
    public void setPatientId(Long patientId) { this.patientId = patientId; }
    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }
    public String getMrn() { return mrn; }
    public void setMrn(String mrn) { this.mrn = mrn; }
    public List<Object> getVisits() { return visits; }
    public void setVisits(List<Object> visits) { this.visits = visits; }
    public List<Object> getAllergies() { return allergies; }
    public void setAllergies(List<Object> allergies) { this.allergies = allergies; }
    public List<Object> getProblems() { return problems; }
    public void setProblems(List<Object> problems) { this.problems = problems; }
    public List<Object> getVitals() { return vitals; }
    public void setVitals(List<Object> vitals) { this.vitals = vitals; }
    public List<Object> getLabOrders() { return labOrders; }
    public void setLabOrders(List<Object> labOrders) { this.labOrders = labOrders; }
    public List<Object> getPrescriptions() { return prescriptions; }
    public void setPrescriptions(List<Object> prescriptions) { this.prescriptions = prescriptions; }
}
