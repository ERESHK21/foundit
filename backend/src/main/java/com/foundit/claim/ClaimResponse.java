package com.foundit.claim;

import java.time.Instant;

public record ClaimResponse(
        Long id,
        Long itemId,
        String itemTitle,
        String itemStatus,
        String itemImageUrl,
        String itemHiddenDetail,
        Long claimantId,
        String claimantName,
        String message,
        String evidenceUrl,
        int matchScore,
        String matchLabel,
        String status,
        String decisionNote,
        String reviewedBy,
        Instant createdAt,
        Instant reviewedAt) {
}
