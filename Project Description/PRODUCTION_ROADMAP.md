"# 🛡️ SharePad Production Deployment Roadmap

This document serves as the master blueprint for transitioning SharePad from development to a production-grade environment. To avoid "blunders," we will follow a strict **Phase-Gate** approach: no phase is started until the previous one is validated.

---

## 🏁 Phase 1: The "Hardening" Phase (Code Level)
*Goal: Remove development shortcuts and ensure the application is secure by default.*

### 1.1 Database Transition (The Most Critical Step)
- [ ] **Driver Swap**: Remove `h2` from `pom.xml` and add `postgresql` or `mysql-connector-java`.
- [ ] **Schema Versioning**: Integrate **Flyway** or **Liquibase**. 
    - *Why?* Manually running SQL scripts in production is where most blunders happen. Versioned migrations ensure the DB state is consistent across all environments.
- [ ] **Connection Pooling**: Configure **HikariCP** (Spring Boot default) for production loads (max pool size, idle timeout).

### 1.2 Security Lockdown
- [ ] **Disable Dev Tools**: Explicitly disable `spring.h2.console.enabled` and any `spring-boot-devtools`.
- [ ] **Strict CORS**: Replace `allowedOrigins("*")` with a specific whitelist of production domains.
- [ ] **Secure Headers**: Implement `Spring Security` headers to prevent XSS and Clickjacking.
- [ ] **Secret Externalization**: 
    - Remove all default values from `application.yml` (e.g., `${R2_BUCKET_NAME:sharepad-storage}`).
    - Production should fail to start if a required secret is missing, rather than falling back to a "default" that might be incorrect.

### 1.3 Frontend Production Build
- [ ] **API Base URL**: Move the backend URL to a `.env.production` file.
- [ ] **Build Validation**: Run `npm run build` and verify that the `dist/` folder is generated without errors.

---

## 🐳 Phase 2: The "Packaging" Phase (Infrastructure as Code)
*Goal: Create immutable artifacts that behave the same way on every machine.*

### 2.1 Multi-Stage Backend Dockerization
- [ ] **Build Stage**: Use `maven:3.9-eclipse-temurin-17` to compile the JAR.
- [ ] **Run Stage**: Use `eclipse-temurin:17-jre-alpine` (a lightweight JRE) to run the JAR.
    - *Benefit*: Reduces attack surface and image size.
- [ ] **Non-Root User**: Configure the Dockerfile to run the application as a non-privileged user (`USER spring`).

### 2.2 Frontend Nginx Packaging
- [ ] **Static Serving**: Use an Nginx Alpine image to serve the `dist/` folder.
- [ ] **SPA Routing**: Configure `try_files $uri $uri/ /index.html;` in Nginx to prevent 404s on page refresh.

### 2.3 Orchestration
- [ ] **Docker Compose**: Create a `docker-compose.prod.yml` that links:
    - `backend-service`
    - `frontend-service`
    - `postgres-db` (with persistent volume mounts).

---

## 🚀 Phase 3: The "Deployment" Phase (Execution)
*Goal: Deploy to the server with zero downtime and secure networking.*

### 3.1 Infrastructure Setup
- [ ] **SSL Certification**: Install **Certbot/Let's Encrypt** to obtain HTTPS certificates.
- [ ] **Reverse Proxy (Nginx)**: Setup a primary Nginx instance to:
    - Terminate SSL (HTTPS $\rightarrow$ HTTP).
    - Route `/api` $\rightarrow$ Backend Container.
    - Route `/` $\rightarrow$ Frontend Container.

### 3.2 Environment Variable Injection
- [ ] **Secure Store**: Inject secrets (AWS keys, DB passwords) using a `.env` file (restricted permissions `chmod 600`) or a cloud secret manager.

---

## 🧪 Phase 4: The "Validation" Phase (QA)
*Goal: Confirm that the production environment is stable before inviting users.*

- [ ] **Smoke Tests**: Verify that a user can create a pad, share it, and that the file is actually stored in S3/R2.
- [ ] **Connectivity Test**: Ensure the frontend can communicate with the backend over HTTPS.
- [ ] **Load Test**: Perform a basic stress test (e.g., using JMeter or k6) to ensure the DB connection pool doesn't exhaust.
- [ ] **Log Audit**: Check logs for `WARN` or `ERROR` entries immediately after startup.

---

## 🛠 Phase 5: The "Sustainability" Phase (Operations)
*Goal: Ensure the app stays up and can be recovered from failure.*

- [ ] **Backup Strategy**: Set up a cron job for `pg_dump` (database backups) sent to an offsite location.
- [ ] **Monitoring**: Set up basic uptime monitoring (e.g., UptimeRobot or Prometheus).
- [ ] **Log Rotation**: Configure `logrotate` or a logging driver to prevent the server disk from filling up.

---

## ⚠️ Blunder Prevention Matrix
| Potential Blunder | Prevention Strategy | Validation Check |
| :--- | :--- | :--- |
| **Data Loss** | Persistent Volumes in Docker | Restart container $\rightarrow$ Check if data persists |
| **Secret Leak** | `.gitignore` $\rightarrow$ `.env` | Search git history for "key" or "password" |
| **Security Breach** | Non-root Docker user + HTTPS | Run `docker exec` $\rightarrow$ check current user |
| **API Failures** | Environment-specific URLs | Check browser Network tab for `http` vs `https` |
| **App Crash** | Health Check Endpoints | Call `/actuator/health` |"