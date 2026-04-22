# HMS Modernized: Healthcare Management System

A modernized, high-performance Healthcare Management System (HMS) built with a Spring Boot microservices backend and an Angular frontend.

## 🚀 Getting Started

### 1. Prerequisites
- Java 17+
- Node.js (v18+) & NPM
- Maven

### 2. Run the Backend (Microservices)
The backend consists of several microservices coordinated via a Discovery Server and API Gateway.

**Automatic Start (Recommended):**
Open PowerShell as Administrator in the root directory and run:
```powershell
.\start-all.ps1
```
*This will start the Discovery Service, API Gateway, and all Clinical services in the background.*

### 3. Run the Frontend (Angular)
Ensure the backend services are running first.
```bash
cd frontend-angular
npm install
npm start
```
Access the application at: `http://localhost:4200`

## 🏥 Module Overview
- **Clinical EMR**: Longitudinal patient history and SOAP notes.
- **Diagnostics**: Real-time lab ordering and automated result reporting.
- **E-Prescribing**: Safety-first pharmacy suite with allergy cross-referencing.
- **Workflows**: Professional appointment agenda and "Clinical Session" synchronization.
- **Alerts**: Global, real-time clinical notification hub.

---
*Maintained at: https://github.com/Shibikumars/new-hms*
