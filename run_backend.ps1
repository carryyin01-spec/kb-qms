$env:JAVA_HOME = "C:\Program Files\Java\jdk-17.0.3.1"
$env:Path = "$env:JAVA_HOME\bin;$env:Path"
Write-Host "Starting QMS Backend (local MySQL, utf8mb4)..."
java -jar backend/target/qms-backend-1.0.0.jar --spring.profiles.active=local --spring.sql.init.mode=never
