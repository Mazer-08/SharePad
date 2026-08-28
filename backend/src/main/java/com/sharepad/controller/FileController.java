package com.sharepad.controller;

import com.sharepad.dto.*;
import com.sharepad.model.ShareEntity;
import com.sharepad.model.SharedFileEntity;
import com.sharepad.service.PasswordService;
import com.sharepad.service.ShareService;
import com.sharepad.service.StorageService;
import com.sharepad.websocket.ShareWebSocketHandler;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@Slf4j
@RestController
@RequestMapping("/api/v1/share/{code}/files")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class FileController {

    private final ShareService shareService;
    private final StorageService storageService;
    private final PasswordService passwordService;
    private final ShareWebSocketHandler webSocketHandler;

    private boolean checkAuth(ShareEntity share, String token) {
        if (!share.hasPassword()) return true;
        return passwordService.validateShareToken(share.getCode(), token);
    }

    @PostMapping("/presign-upload")
    public ResponseEntity<?> presignUpload(
            @PathVariable String code,
            @RequestBody PresignUploadRequest request,
            @RequestHeader(value = "X-Share-Token", required = false) String token) {

        Optional<ShareEntity> shareOpt = shareService.getActiveShare(code);
        if (shareOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Share not found or expired"));
        }

        if (!checkAuth(shareOpt.get(), token)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Unauthorized access"));
        }

        PresignUploadResponse response = storageService.generatePresignedUpload(
                code, request.getFileName(), request.getContentType());

        return ResponseEntity.ok(response);
    }

    @PostMapping("/complete")
    public ResponseEntity<?> completeUpload(
            @PathVariable String code,
            @RequestBody FileCompleteRequest request,
            @RequestHeader(value = "X-Share-Token", required = false) String token) {

        Optional<ShareEntity> shareOpt = shareService.getActiveShare(code);
        if (shareOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Share not found or expired"));
        }

        if (!checkAuth(shareOpt.get(), token)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Unauthorized access"));
        }

        SharedFileEntity file = shareService.addFileToShare(
                code,
                request.getFileId(),
                request.getFileName(),
                request.getFileSize(),
                request.getContentType(),
                request.getStorageKey());

        FileEventDto fileEvent = FileEventDto.builder()
                .id(file.getId())
                .fileName(file.getFileName())
                .fileSize(file.getFileSize())
                .contentType(file.getContentType())
                .downloadUrl(storageService.generatePresignedDownload(file.getStorageKey()))
                .uploadedAt(file.getUploadedAt())
                .build();

        // Broadcast WebSocket event to all connected clients in this room!
        webSocketHandler.broadcastFileEvent(code, fileEvent);

        return ResponseEntity.ok(fileEvent);
    }

    @GetMapping("/{fileId}/presign-download")
    public ResponseEntity<?> presignDownload(
            @PathVariable String code,
            @PathVariable String fileId,
            @RequestHeader(value = "X-Share-Token", required = false) String token) {

        Optional<ShareEntity> shareOpt = shareService.getActiveShare(code);
        if (shareOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Share not found or expired"));
        }

        if (!checkAuth(shareOpt.get(), token)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Unauthorized access"));
        }

        Optional<SharedFileEntity> fileOpt = shareOpt.get().getFiles().stream()
                .filter(f -> f.getId().equals(fileId))
                .findFirst();

        if (fileOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "File not found"));
        }

        String downloadUrl = storageService.generatePresignedDownload(fileOpt.get().getStorageKey());
        return ResponseEntity.ok(Map.of("downloadUrl", downloadUrl));
    }
}
