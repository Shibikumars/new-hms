package com.hms.records.controller;

import com.hms.records.entity.*;
import com.hms.records.service.MedicalRecordsService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;
import java.util.List;
import java.util.Map;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpHeaders;
import java.io.ByteArrayOutputStream;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.element.Table;
import com.itextpdf.layout.properties.UnitValue;
import java.time.format.DateTimeFormatter;

@RestController
@RequestMapping("/records")
public class MedicalRecordsController {

    private final MedicalRecordsService medicalRecordsService;

    public MedicalRecordsController(MedicalRecordsService medicalRecordsService) {
        this.medicalRecordsService = medicalRecordsService;
    }

    @GetMapping("/patient/{patientId}/visits")
    @PreAuthorize("hasRole('ADMIN') or hasRole('DOCTOR')")
    public List<VisitNote> getVisitsByPatient(@PathVariable Long patientId) {
        return medicalRecordsService.getVisitsByPatient(patientId);
    }

    @PostMapping("/visits")
    @PreAuthorize("hasRole('DOCTOR')")
    public VisitNote createVisit(@Valid @RequestBody VisitNote visitNote) {
        return medicalRecordsService.createVisit(visitNote);
    }

    @GetMapping("/patient/{patientId}/vitals")
    @PreAuthorize("hasRole('ADMIN') or hasRole('DOCTOR')")
    public List<VitalRecord> getVitalsByPatient(@PathVariable Long patientId) {
        return medicalRecordsService.getVitalsByPatient(patientId);
    }

    @PostMapping("/patient/{patientId}/vitals")
    @PreAuthorize("hasRole('DOCTOR') or hasRole('ADMIN')")
    public VitalRecord addVital(@PathVariable Long patientId, @Valid @RequestBody VitalRecord vitalRecord) {
        return medicalRecordsService.addVital(patientId, vitalRecord);
    }

    @GetMapping("/icd/search")
    @PreAuthorize("hasRole('DOCTOR')")
    public List<IcdCode> searchIcd(@RequestParam(value = "q", required = false) String q) {
        return medicalRecordsService.searchIcdCodes(q);
    }

    @GetMapping("/patient/{patientId}/allergies")
    @PreAuthorize("hasRole('ADMIN') or hasRole('DOCTOR')")
    public List<AllergyRecord> getAllergiesByPatient(@PathVariable Long patientId) {
        return medicalRecordsService.getAllergiesByPatient(patientId);
    }

    @PostMapping("/patient/{patientId}/allergies")
    @PreAuthorize("hasRole('DOCTOR')")
    public AllergyRecord addAllergy(@PathVariable Long patientId, @Valid @RequestBody AllergyRecord allergyRecord) {
        return medicalRecordsService.addAllergy(patientId, allergyRecord);
    }

    @GetMapping("/patient/{patientId}/problems")
    @PreAuthorize("hasRole('ADMIN') or hasRole('DOCTOR')")
    public List<ProblemRecord> getProblemsByPatient(@PathVariable Long patientId) {
        return medicalRecordsService.getProblemsByPatient(patientId);
    }

    @PostMapping("/patient/{patientId}/problems")
    @PreAuthorize("hasRole('DOCTOR')")
    public ProblemRecord addProblem(@PathVariable Long patientId, @Valid @RequestBody ProblemRecord problemRecord) {
        return medicalRecordsService.addProblem(patientId, problemRecord);
    }

    @GetMapping("/fhir/{patientId}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('DOCTOR')")
    public Map<String, Object> exportFHIR(@PathVariable Long patientId) {
        return medicalRecordsService.exportToFHIR(patientId);
    }

    @GetMapping("/visits/{id}/pdf")
    @PreAuthorize("hasRole('ADMIN') or hasRole('DOCTOR') or hasRole('PATIENT')")
    public ResponseEntity<byte[]> generateVisitPdf(@PathVariable Long id) {
        VisitNote visit = medicalRecordsService.getVisitById(id);
        
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        PdfWriter writer = new PdfWriter(out);
        PdfDocument pdf = new PdfDocument(writer);
        Document document = new Document(pdf);

        document.add(new Paragraph("CITY CARE HOSPITAL - VISIT SUMMARY").setBold().setFontSize(18));
        document.add(new Paragraph("Date: " + visit.getVisitDate().format(DateTimeFormatter.ofPattern("dd MMM yyyy"))));
        document.add(new Paragraph("Patient ID: MRN-" + visit.getPatientId()));
        document.add(new Paragraph("\nCHIEF COMPLAINT:").setBold());
        document.add(new Paragraph(visit.getChiefComplaint()));
        
        document.add(new Paragraph("\nCLINICAL NOTES:").setBold());
        document.add(new Paragraph(visit.getNotes()));

        if (visit.getDiagnosisCode() != null) {
            document.add(new Paragraph("\nDIAGNOSIS (ICD-10):").setBold());
            document.add(new Paragraph(visit.getDiagnosisCode() + " - " + visit.getDiagnosisDescription()));
        }

        document.close();

        byte[] contents = out.toByteArray();
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDispositionFormData("attachment", "visit_summary_" + id + ".pdf");
        
        return ResponseEntity.ok().headers(headers).body(contents);
    }
}
