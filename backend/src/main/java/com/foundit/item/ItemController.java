package com.foundit.item;

import com.foundit.auth.AuthFacade;
import com.foundit.common.ApiException;
import com.foundit.common.PageResponse;
import com.foundit.user.User;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/items")
public class ItemController {

    private final ItemService itemService;
    private final AuthFacade auth;

    public ItemController(ItemService itemService, AuthFacade auth) {
        this.itemService = itemService;
        this.auth = auth;
    }

    @GetMapping
    public PageResponse<ItemResponse> list(
            @RequestParam(required = false) ItemType type,
            @RequestParam(required = false) ItemStatus status,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String q,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size) {
        return itemService.search(type, status, category, q, page, size, currentOrNull());
    }

    @GetMapping("/{id}")
    public ItemResponse get(@PathVariable Long id) {
        return itemService.get(id, currentOrNull());
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ItemResponse create(@Valid @RequestBody ItemRequest request) {
        return itemService.create(request, auth.current());
    }

    @PutMapping("/{id}")
    public ItemResponse update(@PathVariable Long id, @Valid @RequestBody ItemRequest request) {
        return itemService.update(id, request, auth.current());
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        itemService.delete(id, auth.current());
    }

    @PostMapping("/{id}/image")
    public ImageResponse uploadImage(@PathVariable Long id, @RequestParam("file") MultipartFile file) {
        return new ImageResponse(itemService.attachImage(id, file, auth.current()).imageUrl());
    }

    @PostMapping("/{id}/return")
    @PreAuthorize("hasAnyRole('STAFF','ADMIN')")
    public ItemResponse markReturned(@PathVariable Long id) {
        return itemService.markReturned(id, auth.current());
    }

    private User currentOrNull() {
        try {
            return auth.current();
        } catch (ApiException ex) {
            return null;
        }
    }
}
