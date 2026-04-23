package com.hms.queue.controller;

import com.hms.queue.entity.QueueToken;
import com.hms.queue.service.QueueService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/queue")
public class QueueController {

    @Autowired
    private QueueService queueService;

    @PostMapping("/check-in/{appointmentId}")
    public ResponseEntity<QueueToken> checkIn(@PathVariable Long appointmentId) {
        return ResponseEntity.ok(queueService.checkIn(appointmentId));
    }

    @GetMapping("/doctor/{doctorId}/status")
    public ResponseEntity<Map<String, Object>> getDoctorQueueStatus(@PathVariable Long doctorId) {
        return ResponseEntity.ok(queueService.getDoctorQueueStatus(doctorId));
    }

    @GetMapping("/patient/{patientId}/token")
    public ResponseEntity<QueueToken> getPatientActiveToken(@PathVariable Long patientId) {
        return ResponseEntity.ok(queueService.getPatientActiveToken(patientId));
    }

    @PostMapping("/tokens/{tokenId}/start")
    public ResponseEntity<QueueToken> startConsultation(@PathVariable Long tokenId) {
        return ResponseEntity.ok(queueService.startConsultation(tokenId));
    }

    @PostMapping("/tokens/{tokenId}/complete")
    public ResponseEntity<QueueToken> completeConsultation(@PathVariable Long tokenId) {
        return ResponseEntity.ok(queueService.completeConsultation(tokenId));
    }
    
    @GetMapping("/display")
    public ResponseEntity<List<QueueToken>> getQueueDisplay() {
        return ResponseEntity.ok(queueService.getActiveTokensForDisplay());
    }
}
