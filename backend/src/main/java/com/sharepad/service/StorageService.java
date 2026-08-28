package com.sharepad.service;

import com.sharepad.config.S3Config;
import com.sharepad.dto.PresignUploadResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest;
import software.amazon.awssdk.services.s3.presigner.model.PutObjectPresignRequest;

import java.io.File;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.Duration;
import java.util.UUID;

@Slf4j
@Service
public class StorageService {

    private final S3Config s3Config;
    private final S3Client s3Client;
    private final S3Presigner s3Presigner;

    @Value("${sharepad.r2.bucket:sharepad-storage}")
    private String bucketName;

    @Value("${sharepad.mock-storage-dir:./backend-uploads}")
    private String mockStorageDir;

    @Value("${server.port:8080}")
    private int serverPort;

    @Autowired
    public StorageService(S3Config s3Config,
                          @Autowired(required = false) S3Client s3Client,
                          @Autowired(required = false) S3Presigner s3Presigner) {
        this.s3Config = s3Config;
        this.s3Client = s3Client;
        this.s3Presigner = s3Presigner;
    }

    public PresignUploadResponse generatePresignedUpload(String shareCode, String fileName, String contentType) {
        String fileId = UUID.randomUUID().toString();
        String storageKey = shareCode + "/" + fileId + "-" + sanitizeFileName(fileName);

        if (s3Config.isR2Configured() && s3Presigner != null) {
            PutObjectRequest objectRequest = PutObjectRequest.builder()
                    .bucket(bucketName)
                    .key(storageKey)
                    .contentType(contentType != null ? contentType : "application/octet-stream")
                    .build();

            PutObjectPresignRequest presignRequest = PutObjectPresignRequest.builder()
                    .signatureDuration(Duration.ofMinutes(15))
                    .putObjectRequest(objectRequest)
                    .build();

            String uploadUrl = s3Presigner.presignPutObject(presignRequest).url().toString();
            log.info("Generated R2 presigned upload URL for key: {}", storageKey);

            return PresignUploadResponse.builder()
                    .fileId(fileId)
                    .uploadUrl(uploadUrl)
                    .storageKey(storageKey)
                    .build();
        } else {
            // Local mock storage fallback mode
            ensureMockStorageDir();
            String uploadUrl = "http://localhost:" + serverPort + "/api/v1/mock-storage/upload/" + storageKey;
            log.info("Generated Local mock upload URL for key: {}", storageKey);

            return PresignUploadResponse.builder()
                    .fileId(fileId)
                    .uploadUrl(uploadUrl)
                    .storageKey(storageKey)
                    .build();
        }
    }

    public String generatePresignedDownload(String storageKey) {
        if (s3Config.isR2Configured() && s3Presigner != null) {
            GetObjectRequest getObjectRequest = GetObjectRequest.builder()
                    .bucket(bucketName)
                    .key(storageKey)
                    .build();

            GetObjectPresignRequest presignRequest = GetObjectPresignRequest.builder()
                    .signatureDuration(Duration.ofHours(1))
                    .getObjectRequest(getObjectRequest)
                    .build();

            return s3Presigner.presignGetObject(presignRequest).url().toString();
        } else {
            return "http://localhost:" + serverPort + "/api/v1/mock-storage/download/" + storageKey;
        }
    }

    public void deleteFile(String storageKey) {
        if (s3Config.isR2Configured() && s3Client != null) {
            try {
                s3Client.deleteObject(DeleteObjectRequest.builder()
                        .bucket(bucketName)
                        .key(storageKey)
                        .build());
                log.info("Deleted object from R2: {}", storageKey);
            } catch (Exception e) {
                log.error("Failed to delete object from R2: {}", storageKey, e);
            }
        } else {
            try {
                Path filePath = Paths.get(mockStorageDir, storageKey);
                Files.deleteIfExists(filePath);
                log.info("Deleted local file: {}", filePath);
            } catch (Exception e) {
                log.error("Failed to delete local file: {}", storageKey, e);
            }
        }
    }

    private void ensureMockStorageDir() {
        try {
            File dir = new File(mockStorageDir);
            if (!dir.exists()) {
                dir.mkdirs();
            }
        } catch (Exception e) {
            log.error("Failed to create mock storage directory", e);
        }
    }

    private String sanitizeFileName(String fileName) {
        if (fileName == null) return "unnamed-file";
        return fileName.replaceAll("[^a-zA-Z0-9._-]", "_");
    }
}
