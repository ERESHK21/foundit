package com.foundit.claim;

import com.foundit.common.ApiException;
import com.foundit.common.PageResponse;
import com.foundit.item.Item;
import com.foundit.item.ItemRepository;
import com.foundit.item.ItemStatus;
import com.foundit.notification.NotificationService;
import com.foundit.user.User;
import java.time.Instant;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ClaimService {

    private final ClaimRepository claims;
    private final ItemRepository items;
    private final MatchScoreService matchScore;
    private final NotificationService notifications;

    public ClaimService(ClaimRepository claims, ItemRepository items, MatchScoreService matchScore,
            NotificationService notifications) {
        this.claims = claims;
        this.items = items;
        this.matchScore = matchScore;
        this.notifications = notifications;
    }

    @Transactional
    public ClaimResponse create(Long itemId, ClaimRequest request, User claimant) {
        Item item = items.findById(itemId).orElseThrow(() -> ApiException.notFound("Item"));
        if (item.getStatus() != ItemStatus.OPEN) {
            throw ApiException.conflict("This item is no longer open for claims");
        }
        if (item.getReporter().getId().equals(claimant.getId())) {
            throw ApiException.forbidden("You cannot claim your own report");
        }
        boolean alreadyClaimed = claims.existsByItemIdAndClaimantIdAndStatusIn(
                itemId, claimant.getId(), List.of(ClaimStatus.PENDING, ClaimStatus.APPROVED));
        if (alreadyClaimed) {
            throw ApiException.conflict("You already have an active claim on this item");
        }

        int score = matchScore.score(item, request.message());
        Claim claim = new Claim();
        claim.setItem(item);
        claim.setClaimant(claimant);
        claim.setMessage(request.message().trim());
        claim.setEvidenceUrl(request.evidenceUrl());
        claim.setMatchScore(score);
        claim.setStatus(ClaimStatus.PENDING);
        claims.save(claim);

        notifications.notify(item.getReporter(), "New claim on \"" + item.getTitle() + "\"",
                claimant.getName() + " submitted a claim with a " + score + "% match. Review it from your report.");
        return toResponse(claim, claimant);
    }

    @Transactional(readOnly = true)
    public PageResponse<ClaimResponse> mine(User user, int page, int size) {
        Page<Claim> result = claims.findByClaimantIdOrderByCreatedAtDesc(
                user.getId(), PageRequest.of(Math.max(page, 0), clampSize(size)));
        return PageResponse.of(result, claim -> toResponse(claim, user));
    }

    @Transactional(readOnly = true)
    public PageResponse<ClaimResponse> queue(ClaimStatus status, int page, int size, User staff) {
        PageRequest pageable = PageRequest.of(Math.max(page, 0), clampSize(size),
                Sort.by(Sort.Direction.DESC, "matchScore").and(Sort.by(Sort.Direction.DESC, "createdAt")));
        Page<Claim> result = status == null
                ? claims.findAllByOrderByMatchScoreDesc(pageable)
                : claims.findByStatusOrderByMatchScoreDesc(status, pageable);
        return PageResponse.of(result, claim -> toResponse(claim, staff));
    }

    @Transactional
    public ClaimResponse approve(Long claimId, DecisionRequest request, User reviewer) {
        Claim claim = load(claimId);
        if (claim.getStatus() != ClaimStatus.PENDING) {
            throw ApiException.conflict("Only pending claims can be reviewed");
        }
        Item item = claim.getItem();
        if (item.getStatus() != ItemStatus.OPEN) {
            throw ApiException.conflict("This item is not open anymore");
        }

        claim.setStatus(ClaimStatus.APPROVED);
        claim.setReviewedBy(reviewer);
        claim.setReviewedAt(Instant.now());
        claim.setDecisionNote(request.note());
        item.setStatus(ItemStatus.CLAIMED);
        item.setUpdatedAt(Instant.now());

        for (Claim other : claims.findByItemIdAndStatus(item.getId(), ClaimStatus.PENDING)) {
            if (!other.getId().equals(claim.getId())) {
                other.setStatus(ClaimStatus.REJECTED);
                other.setReviewedBy(reviewer);
                other.setReviewedAt(Instant.now());
                other.setDecisionNote("Another claimant was verified for this item.");
                notifications.notify(other.getClaimant(), "Claim closed",
                        "Your claim on \"" + item.getTitle() + "\" was not selected. Another claimant was verified.");
            }
        }

        notifications.notify(claim.getClaimant(), "Claim approved",
                "Your ownership of \"" + item.getTitle() + "\" was verified. Collect it from the lost-and-found desk.");
        notifications.notify(item.getReporter(), "Item claimed",
                "\"" + item.getTitle() + "\" was handed to a verified owner.");
        return toResponse(claim, reviewer);
    }

    @Transactional
    public ClaimResponse reject(Long claimId, DecisionRequest request, User reviewer) {
        Claim claim = load(claimId);
        if (claim.getStatus() != ClaimStatus.PENDING) {
            throw ApiException.conflict("Only pending claims can be reviewed");
        }
        claim.setStatus(ClaimStatus.REJECTED);
        claim.setReviewedBy(reviewer);
        claim.setReviewedAt(Instant.now());
        claim.setDecisionNote(request.note());
        notifications.notify(claim.getClaimant(), "Claim rejected",
                "Your claim on \"" + claim.getItem().getTitle() + "\" was rejected. "
                        + (request.note() == null || request.note().isBlank() ? "" : "Reason: " + request.note()));
        return toResponse(claim, reviewer);
    }

    @Transactional
    public void withdraw(Long claimId, User claimant) {
        Claim claim = claims.findByIdAndClaimantId(claimId, claimant.getId())
                .orElseThrow(() -> ApiException.notFound("Claim"));
        if (claim.getStatus() != ClaimStatus.PENDING) {
            throw ApiException.conflict("Only pending claims can be withdrawn");
        }
        claim.setStatus(ClaimStatus.WITHDRAWN);
        claim.setDecisionNote("Withdrawn by claimant.");
    }

    private Claim load(Long id) {
        return claims.findById(id).orElseThrow(() -> ApiException.notFound("Claim"));
    }

    private ClaimResponse toResponse(Claim claim, User viewer) {
        Item item = claim.getItem();
        boolean staffView = viewer != null && viewer.isStaff();
        return new ClaimResponse(
                claim.getId(),
                item.getId(),
                item.getTitle(),
                item.getStatus().name(),
                item.getImageUrl(),
                staffView ? item.getHiddenDetail() : null,
                claim.getClaimant().getId(),
                claim.getClaimant().getName(),
                claim.getMessage(),
                claim.getEvidenceUrl(),
                claim.getMatchScore(),
                matchScore.label(claim.getMatchScore()),
                claim.getStatus().name(),
                claim.getDecisionNote(),
                claim.getReviewedBy() == null ? null : claim.getReviewedBy().getName(),
                claim.getCreatedAt(),
                claim.getReviewedAt());
    }

    private static int clampSize(int size) {
        return Math.min(Math.max(size, 1), 50);
    }
}
