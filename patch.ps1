function Patch-AppYml($path, $dbName) {
    if (-Not (Test-Path $path)) { return }
    $content = Get-Content $path -Raw
    
    # Datasource patches
    $content = $content -replace "url: jdbc:mysql:.*", "url: jdbc:h2:mem:$dbName;DB_CLOSE_DELAY=-1;MODE=MySQL`n    driver-class-name: org.h2.Driver"
    $content = $content -replace "username: .*", "username: sa"
    $content = $content -replace "password: .*", "password: `n  h2:`n    console:`n      enabled: true"
    
    # Hibernate dialect
    $content = $content -replace "dialect: org.hibernate.dialect.MySQLDialect", "dialect: org.hibernate.dialect.H2Dialect"
    
    # DDL auto
    $content = $content -replace "ddl-auto: .*", "ddl-auto: update"
    
    Set-Content $path -Value $content -Encoding UTF8
    Write-Host "Patched $path"
}

Patch-AppYml "lab-service\src\main\resources\application.yml" "lab_db"
Patch-AppYml "medical-records-service\src\main\resources\application.yml" "medical_records_db"
Patch-AppYml "notification-service\src\main\resources\application.yml" "notification_db"
Patch-AppYml "pharmacy-service\src\main\resources\application.yml" "pharmacy_db"
Patch-AppYml "queue-service\src\main\resources\application.yml" "hms_queue"

# Now change queue-service port to 8092 to avoid conflict with notification-service
$qPath = "queue-service\src\main\resources\application.yml"
if (Test-Path $qPath) {
    $qContent = Get-Content $qPath -Raw
    $qContent = $qContent -replace "port: 8089", "port: 8092"
    $qContent = $qContent -replace "flyway:`n    enabled: true", "flyway:`n    enabled: false"
    Set-Content $qPath -Value $qContent -Encoding UTF8
    Write-Host "Patched port on queue-service"
}
