package com.sharepad.dto;

import lombok.Data;

@Data
public class ShareCreateRequest {
    private String password;
    private Integer ttlHours;
    private String initialContent;
}
