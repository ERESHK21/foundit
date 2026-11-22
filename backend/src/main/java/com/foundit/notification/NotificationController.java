package com.foundit.notification;

import com.foundit.auth.AuthFacade;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService notificationService;
    private final AuthFacade auth;

    public NotificationController(NotificationService notificationService, AuthFacade auth) {
        this.notificationService = notificationService;
        this.auth = auth;
    }

    @GetMapping
    public NotificationService.Inbox inbox() {
        return notificationService.inbox(auth.current());
    }

    @PostMapping("/{id}/read")
    public NotificationService.Inbox markRead(@PathVariable Long id) {
        notificationService.markRead(id, auth.current());
        return notificationService.inbox(auth.current());
    }

    @PostMapping("/read-all")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void markAllRead() {
        notificationService.markAllRead(auth.current());
    }
}
