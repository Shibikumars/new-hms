package com.hms.patient.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;

import java.time.LocalDate;
import java.time.Period;

@Entity
@Table(name = "patients")
public class Patient {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "First name is required")
    private String firstName;

    @NotBlank(message = "Last name is required")
    private String lastName;

    @NotNull(message = "Date of birth is required")
    @PastOrPresent(message = "Date of birth cannot be in the future")
    private LocalDate dob;

    @NotBlank(message = "Gender is required")
    private String gender;

    @NotBlank(message = "Phone is required")
    private String phone;

    @Email(message = "Email must be valid")
    private String email;

    @NotBlank(message = "Blood group is required")
    private String bloodGroup;

    private String address;

    private String emergencyContact;

    private String insuranceProvider;

    private String insurancePolicyNumber;
    
    @Column(unique = true)
    private String mrn;

    private Long userId; // Link to auth-service user ID

    private Long mergedId; // ID of the patient record this one was merged into

    public Patient() {}

    public Patient(Long id, String firstName, String lastName, LocalDate dob, String gender,
                   String bloodGroup, String phone, String email, String address,
                   String emergencyContact, String insuranceProvider, String insurancePolicyNumber, Long userId) {
        this.id = id;
        this.firstName = firstName;
        this.lastName = lastName;
        this.dob = dob;
        this.gender = gender;
        this.bloodGroup = bloodGroup;
        this.phone = phone;
        this.email = email;
        this.address = address;
        this.emergencyContact = emergencyContact;
        this.insuranceProvider = insuranceProvider;
        this.insurancePolicyNumber = insurancePolicyNumber;
        this.userId = userId;
    }

    // Backward-compatible constructor used by legacy tests
    public Patient(Long id, String fullName, Integer age, String gender, String phone, String bloodGroup, String address) {
        this.id = id;
        this.setFullName(fullName);
        this.setAge(age);
        this.gender = gender;
        this.phone = phone;
        this.bloodGroup = bloodGroup;
        this.address = address;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getFirstName() { return firstName; }
    public void setFirstName(String firstName) { this.firstName = firstName; }
    public String getLastName() { return lastName; }
    public void setLastName(String lastName) { this.lastName = lastName; }
    public LocalDate getDob() { return dob; }
    public void setDob(LocalDate dob) { this.dob = dob; }
    public String getGender() { return gender; }
    public void setGender(String gender) { this.gender = gender; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getBloodGroup() { return bloodGroup; }
    public void setBloodGroup(String bloodGroup) { this.bloodGroup = bloodGroup; }
    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }
    public String getEmergencyContact() { return emergencyContact; }
    public void setEmergencyContact(String emergencyContact) { this.emergencyContact = emergencyContact; }
    public String getInsuranceProvider() { return insuranceProvider; }
    public void setInsuranceProvider(String insuranceProvider) { this.insuranceProvider = insuranceProvider; }
    public String getInsurancePolicyNumber() { return insurancePolicyNumber; }
    public void setInsurancePolicyNumber(String insurancePolicyNumber) { this.insurancePolicyNumber = insurancePolicyNumber; }
    public String getMrn() { return mrn; }
    public void setMrn(String mrn) { this.mrn = mrn; }
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public Long getMergedId() { return mergedId; }
    public void setMergedId(Long mergedId) { this.mergedId = mergedId; }

    @Transient
    @JsonProperty("fullName")
    public String getFullName() {
        return String.format("%s %s", firstName == null ? "" : firstName, lastName == null ? "" : lastName).trim();
    }

    @Transient
    @JsonProperty("age")
    public Integer getAge() {
        if (dob == null) {
            return null;
        }
        return Period.between(dob, LocalDate.now()).getYears();
    }

    @JsonIgnore
    public void setFullName(String fullName) {
        if (fullName == null || fullName.isBlank()) {
            return;
        }
        String[] parts = fullName.trim().split("\\s+", 2);
        this.firstName = parts[0];
        this.lastName = parts.length > 1 ? parts[1] : "";
    }

    @JsonIgnore
    public void setAge(Integer age) {
        if (age == null) {
            return;
        }
        this.dob = LocalDate.now().minusYears(age);
    }
}