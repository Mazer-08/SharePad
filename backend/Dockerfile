# ---- Build stage ----
FROM eclipse-temurin:17-jdk-alpine AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
# Download Maven wrapper and build
COPY .mvn .mvn
COPY mvnw .
RUN chmod +x mvnw && ./mvnw clean package -DskipTests

# ---- Runtime stage ----
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=build /app/target/sharepad-backend-1.0.0-SNAPSHOT.jar app.jar

EXPOSE 8080

# Activate the prod profile
ENV SPRING_PROFILES_ACTIVE=prod

ENTRYPOINT ["java", "-jar", "app.jar"]
