package com.sharepad.dto;

import lombok.Data;

@Data
public class PresignUploadRequest {
    private String fileName;
    private long fileSize;
    private String contentType;
}
