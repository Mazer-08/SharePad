package com.sharepad.controller;

import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.nio.file.Path;
import java.nio.file.Paths;

@Slf4j
@RestController
@RequestMapping("/api/v1/mock-storage")
@CrossOrigin(origins = "*")
public class MockStorageController {

    @Value("${sharepad.mock-storage-dir:./backend-uploads}")
    private String mockStorageDir;

    @PutMapping("/upload/**")
    public ResponseEntity<?> handleMockUpload(HttpServletRequest request) {
        try {
            String fullPath = request.getRequestURI();
            String prefix = "/api/v1/mock-storage/upload/";
            String storageKey = fullPath.substring(fullPath.indexOf(prefix) + prefix.length());

            Path targetPath = Paths.get(mockStorageDir, storageKey);
            File targetFile = targetPath.toFile();
            File parentDir = targetFile.getParentFile();
            if (parentDir != null && !parentDir.exists()) {
                parentDir.mkdirs();
            }

            try (InputStream inputStream = request.getInputStream();
                 FileOutputStream outputStream = new FileOutputStream(targetFile)) {
                inputStream.transferTo(outputStream);
            }

            log.info("Mock storage uploaded file key: {}, size: {} bytes", storageKey, targetFile.length());
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            log.error("Error in mock storage upload", e);
            return ResponseEntity.internalServerError().body("Upload failed: " + e.getMessage());
        }
    }

    @GetMapping("/download/**")
    public ResponseEntity<Resource> handleMockDownload(HttpServletRequest request) {
        try {
            String fullPath = request.getRequestURI();
            String prefix = "/api/v1/mock-storage/download/";
            String storageKey = fullPath.substring(fullPath.indexOf(prefix) + prefix.length());

            Path filePath = Paths.get(mockStorageDir, storageKey);
            Resource resource = new UrlResource(filePath.toUri());

            if (!resource.exists() || !resource.isReadable()) {
                return ResponseEntity.notFound().build();
            }

            String originalName = filePath.getFileName().toString();
            // strip fileId prefix if present
            if (originalName.contains("-")) {
                originalName = originalName.substring(originalName.indexOf("-") + 1);
            }

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + originalName + "\"")
                    .contentType(MediaType.APPLICATION_OCTET_STREAM)
                    .body(resource);
        } catch (Exception e) {
            log.error("Error in mock storage download", e);
            return ResponseEntity.internalServerError().build();
        }
    }
}
