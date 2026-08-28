package com.sharepad.service;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.HexFormat;

@Service
public class PasswordService {

    private final PasswordEncoder passwordEncoder = new BCryptPasswordEncoder();
    private final String secretKey;

    public PasswordService() {
        byte[] keyBytes = new byte[32];
        new SecureRandom().nextBytes(keyBytes);
        this.secretKey = Base64.getEncoder().encodeToString(keyBytes);
    }

    public String hashPassword(String rawPassword) {
        if (rawPassword == null || rawPassword.isBlank()) {
            return null;
        }
        return passwordEncoder.encode(rawPassword);
    }

    public boolean verifyPassword(String rawPassword, String encodedPassword) {
        if (encodedPassword == null || encodedPassword.isBlank()) {
            return true;
        }
        if (rawPassword == null) {
            return false;
        }
        return passwordEncoder.matches(rawPassword, encodedPassword);
    }

    public String generateShareToken(String shareCode) {
        try {
            long exp = System.currentTimeMillis() + (24 * 60 * 60 * 1000L); // 24 hours
            String payload = shareCode + ":" + exp;
            
            Mac hmac = Mac.getInstance("HmacSHA256");
            SecretKeySpec secret = new SecretKeySpec(secretKey.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
            hmac.init(secret);
            byte[] signature = hmac.doFinal(payload.getBytes(StandardCharsets.UTF_8));
            
            String sigHex = HexFormat.of().formatHex(signature);
            String tokenData = Base64.getUrlEncoder().withoutPadding().encodeToString(payload.getBytes(StandardCharsets.UTF_8));
            return tokenData + "." + sigHex;
        } catch (Exception e) {
            throw new RuntimeException("Error generating share token", e);
        }
    }

    public boolean validateShareToken(String shareCode, String token) {
        if (token == null || token.isBlank()) {
            return false;
        }
        try {
            String[] parts = token.split("\\.");
            if (parts.length != 2) return false;
            
            String payloadStr = new String(Base64.getUrlDecoder().decode(parts[0]), StandardCharsets.UTF_8);
            String expectedSigHex = parts[1];
            
            Mac hmac = Mac.getInstance("HmacSHA256");
            SecretKeySpec secret = new SecretKeySpec(secretKey.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
            hmac.init(secret);
            byte[] signature = hmac.doFinal(payloadStr.getBytes(StandardCharsets.UTF_8));
            String actualSigHex = HexFormat.of().formatHex(signature);
            
            if (!actualSigHex.equals(expectedSigHex)) {
                return false;
            }
            
            String[] payloadParts = payloadStr.split(":");
            if (payloadParts.length != 2) return false;
            
            String tokenShareCode = payloadParts[0];
            long exp = Long.parseLong(payloadParts[1]);
            
            if (System.currentTimeMillis() > exp) {
                return false;
            }
            
            return tokenShareCode.equals(shareCode);
        } catch (Exception e) {
            return false;
        }
    }
}
