package com.foundit.admin;

import com.foundit.claim.ClaimRepository;
import com.foundit.claim.ClaimStatus;
import com.foundit.item.ItemRepository;
import com.foundit.item.ItemStatus;
import com.foundit.item.ItemType;
import com.foundit.user.UserRepository;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasAnyRole('STAFF','ADMIN')")
public class AdminController {

    private final ItemRepository items;
    private final ClaimRepository claims;
    private final UserRepository users;

    public AdminController(ItemRepository items, ClaimRepository claims, UserRepository users) {
        this.items = items;
        this.claims = claims;
        this.users = users;
    }

    @GetMapping("/stats")
    public StatsResponse stats() {
        return new StatsResponse(
                items.count(),
                items.countByType(ItemType.LOST),
                items.countByType(ItemType.FOUND),
                items.countByStatus(ItemStatus.OPEN),
                items.countByStatus(ItemStatus.CLAIMED),
                items.countByStatus(ItemStatus.RETURNED),
                items.countByStatus(ItemStatus.CLOSED),
                claims.count(),
                claims.countByStatus(ClaimStatus.PENDING),
                claims.countByStatus(ClaimStatus.APPROVED),
                claims.countByStatus(ClaimStatus.REJECTED),
                users.count());
    }
}
