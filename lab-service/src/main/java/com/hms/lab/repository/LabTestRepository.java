package com.hms.lab.repository;
import com.hms.lab.entity.LabTest;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface LabTestRepository extends JpaRepository<LabTest, Long> {
    List<LabTest> findByTestNameContainingIgnoreCase(String testName);
}
