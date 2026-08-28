package com.sharepad.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WsMessage {
    private String type; // INIT_STATE, TEXT_UPDATE, FILE_ADDED, PRESENCE, ERROR
    private String shareCode;
    private String senderId;
    private String text;
    private FileEventDto file;
    private Integer activeUsers;
    private Object payload;
}
