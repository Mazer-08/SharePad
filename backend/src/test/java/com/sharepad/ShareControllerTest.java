package com.sharepad;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sharepad.dto.ShareCreateRequest;
import com.sharepad.dto.VerifyPasswordRequest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
public class ShareControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void testCreateNewShareEndpoint() throws Exception {
        ShareCreateRequest request = new ShareCreateRequest();
        request.setTtlHours(6);

        mockMvc.perform(post("/api/v1/newShare")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.code").exists())
                .andExpect(jsonPath("$.hasPassword").value(false));
    }

    @Test
    void testGetShareNotFound() throws Exception {
        mockMvc.perform(get("/api/v1/share/invalidcode"))
                .andExpect(status().isNotFound());
    }

    @Test
    void testPasswordProtectedShareFlow() throws Exception {
        // 1. Create password protected share
        ShareCreateRequest request = new ShareCreateRequest();
        request.setPassword("pass1234");

        String responseStr = mockMvc.perform(post("/api/v1/newShare")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.hasPassword").value(true))
                .andReturn().getResponse().getContentAsString();

        String code = objectMapper.readTree(responseStr).get("code").asText();

        // 2. Fetch share without token -> isUnlocked should be false
        mockMvc.perform(get("/api/v1/share/" + code))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.hasPassword").value(true))
                .andExpect(jsonPath("$.unlocked").value(false));

        // 3. Verify incorrect password -> 401
        VerifyPasswordRequest badReq = new VerifyPasswordRequest();
        badReq.setPassword("wrongpass");
        mockMvc.perform(post("/api/v1/share/" + code + "/verify-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(badReq)))
                .andExpect(status().isUnauthorized());

        // 4. Verify correct password -> 200 with token
        VerifyPasswordRequest goodReq = new VerifyPasswordRequest();
        goodReq.setPassword("pass1234");
        String verifyRes = mockMvc.perform(post("/api/v1/share/" + code + "/verify-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(goodReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.token").exists())
                .andReturn().getResponse().getContentAsString();

        String token = objectMapper.readTree(verifyRes).get("token").asText();

        // 5. Fetch share with token -> isUnlocked should be true
        mockMvc.perform(get("/api/v1/share/" + code)
                        .header("X-Share-Token", token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.unlocked").value(true));
    }
}
