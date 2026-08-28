package com.sharepad.service;

import com.sharepad.dto.FileEventDto;
import com.sharepad.dto.ShareCreateRequest;
import com.sharepad.dto.ShareResponse;
import com.sharepad.model.ShareEntity;
import com.sharepad.model.SharedFileEntity;
import com.sharepad.repository.ShareRepository;
import com.sharepad.repository.SharedFileRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ShareService {

    private final ShareRepository shareRepository;
    private final SharedFileRepository sharedFileRepository;
    private final PasswordService passwordService;
    private final StorageService storageService;

    @Value("${sharepad.default-ttl-hours:6}")
    private int defaultTtlHours;

    private static final String CODE_ALPHABET = "23456789abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ";
    private static final SecureRandom RANDOM = new SecureRandom();

    @Transactional
    public ShareEntity createShare(ShareCreateRequest request) {
        String code = generateUniqueCode();
        int ttlHours = (request != null && request.getTtlHours() != null && request.getTtlHours() > 0)
                ? request.getTtlHours()
                : defaultTtlHours;

        String passwordHash = (request != null && request.getPassword() != null)
                ? passwordService.hashPassword(request.getPassword())
                : null;

        String initialContent = (request != null && request.getInitialContent() != null)
                ? request.getInitialContent()
                : "";

        Instant now = Instant.now();
        Instant expiresAt = now.plus(ttlHours, ChronoUnit.HOURS);

        ShareEntity share = ShareEntity.builder()
                .code(code)
                .content(initialContent)
                .passwordHash(passwordHash)
                .createdAt(now)
                .expiresAt(expiresAt)
                .active(true)
                .build();

        log.info("Creating new share with code: {}, expiresAt: {}", code, expiresAt);
        return shareRepository.save(share);
    }

    public Optional<ShareEntity> getActiveShare(String code) {
        Optional<ShareEntity> shareOpt = shareRepository.findByCodeAndActiveTrue(code);
        if (shareOpt.isPresent()) {
            ShareEntity share = shareOpt.get();
            if (share.isExpired()) {
                log.info("Share {} requested but is expired", code);
                return Optional.empty();
            }
            return Optional.of(share);
        }
        return Optional.empty();
    }

    @Transactional
    public boolean updateContent(String code, String content) {
        Optional<ShareEntity> shareOpt = getActiveShare(code);
        if (shareOpt.isPresent()) {
            ShareEntity share = shareOpt.get();
            share.setContent(content);
            shareRepository.save(share);
            return true;
        }
        return false;
    }

    @Transactional
    public SharedFileEntity addFileToShare(String code, String fileId, String fileName, long fileSize, String contentType, String storageKey) {
        Optional<ShareEntity> shareOpt = getActiveShare(code);
        if (shareOpt.isEmpty()) {
            throw new IllegalArgumentException("Share not found or expired: " + code);
        }
        ShareEntity share = shareOpt.get();

        SharedFileEntity fileEntity = SharedFileEntity.builder()
                .id(fileId)
                .share(share)
                .fileName(fileName)
                .fileSize(fileSize)
                .contentType(contentType)
                .storageKey(storageKey)
                .uploadedAt(Instant.now())
                .build();

        return sharedFileRepository.save(fileEntity);
    }

    public ShareResponse toShareResponse(ShareEntity share, boolean isUnlocked) {
        List<FileEventDto> files = share.getFiles().stream()
                .map(file -> FileEventDto.builder()
                        .id(file.getId())
                        .fileName(file.getFileName())
                        .fileSize(file.getFileSize())
                        .contentType(file.getContentType())
                        .downloadUrl(storageService.generatePresignedDownload(file.getStorageKey()))
                        .uploadedAt(file.getUploadedAt())
                        .build())
                .collect(Collectors.toList());

        return ShareResponse.builder()
                .code(share.getCode())
                .hasPassword(share.hasPassword())
                .isUnlocked(isUnlocked)
                .createdAt(share.getCreatedAt())
                .expiresAt(share.getExpiresAt())
                .content(isUnlocked ? share.getContent() : null)
                .files(isUnlocked ? files : List.of())
                .build();
    }

    private String generateUniqueCode() {
        for (int attempt = 0; attempt < 10; attempt++) {
            StringBuilder sb = new StringBuilder(6);
            for (int i = 0; i < 6; i++) {
                sb.append(CODE_ALPHABET.charAt(RANDOM.nextInt(CODE_ALPHABET.length())));
            }
            String code = sb.toString();
            if (!shareRepository.existsById(code)) {
                return code;
            }
        }
        // Fallback with timestamp suffix if collision
        return "s" + System.currentTimeMillis() % 100000;
    }
}
