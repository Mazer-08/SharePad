"# 🚀 SharePad - Ephemeral Code & File Sharing Workspace

SharePad is a full-stack application designed for the temporary sharing of code and files. It allows users to create a secure, password-protected sharing session where files are stored temporarily and automatically cleaned up after a set TTL (Time-to-Live).

## 🌟 Key Features
- **Ephemeral Storage**: Files are not stored forever; they have a configurable TTL.
- **Secure Sharing**: Support for password-protected shares to ensure only intended recipients access the data.
- **Real-time Synchronization**: Integrated WebSockets for live updates and collaboration within the workspace.
- **Cloud-Native Storage**: Integrated with S3-compatible storage (AWS S3 / Cloudflare R2) for scalable file handling.
- **Presigned URLs**: Secure uploads and downloads using presigned URLs to offload traffic from the backend.

---

## 🛠 Tech Stack

### Backend
- **Java 17** & **Spring Boot 3.2.3**
- **Spring Data JPA**: Database abstraction.
- **Spring Security**: Authentication and access control.
- **Spring WebSocket**: Real-time communication.
- **AWS SDK**: S3 integration for file storage.
- **H2 Database**: (Dev) Lightweight in-memory storage.

### Frontend
- **React 19**
- **Vite**: High-performance build tool.
- **Lucide React**: Iconography.
- **Canvas-Confetti**: UI polish for successful shares.

---

## 📂 Backend Architecture Detail

The backend follows a strict layered architecture to ensure separation of concerns and maintainability.

### 1. Layout Structure
`backend/src/main/java/com/sharepad/`
- **`config/`**: Infrastructure configuration.
    - `S3Config.java`: Sets up the S3 client for Cloudflare R2/AWS.
    - `SecurityConfig.java`: Defines security filters and endpoint permissions.
    - `WebSocketConfig.java`: Configures the WebSocket message broker and endpoints.
- **`controller/`**: The API Layer. Handles HTTP requests.
    - `ShareController.java`: Manages the creation and verification of shares.
    - `FileController.java`: Handles presigned URL generation for uploads/downloads.
    - `MockStorageController.java`: Fallback controller for local storage testing.
- **`service/`**: The Business Logic Layer.
    - `ShareService.java`: Core logic for creating shares and managing ownership.
    - `StorageService.java`: Interfaces with S3 to manage file lifecycle and URLs.
    - `PasswordService.java`: Handles encryption and verification of share passwords.
    - `CleanupService.java`: A scheduled background task that deletes expired shares and files.
- **`repository/`**: The Data Access Layer.
    - `ShareRepository.java` & `SharedFileRepository.java`: Spring Data JPA interfaces for DB operations.
- **`model/`**: The Domain Layer (Entities).
    - `ShareEntity.java`: Represents a sharing session (owner, password, expiration).
    - `SharedFileEntity.java`: Represents a specific file attached to a share.
- **`dto/`**: Data Transfer Objects.
    - Defines the request/response shapes for the API (e.g., `ShareCreateRequest`, `PresignUploadResponse`) to avoid exposing entities directly.
- **`websocket/`**: Real-time Logic.
    - `ShareWebSocketHandler.java`: Manages active socket connections and broadcasts events (like file upload completions) to all users in a shared session.

---

## 🚀 Getting Started

### Prerequisites
- Java 17
- Maven
- Node.js & npm
- An S3-compatible bucket (AWS S3 or Cloudflare R2)

### Backend Setup
1. Navigate to the `backend` folder.
2. Update `src/main/resources/application.yml` with your R2/S3 credentials:
   ```yaml
   sharepad:
     r2:
       endpoint: your-endpoint
       access-key-id: your-access-key
       secret-access-key: your-secret-key
       bucket: your-bucket-name
   ```
3. Run the application:
   ```bash
   mvn spring-boot:run
   ```

### Frontend Setup
1. Navigate to the `frontend` folder.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

---

## ⚙️ Workflow Diagram
1. **User** $\rightarrow$ Requests a new Share $\rightarrow$ **ShareController** $\rightarrow$ **ShareService** $\rightarrow$ **DB**.
2. **User** $\rightarrow$ Requests Upload URL $\rightarrow$ **FileController** $\rightarrow$ **StorageService** $\rightarrow$ **S3 (Presigned URL)**.
3. **User** $\rightarrow$ Uploads File $\rightarrow$ **S3** $\rightarrow$ **WebSocket** $\rightarrow$ **Notify other Users**.
4. **Background** $\rightarrow$ **CleanupService** $\rightarrow$ Deletes expired records from **DB** & **S3**.
"