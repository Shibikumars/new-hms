Stop-Process -Name "java" -Force -ErrorAction SilentlyContinue
Start-Process powershell -Verb RunAs -ArgumentList "-WindowStyle Hidden", "-Command", "Restart-Service MySQL96"
Start-Sleep -Seconds 5

$services = @(
    @("discovery-service", 8761),
    @("auth-service", 8082),
    @("api-gateway", 8080),
    @("patient-service", 8081),
    @("doctor-service", 8083),
    @("appointment-service", 8084),
    @("medical-records-service", 8085),
    @("pharmacy-service", 8086),
    @("lab-service", 8087),
    @("billing-service", 8088),
    @("notification-service", 8089),
    @("reporting-service", 8090)
)

foreach ($srv in $services) {
    $name = $srv[0]
    $port = $srv[1]
    Write-Host "Starting $name on port $port..."
    # REDIRECTING TO LOG FILES NOW
    $cmd = "cd d:\neww_proj\new-hms\$name ; ..\discovery-service\mvnw.cmd spring-boot:run -DskipTests > d:\neww_proj\new-hms\$name.log 2>&1"
    Start-Process powershell -ArgumentList "-WindowStyle Hidden", "-Command", $cmd
    
    $up = $false
    for ($i = 0; $i -lt 40; $i++) {
        $c = Test-NetConnection -ComputerName localhost -Port $port -WarningAction SilentlyContinue
        if ($c.TcpTestSucceeded) {
            $up = $true
            Write-Host "$name is UP and listening!"
            Start-Sleep -Seconds 3
            break
        }
        Start-Sleep -Seconds 3
    }
    if (-not $up) {
        Write-Host "WARNING: $name did not bind to $port within timeout!"
    }
}
Write-Host "All services started sequentially with logging enabled!"
