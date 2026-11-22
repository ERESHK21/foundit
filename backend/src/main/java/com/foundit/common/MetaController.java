package com.foundit.common;

import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class MetaController {

    public static final List<String> CATEGORIES = List.of(
            "Electronics", "ID Card", "Bag", "Keys", "Books", "Clothing", "Accessories", "Other");

    @GetMapping("/categories")
    public List<String> categories() {
        return CATEGORIES;
    }

    @GetMapping("/health")
    public java.util.Map<String, String> health() {
        return java.util.Map.of(
                "status", "ok",
                "service", "foundit-backend",
                "time", java.time.Instant.now().toString());
    }
}
