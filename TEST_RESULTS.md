# Verification Report — FoundIt

Run date: **19 November 2026**
Build verified: backend `0.0.1-SNAPSHOT` (Spring Boot 4.0.9, Java 21), frontend Vite 7.3.8 / React 19.

## What was checked

| Area | How |
| --- | --- |
| Backend API | 126 automated HTTP checks against a **fresh in-memory database** on port `8081` (your demo database on port `8080` was not touched) |
| Frontend | `npm ci` + `npm run build` from the extracted zip, then a browser pass over Browse, Item detail, Login, Claim desk, My reports, My claims, Add report |
| Deliverables | Both zips extracted into empty folders and built from scratch |
| Demo data | 12 seeded items, 6 users, 5 seeded claims re-created exactly on a fresh database |

## Backend results: 126 / 126 passed

| Group | Checks | Result |
| --- | ---: | --- |
| Auth — register, login, JWT, roles, 401s | 17 | PASS |
| Items — listing, search, filters, pagination, private-detail masking | 21 | PASS |
| Items — create, edit, validation, image upload, delete rules | 19 | PASS |
| Claims — submission rules, match score, duplicate/closed guards | 14 | PASS |
| Staff desk — queue order, approve, auto-reject, returned flow | 20 | PASS |
| Reject and withdraw flows | 9 | PASS |
| Notifications — inbox, unread count, mark read, ownership | 10 | PASS |
| Admin stats, categories, health, CORS | 10 | PASS |
| Error handling — 400 / 404 / 405 responses | 6 | PASS |

Highlights that matter in a viva:

- Public listing and anonymous item detail return `hiddenDetail: null`; the reporter and staff see the real value.
- A claim that repeats the private detail scores **≥ 70 (LIKELY)**; a vague claim scores lower. Same item, different score.
- Approving a claim sets the item to `CLAIMED`, auto-rejects competing pending claims with a note, and notifies both the claimant and the reporter.
- Every role guard returns a JSON error: `403` for students hitting staff endpoints, `401` for missing/tampered tokens.
- Bad input is handled cleanly: invalid enum/`page` → `400`, malformed JSON → `400`, wrong method → `405`, unknown path/file → `404`.

## Bugs found and fixed during verification

1. `POST /api/auth/register` returned `200` instead of `201`.
2. A student calling a staff endpoint returned `500` instead of `403`.
3. Invalid query parameters, malformed JSON, unknown paths, wrong HTTP methods and missing uploads all fell through to `500`; they now return `400`, `404` and `405`.

## Frontend results

- Production build succeeds: 119 modules, ~386 kB JS (122 kB gzip), ~42 kB CSS (7.4 kB gzip).
- Browse renders 12 seeded cards, status badges and claim counts.
- Keyword search in the UI narrows 12 cards to the matching ones.
- Item detail hides the private detail from visitors and shows the sign-in prompt instead of the claim form.
- Staff login works through the demo buttons; **Claim desk** shows stats, the ranked queue, the 🔒 private detail, the score bar and Approve/Reject actions.
- No console errors and no failed network requests on any visited page.

## Deliverables checked

| File | Check |
| --- | --- |
| `FoundIt-backend.zip` | 62 files, no `target/`, `data/`, `uploads/`; Eclipse `.project`/`.classpath` present; `mvnw.cmd -DskipTests compile` succeeds from the extracted folder |
| `FoundIt-frontend.zip` | 26 files, no `node_modules/`/`dist/`; `npm ci` and `npm run build` succeed from the extracted folder |
| `postman/FoundIt.postman_collection.json` | 6 folders, 24 requests, assertions match the current responses |
| `README.md` | Setup steps, demo accounts, API map and troubleshooting match the code |

## How to re-run the quick check

The Postman collection is the fastest check:

1. Backend running on `http://localhost:8080`
2. Postman → import `postman/FoundIt.postman_collection.json` → **Run**
3. Expect **0 failed** assertions

The collection creates two throwaway items per run. To return to the pristine demo set afterwards, stop the backend, delete `backend/data/`, and start it again.
