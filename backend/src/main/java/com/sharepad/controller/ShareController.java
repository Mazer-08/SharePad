package com.sharepad.controller;

import com.sharepad.dto.*;
import com.sharepad.model.ShareEntity;
import com.sharepad.service.PasswordService;
import com.sharepad.service.ShareService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@Slf4j
@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ShareController {

    private final ShareService shareService;
    private final PasswordService passwordService;

    @PostMapping("/newShare")
    public ResponseEntity<Map<String, Object>> createNewShare(@RequestBody(required = false) ShareCreateRequest request) {
        ShareEntity share = shareService.createShare(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "code", share.getCode(),
                "hasPassword", share.hasPassword(),
                "expiresAt", share.getExpiresAt().toString()
        ));
    }

    @GetMapping("/share/{code}")
    public ResponseEntity<?> getShare(
            @PathVariable String code,
            @RequestHeader(value = "X-Share-Token", required = false) String token) {

        Optional<ShareEntity> shareOpt = shareService.getActiveShare(code);
        if (shareOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Share not found or expired"));
        }

        ShareEntity share = shareOpt.get();

        if (!share.hasPassword()) {
            return ResponseEntity.ok(shareService.toShareResponse(share, true));
        }

        // Has password: check token
        boolean isUnlocked = passwordService.validateShareToken(code, token);
        return ResponseEntity.ok(shareService.toShareResponse(share, isUnlocked));
    }

    @PostMapping("/share/{code}/verify-password")
    public ResponseEntity<VerifyPasswordResponse> verifyPassword(
            @PathVariable String code,
            @RequestBody VerifyPasswordRequest request) {

        Optional<ShareEntity> shareOpt = shareService.getActiveShare(code);
        if (shareOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(VerifyPasswordResponse.builder()
                            .success(false)
                            .message("Share not found or expired")
                            .build());
        }

        ShareEntity share = shareOpt.get();
        if (!share.hasPassword()) {
            String token = passwordService.generateShareToken(code);
            return ResponseEntity.ok(VerifyPasswordResponse.builder()
                    .success(true)
                    .token(token)
                    .message("No password required")
                    .build());
        }

        if (passwordService.verifyPassword(request.getPassword(), share.getPasswordHash())) {
            String token = passwordService.generateShareToken(code);
            return ResponseEntity.ok(VerifyPasswordResponse.builder()
                    .success(true)
                    .token(token)
                    .message("Password verified")
                    .build());
        }

        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(VerifyPasswordResponse.builder()
                        .success(false)
                        .message("Invalid password")
                        .build());
    }
}
