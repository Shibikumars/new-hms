# Set environment variables for MySQL
$env:HMS_JWT_SECRET = 'HMS_SUPER_SECRET_KEY_FOR_JWT_VALIDATION_123'
$env:MAVEN_OPTS = '-Xmx140m'

Write-Host "Starting all 13 services with MySQL database..."

# Stop any existing Java processes
Write-Host "Cleaning up stale Java processes..."
Stop-Process -Name "java" -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 3

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

Write-Host "MYSQL MODE: Running all 13 services with MySQL database..."

foreach ($srv in $services) {
    $name = $srv[0]
    $port = $srv[1]
    Write-Host "Starting $name on port $port..."
    
    $workDir = "d:\neww_proj\new-hms\$name"
    $logFile = "d:\neww_proj\new-hms\$name.log"
    $mvnw = "..\discovery-service\mvnw.cmd"
    
    $cmd = "cd '$workDir'; &$mvnw spring-boot:run -DskipTests > '$logFile' 2>&1"
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
    
    if (-not $up) {
        Write-Host "WARNING: $name failed to start within timeout period"
    }
}

Write-Host "All services started with MySQL database connections."
Write-Host "Testing MySQL connections..."

# Test MySQL connection
try {
    $result = & "C:\Program Files\MySQL\MySQL Server 9.6\bin\mysql.exe" -u root -e "SELECT 'MySQL is working' as status;" 2>$null
    if ($result -match "MySQL is working") {
        Write-Host "✅ MySQL database is accessible"
    } else {
        Write-Host "❌ MySQL database connection failed"
    }
} catch {
    Write-Host "❌ MySQL database connection failed: $_"
}

# Test authentication
try {
    $loginResult = Invoke-RestMethod -Uri "http://localhost:8080/auth/login" -Method POST -ContentType "application/json" -Body '{"username":"naan_doctor","password":"password","rememberMe":false}' -ErrorAction SilentlyContinue
    if ($loginResult.token) {
        Write-Host "✅ Authentication is working with MySQL"
    } else {
        Write-Host "❌ Authentication failed"
    }
} catch {
    Write-Host "❌ Authentication test failed: $_"
}

Write-Host "Full HMS Suite with MySQL is ready!"
Write-Host "Access the application at: http://localhost:4200"
