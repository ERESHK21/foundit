package com.foundit.notification;

import com.foundit.common.ApiException;
import com.foundit.user.User;
import com.foundit.user.UserRepository;
import java.time.Instant;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class NotificationService {

    private final NotificationRepository notifications;
    private final UserRepository users;

    public NotificationService(NotificationRepository notifications, UserRepository users) {
        this.notifications = notifications;
        this.users = users;
    }

    @Transactional
    public void notify(User user, String title, String body) {
        Notification notification = new Notification();
        notification.setUser(user);
        notification.setTitle(title);
        notification.setBody(body);
        notification.setCreatedAt(Instant.now());
        notifications.save(notification);
    }

    @Transactional(readOnly = true)
    public Inbox inbox(User user) {
        List<NotificationResponse> items = notifications.findTop30ByUserIdOrderByCreatedAtDesc(user.getId())
                .stream()
                .map(NotificationResponse::from)
                .toList();
        long unread = notifications.countByUserIdAndReadFlagFalse(user.getId());
        return new Inbox(items, unread);
    }

    @Transactional
    public void markRead(Long id, User user) {
        Notification notification = notifications.findById(id)
                .orElseThrow(() -> ApiException.notFound("Notification"));
        if (!notification.getUser().getId().equals(user.getId())) {
            throw ApiException.forbidden("That notification is not yours");
        }
        notification.setReadFlag(true);
    }

    @Transactional
    public void markAllRead(User user) {
        notifications.findByUserIdAndReadFlagFalse(user.getId()).forEach(n -> n.setReadFlag(true));
    }

    public record Inbox(List<NotificationResponse> items, long unread) {
    }

    public record NotificationResponse(Long id, String title, String body, boolean read, Instant createdAt) {
        static NotificationResponse from(Notification n) {
            return new NotificationResponse(n.getId(), n.getTitle(), n.getBody(), n.isReadFlag(), n.getCreatedAt());
        }
    }
}
