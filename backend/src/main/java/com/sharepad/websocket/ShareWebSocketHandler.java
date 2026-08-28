package com.sharepad.websocket;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.sharepad.dto.FileEventDto;
import com.sharepad.dto.WsMessage;
import com.sharepad.model.ShareEntity;
import com.sharepad.service.PasswordService;
import com.sharepad.service.ShareService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;
import java.net.URI;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

@Slf4j
@Component
@RequiredArgsConstructor
public class ShareWebSocketHandler extends TextWebSocketHandler {

    private final ShareService shareService;
    private final PasswordService passwordService;
    private final ObjectMapper objectMapper = new ObjectMapper().registerModule(new JavaTimeModule());

    // Map of shareCode -> list of active WebSocket sessions
    private final Map<String, List<WebSocketSession>> roomSessions = new ConcurrentHashMap<>();
    // Map of sessionId -> shareCode
    private final Map<String, String> sessionRooms = new ConcurrentHashMap<>();

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        URI uri = session.getUri();
        if (uri == null) {
            session.close(CloseStatus.BAD_DATA);
            return;
        }

        Map<String, String> queryParams = parseQueryParams(uri.getQuery());
        String shareCode = queryParams.get("code");
        String token = queryParams.get("token");

        if (shareCode == null || shareCode.isBlank()) {
            sendErrorAndClose(session, "Missing share code");
            return;
        }

        Optional<ShareEntity> shareOpt = shareService.getActiveShare(shareCode);
        if (shareOpt.isEmpty()) {
            sendErrorAndClose(session, "Share not found or expired");
            return;
        }

        ShareEntity share = shareOpt.get();
        if (share.hasPassword() && !passwordService.validateShareToken(shareCode, token)) {
            sendErrorAndClose(session, "Unauthorized: Password required");
            return;
        }

        // Register session to room
        roomSessions.computeIfAbsent(shareCode, k -> new CopyOnWriteArrayList<>()).add(session);
        sessionRooms.put(session.getId(), shareCode);

        log.info("WebSocket connection established for share: {}, sessionId: {}", shareCode, session.getId());

        // Send initial state to newly connected client
        var shareResponse = shareService.toShareResponse(share, true);
        WsMessage initMsg = WsMessage.builder()
                .type("INIT_STATE")
                .shareCode(shareCode)
                .text(share.getContent())
                .activeUsers(roomSessions.get(shareCode).size())
                .payload(shareResponse)
                .build();
        session.sendMessage(new TextMessage(objectMapper.writeValueAsString(initMsg)));

        // Broadcast presence update to room
        broadcastPresence(shareCode);
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        String shareCode = sessionRooms.get(session.getId());
        if (shareCode == null) return;

        WsMessage wsMsg = objectMapper.readValue(message.getPayload(), WsMessage.class);

        if ("TEXT_UPDATE".equals(wsMsg.getType())) {
            String newText = wsMsg.getText() != null ? wsMsg.getText() : "";
            // Update in-memory / persistent DB state
            shareService.updateContent(shareCode, newText);

            // Broadcast text change to peer clients (exclude sender if desired, or include sender ID)
            WsMessage broadcastMsg = WsMessage.builder()
                    .type("TEXT_UPDATE")
                    .shareCode(shareCode)
                    .senderId(session.getId())
                    .text(newText)
                    .build();

            String jsonPayload = objectMapper.writeValueAsString(broadcastMsg);
            broadcastToRoomExceptSender(shareCode, session.getId(), jsonPayload);
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        String shareCode = sessionRooms.remove(session.getId());
        if (shareCode != null) {
            List<WebSocketSession> sessions = roomSessions.get(shareCode);
            if (sessions != null) {
                sessions.remove(session);
                if (sessions.isEmpty()) {
                    roomSessions.remove(shareCode);
                } else {
                    broadcastPresence(shareCode);
                }
            }
            log.info("WebSocket connection closed for share: {}, sessionId: {}", shareCode, session.getId());
        }
    }

    public void broadcastFileEvent(String shareCode, FileEventDto fileEvent) {
        try {
            WsMessage msg = WsMessage.builder()
                    .type("FILE_ADDED")
                    .shareCode(shareCode)
                    .file(fileEvent)
                    .build();

            String json = objectMapper.writeValueAsString(msg);
            broadcastToRoom(shareCode, json);
        } catch (Exception e) {
            log.error("Error broadcasting file event for share: {}", shareCode, e);
        }
    }

    private void broadcastPresence(String shareCode) {
        List<WebSocketSession> sessions = roomSessions.get(shareCode);
        if (sessions == null) return;

        int activeUsers = sessions.size();
        try {
            WsMessage msg = WsMessage.builder()
                    .type("PRESENCE")
                    .shareCode(shareCode)
                    .activeUsers(activeUsers)
                    .build();

            String json = objectMapper.writeValueAsString(msg);
            broadcastToRoom(shareCode, json);
        } catch (Exception e) {
            log.error("Error broadcasting presence", e);
        }
    }

    private void broadcastToRoom(String shareCode, String jsonPayload) {
        List<WebSocketSession> sessions = roomSessions.get(shareCode);
        if (sessions != null) {
            for (WebSocketSession s : sessions) {
                if (s.isOpen()) {
                    try {
                        s.sendMessage(new TextMessage(jsonPayload));
                    } catch (IOException e) {
                        log.error("Failed to send WS message to session: {}", s.getId(), e);
                    }
                }
            }
        }
    }

    private void broadcastToRoomExceptSender(String shareCode, String senderSessionId, String jsonPayload) {
        List<WebSocketSession> sessions = roomSessions.get(shareCode);
        if (sessions != null) {
            for (WebSocketSession s : sessions) {
                if (s.isOpen() && !s.getId().equals(senderSessionId)) {
                    try {
                        s.sendMessage(new TextMessage(jsonPayload));
                    } catch (IOException e) {
                        log.error("Failed to send WS message to session: {}", s.getId(), e);
                    }
                }
            }
        }
    }

    private void sendErrorAndClose(WebSocketSession session, String errorMsg) {
        try {
            WsMessage err = WsMessage.builder()
                    .type("ERROR")
                    .text(errorMsg)
                    .build();
            session.sendMessage(new TextMessage(objectMapper.writeValueAsString(err)));
            session.close(CloseStatus.POLICY_VIOLATION);
        } catch (IOException e) {
            log.error("Error closing session", e);
        }
    }

    private Map<String, String> parseQueryParams(String query) {
        if (query == null || query.isBlank()) return Collections.emptyMap();
        Map<String, String> map = new HashMap<>();
        for (String param : query.split("&")) {
            String[] pair = param.split("=");
            if (pair.length == 2) {
                map.put(pair[0], pair[1]);
            } else if (pair.length == 1) {
                map.put(pair[0], "");
            }
        }
        return map;
    }
}
