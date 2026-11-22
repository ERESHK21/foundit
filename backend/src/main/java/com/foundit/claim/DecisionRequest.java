package com.foundit.claim;

import jakarta.validation.constraints.Size;

public record DecisionRequest(
        @Size(max = 500, message = "Note is too long")
        String note) {
}
