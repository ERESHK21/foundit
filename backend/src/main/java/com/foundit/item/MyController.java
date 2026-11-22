package com.foundit.item;

import com.foundit.auth.AuthFacade;
import com.foundit.claim.ClaimResponse;
import com.foundit.claim.ClaimService;
import com.foundit.common.PageResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/my")
public class MyController {

    private final ItemService itemService;
    private final ClaimService claimService;
    private final AuthFacade auth;

    public MyController(ItemService itemService, ClaimService claimService, AuthFacade auth) {
        this.itemService = itemService;
        this.claimService = claimService;
        this.auth = auth;
    }

    @GetMapping("/items")
    public PageResponse<ItemResponse> myItems(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size) {
        return itemService.mine(auth.current(), page, size);
    }

    @GetMapping("/claims")
    public PageResponse<ClaimResponse> myClaims(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size) {
        return claimService.mine(auth.current(), page, size);
    }
}
