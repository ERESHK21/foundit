package com.foundit.claim;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ClaimRequest(
        @NotBlank(message = "Describe the item so we can verify you")
        @Size(max = 1000, message = "Message is too long")
        String message,

        @Size(max = 500, message = "Evidence URL is too long")
        String evidenceUrl) {
}
