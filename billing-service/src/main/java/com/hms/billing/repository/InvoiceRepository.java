package com.hms.billing.repository;

import com.hms.billing.entity.Invoice;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface InvoiceRepository extends JpaRepository<Invoice, Long> {
    List<Invoice> findByPatientIdOrderByInvoiceDateDesc(Long patientId);
}
