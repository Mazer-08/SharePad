# ---- Build stage ----
# Compile natively on the build platform for fast builds
FROM --platform=$BUILDPLATFORM maven:3.9.6-eclipse-temurin-17 AS build
WORKDIR /app

# Cache dependencies
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy source and build JAR
COPY src ./src
RUN mvn clean package -DskipTests -B

# ---- Runtime stage ----
# Multi-arch runtime image for linux/amd64 and linux/arm64
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=build /app/target/sharepad-backend-1.0.0-SNAPSHOT.jar app.jar

EXPOSE 8080

# Activate the prod profile
ENV SPRING_PROFILES_ACTIVE=prod

ENTRYPOINT ["java", "-jar", "app.jar"]
