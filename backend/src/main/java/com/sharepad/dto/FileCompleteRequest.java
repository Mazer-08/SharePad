package com.sharepad.dto;

import lombok.Data;

@Data
public class FileCompleteRequest {
    private String fileId;
    private String fileName;
    private long fileSize;
    private String contentType;
    private String storageKey;
}
