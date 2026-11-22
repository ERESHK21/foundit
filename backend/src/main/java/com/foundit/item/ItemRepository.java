package com.foundit.item;

import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface ItemRepository extends JpaRepository<Item, Long>, JpaSpecificationExecutor<Item> {

    Optional<Item> findByIdAndReporterId(Long id, Long reporterId);

    long countByReporterId(Long reporterId);

    Page<Item> findByReporterIdOrderByCreatedAtDesc(Long reporterId, Pageable pageable);

    long countByStatus(ItemStatus status);

    long countByType(ItemType type);
}
