package com.sharepad.dto;

import lombok.Builder;
import lombok.Data;
import java.time.Instant;
import java.util.List;

@Data
@Builder
public class ShareResponse {
    private String code;
    private boolean hasPassword;
    private boolean isUnlocked;
    private Instant createdAt;
    private Instant expiresAt;
    private String content;
    private List<FileEventDto> files;
}
