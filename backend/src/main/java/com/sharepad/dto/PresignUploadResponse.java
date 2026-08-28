package com.sharepad.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PresignUploadResponse {
    private String fileId;
    private String uploadUrl;
    private String storageKey;
}
