package com.sharepad.repository;

import com.sharepad.model.ShareEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Repository
public interface ShareRepository extends JpaRepository<ShareEntity, String> {
    Optional<ShareEntity> findByCodeAndActiveTrue(String code);
    List<ShareEntity> findByExpiresAtBeforeAndActiveTrue(Instant now);
}
