package com.sharepad.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FileEventDto {
    private String id;
    private String fileName;
    private long fileSize;
    private String contentType;
    private String downloadUrl;
    private Instant uploadedAt;
}
