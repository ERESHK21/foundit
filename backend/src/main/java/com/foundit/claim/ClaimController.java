package com.foundit.claim;

import com.foundit.auth.AuthFacade;
import com.foundit.common.PageResponse;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class ClaimController {

    private final ClaimService claimService;
    private final AuthFacade auth;

    public ClaimController(ClaimService claimService, AuthFacade auth) {
        this.claimService = claimService;
        this.auth = auth;
    }

    @PostMapping("/items/{itemId}/claims")
    @ResponseStatus(HttpStatus.CREATED)
    public ClaimResponse create(@PathVariable Long itemId, @Valid @RequestBody ClaimRequest request) {
        return claimService.create(itemId, request, auth.current());
    }

    @GetMapping("/claims")
    @PreAuthorize("hasAnyRole('STAFF','ADMIN')")
    public PageResponse<ClaimResponse> queue(
            @RequestParam(required = false) ClaimStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size) {
        return claimService.queue(status, page, size, auth.current());
    }

    @PostMapping("/claims/{id}/approve")
    @PreAuthorize("hasAnyRole('STAFF','ADMIN')")
    public ClaimResponse approve(@PathVariable Long id, @Valid @RequestBody(required = false) DecisionRequest request) {
        return claimService.approve(id, request == null ? new DecisionRequest(null) : request, auth.current());
    }

    @PostMapping("/claims/{id}/reject")
    @PreAuthorize("hasAnyRole('STAFF','ADMIN')")
    public ClaimResponse reject(@PathVariable Long id, @Valid @RequestBody(required = false) DecisionRequest request) {
        return claimService.reject(id, request == null ? new DecisionRequest(null) : request, auth.current());
    }

    @DeleteMapping("/claims/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void withdraw(@PathVariable Long id) {
        claimService.withdraw(id, auth.current());
    }
}
