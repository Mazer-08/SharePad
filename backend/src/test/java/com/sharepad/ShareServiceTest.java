package com.sharepad;

import com.sharepad.dto.ShareCreateRequest;
import com.sharepad.model.ShareEntity;
import com.sharepad.service.ShareService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
public class ShareServiceTest {

    @Autowired
    private ShareService shareService;

    @Test
    void testCreateShareAndRetrieve() {
        ShareCreateRequest request = new ShareCreateRequest();
        request.setTtlHours(6);
        request.setInitialContent("Hello SharePad!");

        ShareEntity share = shareService.createShare(request);
        assertNotNull(share.getCode());
        assertEquals(6, share.getCode().length());
        assertFalse(share.hasPassword());

        Optional<ShareEntity> retrieved = shareService.getActiveShare(share.getCode());
        assertTrue(retrieved.isPresent());
        assertEquals("Hello SharePad!", retrieved.get().getContent());
    }

    @Test
    void testCreateShareWithPassword() {
        ShareCreateRequest request = new ShareCreateRequest();
        request.setPassword("mySecretPass123");

        ShareEntity share = shareService.createShare(request);
        assertTrue(share.hasPassword());
    }

    @Test
    void testUpdateContent() {
        ShareEntity share = shareService.createShare(null);
        boolean updated = shareService.updateContent(share.getCode(), "New text content");

        assertTrue(updated);
        Optional<ShareEntity> retrieved = shareService.getActiveShare(share.getCode());
        assertTrue(retrieved.isPresent());
        assertEquals("New text content", retrieved.get().getContent());
    }
}
