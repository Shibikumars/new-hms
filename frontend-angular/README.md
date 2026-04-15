# Angular Frontend (Separated)

This frontend connects to the API Gateway at `http://localhost:8080`.

## Features
- Registration and login pages.
- JWT token persistence in **both** `sessionStorage` and `localStorage`.
- Auth interceptor to attach Bearer token automatically.
- Appointment dashboard for listing and booking appointments.

## Run
```bash
npm install
npm start
```

Make sure discovery-service, api-gateway, auth-service, patient-service, doctor-service, and appointment-service are running.
