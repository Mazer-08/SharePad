package com.sharepad.repository;

import com.sharepad.model.SharedFileEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface SharedFileRepository extends JpaRepository<SharedFileEntity, String> {
    List<SharedFileEntity> findByShareCode(String shareCode);
}
