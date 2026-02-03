FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app
COPY backend /app/backend
RUN mvn -q -f /app/backend/pom.xml -DskipTests package

FROM eclipse-temurin:17-jre
WORKDIR /app
COPY --from=build /app/backend/target/qms-backend-1.0.0.jar /app/app.jar
EXPOSE 8080
ENTRYPOINT ["java","-jar","/app/app.jar"]

