package com.hms.doctor.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "doctors")
public class Doctor {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Full name is required")
    private String fullName;

    @NotBlank(message = "Specialization is required")
    private String specialization;

    @NotBlank(message = "Phone is required")
    private String phone;

    private String email;

    // Rich Profile Fields
    private String qualifications;
    private Integer yearsOfExperience;
    private String subSpecialties;
    private Double consultationFee;
    private String languagesSpoken;
    private String profilePhotoUrl;
    private String about;
    private Double rating;
    private Long userId;

    @OneToMany(mappedBy = "doctor", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<DoctorSchedule> schedules = new ArrayList<>();

    public Doctor() {}

    public Doctor(Long id, String fullName, String specialization,
                  String phone, String email) {
        this.id = id;
        this.fullName = fullName;
        this.specialization = specialization;
        this.phone = phone;
        this.email = email;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }
    public String getSpecialization() { return specialization; }
    public void setSpecialization(String specialization) { this.specialization = specialization; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    
    public String getQualifications() { return qualifications; }
    public void setQualifications(String qualifications) { this.qualifications = qualifications; }
    public Integer getYearsOfExperience() { return yearsOfExperience; }
    public void setYearsOfExperience(Integer yearsOfExperience) { this.yearsOfExperience = yearsOfExperience; }
    public String getSubSpecialties() { return subSpecialties; }
    public void setSubSpecialties(String subSpecialties) { this.subSpecialties = subSpecialties; }
    public Double getConsultationFee() { return consultationFee; }
    public void setConsultationFee(Double consultationFee) { this.consultationFee = consultationFee; }
    public String getLanguagesSpoken() { return languagesSpoken; }
    public void setLanguagesSpoken(String languagesSpoken) { this.languagesSpoken = languagesSpoken; }
    public String getProfilePhotoUrl() { return profilePhotoUrl; }
    public void setProfilePhotoUrl(String profilePhotoUrl) { this.profilePhotoUrl = profilePhotoUrl; }
    public String getAbout() { return about; }
    public void setAbout(String about) { this.about = about; }
    public Double getRating() { return rating; }
    public void setRating(Double rating) { this.rating = rating; }
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public List<DoctorSchedule> getSchedules() { return schedules; }
    public void setSchedules(List<DoctorSchedule> schedules) { this.schedules = schedules; }
}