# HMS Modernized: Healthcare Management System

A modernized, high-performance Healthcare Management System (HMS) built with a Spring Boot microservices backend and an Angular frontend.

## 🚀 Getting Started

### 1. Prerequisites
- Java 17+
- Node.js (v18+) & NPM
- Maven
- MySQL Server 9.6+

### 2. Setup MySQL Database
The system uses MySQL for persistent data storage to maintain user accounts and all healthcare data.

**2.1 Start MySQL Service:**
```powershell
# Start MySQL service (run as Administrator)
Start-Service MySQL96

# Or start manually if service fails:
& "C:\Program Files\MySQL\MySQL Server 9.6\bin\mysqld.exe" --datadir="D:\neww_proj\new-hms\mysql_data" --console --enable-named-pipe
```

**2.2 Initialize Databases:**
```powershell
# Create all required databases and users
$sql = Get-Content "infra/mysql/init/01-hms-databases.sql" -Raw
& "C:\Program Files\MySQL\MySQL Server 9.6\bin\mysql.exe" -u root -e $sql
```

**2.3 Verify Databases:**
```powershell
# Check that all databases are created
& "C:\Program Files\MySQL\MySQL Server 9.6\bin\mysql.exe" -u root -e "SHOW DATABASES;"
```

### 3. Run the Backend (Microservices)
The backend consists of 13 microservices coordinated via a Discovery Server and API Gateway, all using MySQL for persistent storage.

**3.1 Set Environment Variables:**
```powershell
$env:HMS_JWT_SECRET = 'HMS_SUPER_SECRET_KEY_FOR_JWT_VALIDATION_123'
$env:MAVEN_OPTS = '-Xmx140m'
```

**3.2 Automatic Start (Recommended):**
Open PowerShell as Administrator in the root directory and run:
```powershell
.\smart-start.ps1
```
*This will start all 13 services with MySQL connections and verify each service is running.*

**3.3 Alternative Start:**
```powershell
.\start-all.ps1
```

### 4. Run the Frontend (Angular)
Ensure the backend services are running first.
```bash
cd frontend-angular
npm install
npm start
```

### 5. Access the Application
- **Frontend**: `http://localhost:4200`
- **API Gateway**: `http://localhost:8080`
- **Auth Service**: `http://localhost:8082`

## 🔑 Default Login Credentials
- **Username**: `naan_doctor`
- **Password**: `password`
- **Role**: DOCTOR

Other seeded accounts:
- `naan_patient` / `password` (PATIENT)
- `admin` / `password` (ADMIN)
- `shibimsd@gmail.com` / `password` (USER)

## 🗄️ Database Architecture
Each microservice has its own MySQL database:
- `auth_db` - User authentication and sessions
- `patient_db` - Patient records and profiles
- `doctor_db` - Doctor profiles and schedules
- `appointment_db` - Appointment bookings and management
- `billing_db` - Billing and payment records
- `lab_db` - Laboratory test results
- `medicalrecords_db` - Medical history and records
- `notification_db` - System notifications
- `pharmacy_db` - Pharmacy and medication data
- `hms_queue` - Queue management system

## 🔄 Data Persistence
✅ **All user accounts and data are now persistent in MySQL**
✅ **Data survives service restarts**
✅ **Multi-user account management**
✅ **Secure database users with proper permissions**

## 🏥 Module Overview
- **Clinical EMR**: Longitudinal patient history and SOAP notes.
- **Diagnostics**: Real-time lab ordering and automated result reporting.
- **E-Prescribing**: Safety-first pharmacy suite with allergy cross-referencing.
- **Workflows**: Professional appointment agenda and "Clinical Session" synchronization.
- **Alerts**: Global, real-time clinical notification hub.

---
*Maintained at: https://github.com/Shibikumars/new-hms*
