$env:JAVA_HOME = "C:\Program Files\Java\jdk-17.0.3.1"
$env:MAVEN_HOME = "C:\maven\apache-maven-3.9.6"
$env:Path = "$env:JAVA_HOME\bin;$env:MAVEN_HOME\bin;$env:Path"
Write-Host "Building Backend with JDK 17 and Maven 3.9.6..."
mvn clean package -DskipTests -f backend/pom.xml