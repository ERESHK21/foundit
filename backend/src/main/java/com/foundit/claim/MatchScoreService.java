package com.foundit.claim;

import com.foundit.item.Item;
import java.util.Arrays;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;

/**
 * Blind claim verification.
 *
 * <p>The reporter stores a private {@code hiddenDetail} that only staff and the reporter can read.
 * A claimant never sees it, so whatever they write reveals how much they really know about the item.
 * We compare their message against that private detail (70% weight) and the public description
 * (30% weight) and return a transparent 0-100 confidence score.</p>
 */
@Service
public class MatchScoreService {

    private static final Set<String> STOPWORDS = Set.of(
            "the", "a", "an", "and", "or", "of", "to", "in", "on", "at", "is", "it", "this", "that",
            "with", "for", "my", "was", "were", "has", "have", "had", "me", "mine", "its", "from",
            "near", "about", "there", "when", "where", "which", "some", "very", "really", "lost",
            "found", "item", "please", "think", "maybe", "like", "but", "not", "you", "your", "i");

    public int score(Item item, String claimMessage) {
        Set<String> hidden = tokens(item.getHiddenDetail());
        Set<String> description = tokens(item.getDescription());
        Set<String> claimed = tokens(claimMessage);

        if (claimed.isEmpty()) {
            return 0;
        }
        double descriptionCoverage = coverage(description, claimed);
        if (hidden.isEmpty()) {
            return clamp((int) Math.round(descriptionCoverage * 60));
        }
        double hiddenCoverage = coverage(hidden, claimed);
        return clamp((int) Math.round(100 * (0.7 * hiddenCoverage + 0.3 * descriptionCoverage)));
    }

    public String label(int score) {
        if (score >= 60) {
            return "LIKELY";
        }
        if (score >= 30) {
            return "POSSIBLE";
        }
        return "WEAK";
    }

    private static double coverage(Set<String> expected, Set<String> claimed) {
        if (expected.isEmpty()) {
            return 0;
        }
        long matched = expected.stream().filter(claimed::contains).count();
        return matched / (double) expected.size();
    }

    private static Set<String> tokens(String text) {
        if (text == null || text.isBlank()) {
            return Set.of();
        }
        return Arrays.stream(text.toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9\\s]", " ").split("\\s+"))
                .filter(token -> token.length() >= 3 && !STOPWORDS.contains(token))
                .collect(Collectors.toSet());
    }

    private static int clamp(int value) {
        return Math.max(0, Math.min(100, value));
    }
}
