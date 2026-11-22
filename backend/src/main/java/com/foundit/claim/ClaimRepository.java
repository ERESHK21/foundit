package com.foundit.claim;

import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ClaimRepository extends JpaRepository<Claim, Long> {

    List<Claim> findByItemIdAndStatus(Long itemId, ClaimStatus status);

    long countByItemId(Long itemId);

    long countByItemIdAndStatusNot(Long itemId, ClaimStatus status);

    boolean existsByItemIdAndClaimantIdAndStatusIn(Long itemId, Long claimantId, List<ClaimStatus> statuses);

    long countByClaimantId(Long claimantId);

    Page<Claim> findByClaimantIdOrderByCreatedAtDesc(Long claimantId, Pageable pageable);

    Page<Claim> findByStatusOrderByMatchScoreDesc(ClaimStatus status, Pageable pageable);

    Page<Claim> findAllByOrderByMatchScoreDesc(Pageable pageable);

    long countByStatus(ClaimStatus status);

    Optional<Claim> findByIdAndClaimantId(Long id, Long claimantId);

    long countByItemIdAndStatus(Long itemId, ClaimStatus status);
}
