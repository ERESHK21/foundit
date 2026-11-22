package com.foundit.admin;

public record StatsResponse(
        long totalItems,
        long lostItems,
        long foundItems,
        long openItems,
        long claimedItems,
        long returnedItems,
        long closedItems,
        long totalClaims,
        long pendingClaims,
        long approvedClaims,
        long rejectedClaims,
        long totalUsers) {
}
