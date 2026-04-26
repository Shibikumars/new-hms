# HMS Project Diagrams and ChatGPT Prompts

This document provides a comprehensive overview of the **Healthcare Management System (HMS)** architecture, use cases, flows, and entities. You can use these descriptions and Mermaid diagrams as prompts for ChatGPT or other AI tools to generate more detailed documentation or code.

---

## 1. System Architecture Diagram

The HMS follows a **Microservices Architecture** pattern, using Spring Cloud for service orchestration and Angular for the frontend.

### Mermaid Diagram
```mermaid
graph TD
    subgraph "Client Layer"
        AngularFrontend["Angular SPA (Port 4200)"]
    end

    subgraph "Edge Layer"
        APIGateway["Spring Cloud Gateway (Port 8080)"]
        DiscoveryServer["Eureka Discovery Server (Port 8761)"]
    end

    subgraph "Core Microservices"
        AuthService["Auth Service (Port 8082)"]
        PatientService["Patient Service"]
        DoctorService["Doctor Service"]
        ApptService["Appointment Service"]
        LabService["Lab Service"]
        MedRecService["Medical Records Service"]
        PharmacyService["Pharmacy Service"]
        BillingService["Billing Service"]
        NotifService["Notification Service"]
        ReportService["Reporting Service"]
    end

    subgraph "Persistence Layer"
        AuthDB[(auth_db)]
        PatientDB[(patient_db)]
        DoctorDB[(doctor_db)]
        ApptDB[(appointment_db)]
        BillingDB[(billing_db)]
        OtherDBs[(Other Service DBs)]
    end

    AngularFrontend --> APIGateway
    APIGateway --> DiscoveryServer
    APIGateway --> AuthService
    APIGateway --> PatientService
    APIGateway --> ApptService
    
    AuthService --> AuthDB
    PatientService --> PatientDB
    DoctorService --> DoctorDB
    ApptService --> ApptDB
    BillingService --> BillingDB
    
    ApptService -.-> NotifService
    LabService -.-> NotifService
```

### Dependency & Flow Description
- **Frontend**: Communicates solely with the **API Gateway**.
- **API Gateway**: Handles routing and **JWT Validation**. It fetches service locations from the **Discovery Server (Eureka)**.
- **Inter-service Communication**: Services use **Feign Clients** or **RestTemplate** for synchronous calls (e.g., Appointment service checking if a Patient exists).
- **Persistence**: Each microservice has its own isolated **MySQL Database**, ensuring loose coupling.

---

## 2. Use Case Diagram

Defines the interactions between users (Actors) and the system.

### Mermaid Diagram
```mermaid
graph TD
    subgraph "Actors"
        Patient((Patient))
        Doctor((Doctor))
        Admin((Admin))
    end

    subgraph "Use Cases"
        UC1(Login/Register)
        UC2(Manage Profile)
        UC3(Book Appointment)
        UC4(View Medical History)
        UC5(Issue Prescription)
        UC6(Manage Schedule)
        UC7(Generate Invoices)
        UC8(System Analytics)
    end

    Patient --> UC1
    Patient --> UC2
    Patient --> UC3
    Patient --> UC4

    Doctor --> UC1
    Doctor --> UC4
    Doctor --> UC5
    Doctor --> UC6

    Admin --> UC1
    Admin --> UC7
    Admin --> UC8
```

### Flow Description
- **Patients**: Can manage their profile, book appointments with specific doctors, and view their clinical history.
- **Doctors**: Manage their own availability slots, view patient records during consultations, and issue electronic prescriptions.
- **Admins**: Monitor system health, manage billing cycles, and view hospital-wide performance reports.

---

## 3. Sequence Diagram (Appointment Booking)

Illustrates the step-by-step logic for booking an appointment.

### Mermaid Diagram
```mermaid
sequenceDiagram
    autonumber
    actor P as Patient
    participant G as API Gateway
    participant A as Appointment Service
    participant D as Doctor Service
    participant N as Notification Service

    P->>G: Request Booking (POST /appointments)
    G->>G: Validate JWT
    G->>A: Forward Request
    A->>D: Check Doctor Availability (GET /doctors/{id}/slots)
    D-->>A: Slot Available
    A->>A: Create Appointment Record (Status: PENDING)
    A->>N: Trigger Notification (Event: APPT_CREATED)
    N-->>P: Send Alert (In-App/Email)
    A-->>P: Return Success (201 Created)
```

### Dependency & Flow Description
1. **Security**: The Gateway ensures the user is authenticated.
2. **Validation**: The Appointment service performs cross-service validation (checking Doctor schedules).
3. **Eventual Consistency**: Notifications are often triggered asynchronously after the main record is saved.

---

## 4. Entity Relationship Diagram (ERD)

Shows the data structure of the core domain entities.

### Mermaid Diagram
```mermaid
erDiagram
    USER ||--o| PATIENT : "is_a"
    USER ||--o| DOCTOR : "is_a"
    PATIENT ||--o{ APPOINTMENT : "books"
    DOCTOR ||--o{ APPOINTMENT : "attends"
    PATIENT ||--o{ INVOICE : "pays"
    APPOINTMENT ||--o| MEDICAL_RECORD : "generates"
    MEDICAL_RECORD ||--o{ LAB_RESULT : "contains"

    USER {
        string username
        string password
        string role
    }
    PATIENT {
        long id
        string name
        string bloodGroup
        string contact
    }
    DOCTOR {
        long id
        string name
        string specialty
        string availability
    }
    APPOINTMENT {
        long id
        datetime dateTime
        string status
    }
    INVOICE {
        long id
        double amount
        string status
    }
```

### Data Flow Description
- **Normalization**: Data is split across service boundaries. For example, the `Appointment` table stores `patientId` and `doctorId` as foreign keys referencing entities in other microservices.
- **Auth Linkage**: Every `Patient` and `Doctor` record maps back to a `User` entity in the `auth-service` via a unique identifier.

---

## 🤖 ChatGPT Prompt for Documentation Generation

*Copy and paste the following prompt into ChatGPT to get detailed documentation:*

> "I am working on a Healthcare Management System (HMS) built with Spring Boot microservices and Angular. Please help me generate detailed technical documentation for the following diagrams I have:
> 
> 1. **Architecture**: Microservices (Auth, Patient, Doctor, Appointment, Billing, Lab, records, Pharmacy, Notification, Reporting) connected via a Spring Cloud API Gateway and Eureka Discovery Server. Each has its own MySQL database.
> 2. **Use Case**: Actors include Patients (booking, history), Doctors (prescribing, schedules), and Admins (billing, reports).
> 3. **Sequence**: A booking flow where the Appointment service calls the Doctor service to verify slots and then triggers the Notification service.
> 4. **Entities**: Core entities are User (Auth), Patient, Doctor, Appointment, Invoice, and MedicalRecord.
> 
> Please provide:
> - A detailed 'System Overview' section.
> - A 'Component Interaction' guide explaining how the services talk to each other.
> - A 'Database Schema' description focusing on how microservice data isolation is handled.
> - A 'Security Flow' description for JWT-based authentication at the Gateway."

---

## 🤖 ChatGPT Prompt for Code Refinement

> "Based on a microservices HMS architecture (Spring Boot) with an API Gateway and individual MySQL DBs, write a Java Spring Boot Controller and Service implementation for a 'Billing Service'. 
> - It should have endpoints to create an invoice, get all invoices for a patient, and update payment status.
> - It should use a Feign Client to get Patient details from the 'Patient Service'.
> - Include basic JPA Entity mapping for an 'Invoice' class with fields: id, patientId, amount, date, status (PAID/UNPAID)."

