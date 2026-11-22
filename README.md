# FoundIt — Lost & Found Claim Desk

A campus lost-and-found platform where claims are **verified, not raced**. A finder stores one private
detail about an item (a scratch, a sticker, what is inside), claimants never see it, and the backend scores
their description against it. Staff review a queue sorted by that confidence score, approve one claimant,
and the item closes for everyone else.

**Stack:** Java 21 · Spring Boot 4 · Spring Security (JWT) · Spring Data JPA · H2/PostgreSQL · React 19 · Vite · Tailwind CSS 4

---

## Quick start

### 1. Backend (port 8080)

```bash
cd backend
mvnw.cmd spring-boot:run        # Windows
./mvnw spring-boot:run          # macOS / Linux
```

or build a jar:

```bash
mvnw.cmd clean package -DskipTests
java -jar target/foundit-backend-0.0.1-SNAPSHOT.jar
```

First run creates `backend/data/foundit.mv.db` (H2 file database) and seeds demo data automatically:
6 users, 12 reports, 5 claims (one already approved).

- API: <http://localhost:8080/api/health>
- H2 console: <http://localhost:8080/h2-console> — JDBC URL `jdbc:h2:file:./data/foundit`, user `sa`, empty password

### 2. Frontend (port 5173)

```bash
cd frontend
npm install
npm run dev
```

Open <http://localhost:5173>. Vite proxies `/api` and `/uploads` to `localhost:8080`, so no CORS setup is
needed in development.

### 3. Demo accounts

| Role | Email | Password | Use it to |
| --- | --- | --- | --- |
| USER | `aarav@campus.edu` | `Password123!` | claim a found item |
| USER | `sana@campus.edu` | `Password123!` | see an approved claim |
| USER | `rohan@campus.edu` | `Password123!` | see a pending claim |
| STAFF | `staff@foundit.dev` | `Password123!` | review + approve the queue |
| ADMIN | `admin@foundit.dev` | `Password123!` | full access |
| USER | `meera@campus.edu` | `Password123!` | reporter of most found items |

The login screen has one-click buttons that fill these for you.

---

## What is actually implemented

**Auth**
- Register / login with BCrypt password hashing
- Stateless JWT (HS256, 24 h) validated by a `OncePerRequestFilter`
- Roles `USER`, `STAFF`, `ADMIN` with method-level `@PreAuthorize` guards
- 401/403 returned as JSON instead of an HTML error page

**Reports**
- LOST / FOUND reports with category, location, date, description, photo
- Public search: type, category, keyword, status, pagination
- Private `hiddenDetail` never leaves the server unless you are the reporter or staff
- Image upload (multipart, 5 MB, content-type checked) served from `/uploads/**`
- Owner/admin edit + delete rules (deleting is blocked once claims exist)

**Claims (the interesting part)**
- Claim submission blocked for your own report, closed items, and duplicate active claims
- `MatchScoreService` tokenises the claim message and compares it with the private detail (70% weight)
  and the public description (30%), returning a transparent 0–100 score plus `LIKELY` / `POSSIBLE` / `WEAK`
- Staff queue sorted by score, with the private detail shown side by side
- Approve → item becomes `CLAIMED`, every other pending claim is auto-rejected, both parties notified
- Reject with a note, withdraw your own pending claim
- `CLAIMED → RETURNED` handover step

**Other**
- In-app notifications (bell + unread count, mark read)
- Desk stats (items, open, pending, reunited)
- Global exception handler with field-level validation errors
- Seed data with deliberately vague vs. specific claims so the score difference is visible in a demo

---

## API map

| Method | Endpoint | Access |
| --- | --- | --- |
| GET | `/api/health`, `/api/categories` | public |
| POST | `/api/auth/register`, `/api/auth/login` | public |
| GET | `/api/auth/me` | signed in |
| GET | `/api/items?type&category&q&status&page&size` | public |
| GET | `/api/items/{id}` | public (private detail hidden) |
| POST / PUT / DELETE | `/api/items`, `/api/items/{id}` | owner / admin |
| POST | `/api/items/{id}/image` | owner |
| POST | `/api/items/{id}/claims` | signed in, not the reporter |
| GET | `/api/my/items`, `/api/my/claims` | signed in |
| GET | `/api/claims?status=` | STAFF / ADMIN |
| POST | `/api/claims/{id}/approve`, `/api/claims/{id}/reject` | STAFF / ADMIN |
| DELETE | `/api/claims/{id}` | claimant (withdraw) |
| POST | `/api/items/{id}/return` | STAFF / ADMIN |
| GET | `/api/admin/stats` | STAFF / ADMIN |
| GET | `/api/notifications` | signed in |
| POST | `/api/notifications/{id}/read`, `/api/notifications/read-all` | signed in |

