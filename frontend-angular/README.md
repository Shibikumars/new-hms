# Angular Frontend (Separated)

## Important URLs
- Frontend UI: `http://localhost:4200`
- API Gateway: `http://localhost:8080`

> `http://localhost:8080` is backend-only. Opening it directly in browser root path will show Spring Whitelabel 404 unless a route is mapped.

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
