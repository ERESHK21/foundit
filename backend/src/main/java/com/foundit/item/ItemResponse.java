package com.foundit.item;

import java.time.Instant;
import java.time.LocalDate;

public record ItemResponse(
        Long id,
        String type,
        String title,
        String description,
        String category,
        String locationName,
        LocalDate eventDate,
        String imageUrl,
        String status,
        Long reporterId,
        String reporterName,
        String hiddenDetail,
        boolean hiddenDetailRevealed,
        long claimCount,
        Instant createdAt) {
}