Errors are always JSON: `401` not signed in, `403` wrong role or not your data, `404` missing record,
`409` state conflict (duplicate claim, already reviewed, item closed), `400` validation with field-level
`details`. See `TEST_RESULTS.md` for the full verification run.

---

## Postman

Import `postman/FoundIt.postman_collection.json`, then click the collection → **Run** (or run folder by folder).
It is designed to be run top to bottom:

1. **Auth** — registers a throwaway student (saves `{{studentToken}}`), logs in as staff (saves `{{staffToken}}`),
   checks `/me`, checks a wrong password returns 401.
2. **Items** — public listing/search, creates a test item **as staff**, verifies the private detail is masked,
   checks the student's "my reports".
3. **Claims** — student submits a claim (score > 60 asserted), duplicate claim → 409, "my claims".
4. **Staff desk** — queue sorted by score, student blocked with 403, approve → item `CLAIMED`, mark returned,
   stats.
5. **Withdraw flow** — creates a second item, student claims and withdraws it (204).
6. **Negative tests** — no token 401, unknown item 404, blank fields 400 with field errors.

Two tokens are used on purpose: the item is created by staff and claimed by a student, so "you cannot claim your
own report" does not block the run. The suite creates two throwaway items per run — delete `backend/data/` if you
want a clean slate.


---

## Opening in Eclipse (backend)

1. **File → Import → Maven → Existing Maven Projects**
2. Root directory: the extracted `backend` folder (the one containing `pom.xml`)
3. Finish. Eclipse reads `pom.xml` and downloads dependencies on first build.
4. Make sure Eclipse runs on **JDK 21** (`Window → Preferences → Java → Installed JREs`).
5. Run `com.foundit.FounditBackendApplication` as a **Java Application**
   (or `Run As → Spring Boot App` if Spring Tools is installed).

No Lombok, no annotation processing, no `.env` file needed — the project compiles as imported.

## Opening in VS Code (frontend)

1. Extract the `frontend` folder and open **that folder** in VS Code.
2. Terminal: `npm install` then `npm run dev`.
3. Recommended extensions: ESLint, Tailwind CSS IntelliSense, Prettier.
4. The backend must be running on port 8080 for API calls to succeed.

---

## Project layout

```
backend/src/main/java/com/foundit/
├── auth/          JWT service, filter, login/register
├── claim/         claim workflow + MatchScoreService
├── item/          reports, search specifications, image storage
├── notification/  in-app inbox
├── admin/         desk statistics
├── config/        security (CORS, roles), static /uploads handler
├── common/        ApiException, GlobalExceptionHandler, PageResponse
├── seed/          DataSeeder
└── user/          User entity + roles

frontend/src/
├── api client + auth context
├── components/    Navbar, ItemCard, badges, modal, pagination
└── pages/         Login, Register, Browse, ItemDetail, ReportItem,
                   MyReports, MyClaims, Desk
```

## Swapping H2 for PostgreSQL

Override the datasource and keep everything else:

```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/foundit
spring.datasource.username=foundit
spring.datasource.password=foundit
spring.jpa.hibernate.ddl-auto=update
```

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| `Port 8080 already in use` | Stop the other process, or set `server.port=8081` and update `frontend/vite.config.js` |
| `Database may be already in use` | Another backend instance is running; close it. H2 allows one file lock |
| Frontend shows "Could not load…" | Backend is not running, or not on port 8080 |
| Images 404 after restart | `uploads/` is relative to the working directory; run from the `backend` folder |
| Reset demo data | Stop the app and delete `backend/data/` |

## Known limitations (say this in your viva)

- Match scoring is lexical overlap, not embeddings — cheap, explainable, good enough for a desk workflow.
- H2 file database for zero-setup demo; PostgreSQL is a property change, not a rewrite.
- No email delivery; notifications are in-app only.
- `claimCount` is a per-row count query; fine for a demo, would be a projection/aggregate in production.
