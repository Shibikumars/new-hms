$services = @("discovery-service", "api-gateway", "auth-service", "patient-service", "doctor-service", "appointment-service", "lab-service", "medical-records-service", "pharmacy-service", "billing-service", "notification-service", "reporting-service")

foreach ($service in $services) {
    Write-Host "Starting $service..."
    $cmd = "cd '$PSScriptRoot\$service' ; & '$PSScriptRoot\discovery-service\mvnw.cmd' spring-boot:run -DskipTests > '$PSScriptRoot\$service.log' 2>&1"
    Start-Process powershell -ArgumentList "-WindowStyle Hidden", "-Command", $cmd
    Start-Sleep -Seconds 5
}
Write-Host "All backend services initiated in background. logs written to .log files."
