package com.sharepad.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;

@Entity
@Table(name = "shared_files")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SharedFileEntity {

    @Id
    @Column(length = 64, nullable = false)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "share_code", nullable = false)
    @JsonIgnore
    private ShareEntity share;

    @Column(nullable = false)
    private String fileName;

    @Column(nullable = false)
    private long fileSize;

    private String contentType;

    @Column(nullable = false)
    private String storageKey;

    @Column(nullable = false)
    private Instant uploadedAt;
}
