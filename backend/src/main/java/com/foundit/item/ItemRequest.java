package com.foundit.item;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;

public record ItemRequest(
        @NotNull(message = "Type is required (LOST or FOUND)")
        ItemType type,

        @NotBlank(message = "Title is required")
        @Size(max = 120, message = "Title is too long")
        String title,

        @NotBlank(message = "Description is required")
        @Size(max = 2000, message = "Description is too long")
        String description,

        @Size(max = 40, message = "Category is too long")
        String category,

        @Size(max = 120, message = "Location is too long")
        String locationName,

        LocalDate eventDate,

        @Size(max = 500, message = "Image URL is too long")
        String imageUrl,

        /** Optional private detail used by the claim matcher. */
        @Size(max = 500, message = "Private detail is too long")
        String hiddenDetail) {
}
