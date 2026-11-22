package com.foundit.item;

import com.foundit.claim.ClaimRepository;
import com.foundit.common.ApiException;
import com.foundit.common.PageResponse;
import com.foundit.notification.NotificationService;
import com.foundit.user.User;
import java.time.Instant;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ItemService {

    private final ItemRepository items;
    private final ClaimRepository claims;
    private final ImageStorageService imageStorage;
    private final NotificationService notifications;

    public ItemService(ItemRepository items, ClaimRepository claims, ImageStorageService imageStorage,
            NotificationService notifications) {
        this.items = items;
        this.claims = claims;
        this.imageStorage = imageStorage;
        this.notifications = notifications;
    }

    @Transactional
    public ItemResponse create(ItemRequest request, User reporter) {
        Item item = new Item();
        apply(item, request);
        item.setReporter(reporter);
        item.setStatus(ItemStatus.OPEN);
        items.save(item);
        return toResponse(item, reporter);
    }

    @Transactional
    public ItemResponse update(Long id, ItemRequest request, User actor) {
        Item item = load(id);
        requireOwnerOrAdmin(item, actor);
        if (item.getStatus() != ItemStatus.OPEN) {
            throw ApiException.conflict("Only open reports can be edited");
        }
        apply(item, request);
        item.setUpdatedAt(Instant.now());
        return toResponse(item, actor);
    }

    @Transactional
    public void delete(Long id, User actor) {
        Item item = load(id);
        requireOwnerOrAdmin(item, actor);
        if (claims.countByItemId(id) > 0) {
            throw ApiException.conflict("This report already has claims. Close it instead of deleting.");
        }
        items.delete(item);
    }

    @Transactional(readOnly = true)
    public ItemResponse get(Long id, User viewer) {
        return toResponse(load(id), viewer);
    }

    @Transactional(readOnly = true)
    public PageResponse<ItemResponse> search(ItemType type, ItemStatus status, String category, String q,
            int page, int size, User viewer) {
        Page<Item> result = items.findAll(
                ItemSpecs.filter(type, status, category, q),
                PageRequest.of(Math.max(page, 0), clampSize(size), Sort.by(Sort.Direction.DESC, "createdAt")));
        return PageResponse.of(result, item -> toResponse(item, viewer));
    }

    @Transactional(readOnly = true)
    public PageResponse<ItemResponse> mine(User user, int page, int size) {
        Page<Item> result = items.findByReporterIdOrderByCreatedAtDesc(
                user.getId(), PageRequest.of(Math.max(page, 0), clampSize(size)));
        return PageResponse.of(result, item -> toResponse(item, user));
    }

    @Transactional
    public ItemResponse attachImage(Long id, org.springframework.web.multipart.MultipartFile file, User actor) {
        Item item = load(id);
        requireOwnerOrAdmin(item, actor);
        item.setImageUrl(imageStorage.store(file));
        item.setUpdatedAt(Instant.now());
        return toResponse(item, actor);
    }

    @Transactional
    public ItemResponse markReturned(Long id, User staff) {
        Item item = load(id);
        if (item.getStatus() != ItemStatus.CLAIMED) {
            throw ApiException.conflict("Only claimed items can be marked as returned");
        }
        item.setStatus(ItemStatus.RETURNED);
        item.setUpdatedAt(Instant.now());
        notifications.notify(item.getReporter(), "Item returned",
                "\"" + item.getTitle() + "\" has been marked as returned to its owner.");
        return toResponse(item, staff);
    }

    private void apply(Item item, ItemRequest request) {
        item.setType(request.type());
        item.setTitle(request.title().trim());
        item.setDescription(request.description().trim());
        item.setCategory(request.category() == null || request.category().isBlank() ? "Other" : request.category().trim());
        item.setLocationName(request.locationName());
        item.setEventDate(request.eventDate());
        item.setImageUrl(request.imageUrl());
        if (request.hiddenDetail() != null && !request.hiddenDetail().isBlank()) {
            item.setHiddenDetail(request.hiddenDetail().trim());
        }
    }

    private Item load(Long id) {
        return items.findById(id).orElseThrow(() -> ApiException.notFound("Item"));
    }

    private void requireOwnerOrAdmin(Item item, User actor) {
        boolean owner = item.getReporter().getId().equals(actor.getId());
        boolean admin = actor.getRole() == com.foundit.user.Role.ADMIN;
        if (!owner && !admin) {
            throw ApiException.forbidden("Only the reporter can change this report");
        }
    }

    private ItemResponse toResponse(Item item, User viewer) {
        boolean revealed = viewer != null
                && (viewer.getId().equals(item.getReporter().getId()) || viewer.isStaff());
        return new ItemResponse(
                item.getId(),
                item.getType().name(),
                item.getTitle(),
                item.getDescription(),
                item.getCategory(),
                item.getLocationName(),
                item.getEventDate(),
                item.getImageUrl(),
                item.getStatus().name(),
                item.getReporter().getId(),
                item.getReporter().getName(),
                revealed ? item.getHiddenDetail() : null,
                revealed,
                claims.countByItemId(item.getId()),
                item.getCreatedAt());
    }

    private static int clampSize(int size) {
        return Math.min(Math.max(size, 1), 50);
    }
}
