package com.sharepad.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "shares")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ShareEntity {

    @Id
    @Column(length = 32, nullable = false, unique = true)
    private String code;

    @Column(columnDefinition = "TEXT")
    private String content;

    private String passwordHash;

    @Column(nullable = false)
    private Instant createdAt;

    @Column(nullable = false)
    private Instant expiresAt;

    @Builder.Default
    @Column(nullable = false)
    private boolean active = true;

    @OneToMany(mappedBy = "share", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @Builder.Default
    private List<SharedFileEntity> files = new ArrayList<>();

    public boolean isExpired() {
        return Instant.now().isAfter(expiresAt);
    }

    public boolean hasPassword() {
        return passwordHash != null && !passwordHash.isBlank();
    }
}
