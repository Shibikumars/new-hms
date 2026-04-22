package com.hms.lab.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "lab_tests")
public class LabTest {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String testName;
    private String description;
    
    @Column(unique = true)
    private String loincCode;
    
    private String referenceRange;
    private String unit;
    private Double price;

    public LabTest() {}
    public LabTest(String testName, String loincCode, String referenceRange, String unit, Double price) {
        this.testName = testName;
        this.loincCode = loincCode;
        this.referenceRange = referenceRange;
        this.unit = unit;
        this.price = price;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getTestName() { return testName; }
    public void setTestName(String testName) { this.testName = testName; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getLoincCode() { return loincCode; }
    public void setLoincCode(String loincCode) { this.loincCode = loincCode; }
    public String getReferenceRange() { return referenceRange; }
    public void setReferenceRange(String referenceRange) { this.referenceRange = referenceRange; }
    public String getUnit() { return unit; }
    public void setUnit(String unit) { this.unit = unit; }
    public Double getPrice() { return price; }
    public void setPrice(Double price) { this.price = price; }
}