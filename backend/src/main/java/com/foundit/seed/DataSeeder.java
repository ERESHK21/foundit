package com.foundit.seed;

import com.foundit.auth.AuthService;
import com.foundit.claim.ClaimRequest;
import com.foundit.claim.ClaimService;
import com.foundit.claim.DecisionRequest;
import com.foundit.item.ItemRequest;
import com.foundit.item.ItemService;
import com.foundit.item.ItemType;
import com.foundit.user.Role;
import com.foundit.user.User;
import com.foundit.user.UserRepository;
import java.time.LocalDate;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class DataSeeder implements ApplicationRunner {

    private static final String PASSWORD = "Password123!";

    private final UserRepository users;
    private final ItemService items;
    private final ClaimService claims;
    private final PasswordEncoder encoder;

    public DataSeeder(UserRepository users, ItemService items, ClaimService claims, PasswordEncoder encoder) {
        this.users = users;
        this.items = items;
        this.claims = claims;
        this.encoder = encoder;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (users.count() > 0) {
            return;
        }

        User staff = user("Desk Staff", "staff@foundit.dev", Role.STAFF);
        user("Admin", "admin@foundit.dev", Role.ADMIN);
        User meera = user("Meera Nair", "meera@campus.edu", Role.USER);
        User aarav = user("Aarav Shah", "aarav@campus.edu", Role.USER);
        User rohan = user("Rohan Verma", "rohan@campus.edu", Role.USER);
        User sana = user("Sana Iqbal", "sana@campus.edu", Role.USER);

        Map<String, Long> ids = seedItems(meera, aarav).entrySet().stream()
                .collect(Collectors.toMap(Map.Entry::getKey, e -> e.getValue().id()));

        Long airpods = ids.get("Blue AirPods Pro case");
        Long idCard = ids.get("Student ID card");
        Long keys = ids.get("Bunch of 3 keys with a blue tag");
        Long wallet = ids.get("Black Fossil wallet");

        // Vague claim: low score. Specific claim: high score. Staff approves the specific one.
        claims.create(airpods, new ClaimRequest(
                "I think I lost my AirPods case somewhere near the library, it is white and small.", null), rohan);
        Long winning = claims.create(airpods, new ClaimRequest(
                "It has a crack on the hinge and a red dot sticker on the left earbud.", null), sana).id();
        claims.approve(winning, new DecisionRequest("Claimant described the private detail exactly."), staff);

        claims.create(idCard, new ClaimRequest(
                "The card belongs to Rahul Sharma and the card number ends with 4471.", null), rohan);
        claims.create(keys, new ClaimRequest(
                "The blue tag reads hostel room 214.", null), aarav);
        claims.create(wallet, new ClaimRequest(
                "I saw a black wallet in the cafeteria with a library card and a photo of a dog inside.", null), sana);
    }

    private Map<String, com.foundit.item.ItemResponse> seedItems(User meera, User aarav) {
        return java.util.List.of(
                found(meera, "Blue AirPods Pro case", "Small white charging case found on a study desk on the second floor. No engraving.",
                        "Electronics", "Central Library, 2nd floor", 2,
                        "crack on the hinge and a red dot sticker on the left earbud"),
                found(meera, "Student ID card", "Plastic ID card found near the basketball court. Name is partially faded.",
                        "ID Card", "Sports Complex", 1,
                        "card number ends 4471 and the photo has a blue background"),
                found(meera, "Bunch of 3 keys with a blue tag", "Three keys on a metal ring with a blue plastic tag.",
                        "Keys", "Main gate bus stop", 3,
                        "tag reads hostel room 214"),
                found(meera, "Brown leather notebook", "A5 notebook with an elastic band, found after the seminar.",
                        "Books", "Auditorium", 4,
                        "first page has a pencil sketch of a guitar"),
                found(meera, "Silver water bottle", "One litre steel bottle, slightly scratched, left in the canteen.",
                        "Other", "Block C canteen", 2,
                        "dent near the base and a panda sticker"),
                found(meera, "Sunglasses in a black case", "Folding sunglasses with a black hard case found in the parking lot.",
                        "Accessories", "Parking lot", 5,
                        "scratch on the left lens"),
                found(meera, "Black umbrella", "Compact black umbrella left in the stand near the library entrance.",
                        "Other", "Library entrance", 1,
                        "wooden handle with a small chip"),
                lost(aarav, "Black Fossil wallet", "Bifold wallet with worn edges. No cash inside.",
                        "Accessories", "Cafeteria", 1,
                        "contains a library card and a photo of a dog"),
                lost(aarav, "Casio fx-991 calculator", "Scientific calculator with a slide cover, name sticker removed.",
                        "Electronics", "Exam hall 3", 3,
                        "name written in red on the back and a cracked screen corner"),
                lost(aarav, "Navy blue hoodie", "Size M hoodie, drawstring missing, left in the gym.",
                        "Clothing", "Gym", 2,
                        "gym token in the left pocket"),
                lost(aarav, "White wired earphones", "3.5mm wired earphones with a tangled cable.",
                        "Electronics", "Lecture hall B", 4,
                        "right earbud is silent"),
                lost(aarav, "Prescription glasses", "Rectangular glasses kept in a soft pouch.",
                        "Accessories", "Central Library", 6,
                        "brown frame and one screw is missing"))
                .stream()
                .map(itemRequest -> items.create(itemRequest, itemRequest.type() == ItemType.FOUND ? meera : aarav))
                .collect(Collectors.toMap(
                        com.foundit.item.ItemResponse::title,
                        Function.identity(),
                        (a, b) -> a));
    }

    private ItemRequest found(User reporter, String title, String description, String category,
            String location, int daysAgo, String hidden) {
        return build(ItemType.FOUND, title, description, category, location, daysAgo, hidden);
    }

    private ItemRequest lost(User reporter, String title, String description, String category,
            String location, int daysAgo, String hidden) {
        return build(ItemType.LOST, title, description, category, location, daysAgo, hidden);
    }

    private ItemRequest build(ItemType type, String title, String description, String category,
            String location, int daysAgo, String hidden) {
        return new ItemRequest(type, title, description, category, location,
                LocalDate.now().minusDays(daysAgo), null, hidden);
    }

    private User user(String name, String email, Role role) {
        User user = new User();
        user.setName(name);
        user.setEmail(email);
        user.setPasswordHash(encoder.encode(PASSWORD));
        user.setRole(role);
        return users.save(user);
    }
}
