package com.sharepad.service;

import com.sharepad.model.ShareEntity;
import com.sharepad.model.SharedFileEntity;
import com.sharepad.repository.ShareRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class CleanupService {

    private final ShareRepository shareRepository;
    private final StorageService storageService;

    @Scheduled(fixedDelayString = "${sharepad.cleanup-interval-ms:60000}")
    @Transactional
    public void cleanupExpiredShares() {
        Instant now = Instant.now();
        List<ShareEntity> expiredShares = shareRepository.findByExpiresAtBeforeAndActiveTrue(now);

        if (!expiredShares.isEmpty()) {
            log.info("Found {} expired shares to cleanup", expiredShares.size());

            for (ShareEntity share : expiredShares) {
                log.info("Purging expired share: {}", share.getCode());
                for (SharedFileEntity file : share.getFiles()) {
                    storageService.deleteFile(file.getStorageKey());
                }
                share.setActive(false);
                shareRepository.save(share);
            }
        }
    }
}
