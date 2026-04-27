# Set environment variables
$env:HMS_JWT_SECRET = 'HMS_SUPER_SECRET_KEY_FOR_JWT_VALIDATION_123'
$env:MAVEN_OPTS = '-Xmx140m'

Write-Host "Cleaning up stale Java processes..."
Stop-Process -Name "java" -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

$services = @(
    @("discovery-service", 8761),
    @("auth-service", 8082),
    @("api-gateway", 8080),
    @("patient-service", 8081),
    @("doctor-service", 8083),
    @("appointment-service", 8084),
    @("billing-service", 8088),
    @("lab-service", 8087),
    @("medical-records-service", 8085),
    @("notification-service", 8089),
    @("pharmacy-service", 8086),
    @("queue-service", 8092),
    @("reporting-service", 8090)
)

Write-Host "STABILITY MODE: Running all 13 services with H2 In-Memory DB bypass..."

foreach ($srv in $services) {
    $name = $srv[0]
    $port = $srv[1]
    Write-Host "Starting $name on port $port..."
    
    $workDir = "$PSScriptRoot\$name"
    $logFile = "$PSScriptRoot\$name.log"
    $mvnw = "$PSScriptRoot\discovery-service\mvnw.cmd"
    
    $cmd = "cd '$workDir'; & '$mvnw' spring-boot:run -DskipTests > '$logFile' 2>&1"
    Start-Process powershell -ArgumentList "-WindowStyle Hidden", "-Command", $cmd
    
    $up = $false
    for ($i = 0; $i -lt 40; $i++) {
        $c = Test-NetConnection -ComputerName localhost -Port $port -WarningAction SilentlyContinue
        if ($c.TcpTestSucceeded) {
            $up = $true
            Write-Host "$name is UP and Running!"
            Start-Sleep -Seconds 5
            break
        }
        Start-Sleep -Seconds 3
    }
}
Write-Host "Full HMS Suite (13 Services) initiated."
