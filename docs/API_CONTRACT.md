# ReThread API contract (admin & call-centre portal)

What the portal expects from the ASP.NET Core API. The backend does not exist yet, so this document is the
agreement both sides build against. The zod schemas in `src/features/*/data/models.ts` mirror it field for
field, and the mock sources return the same shapes, which is why switching from mock to real needs no page
changes.

The portal shares a server, conventions and error format with the apps' contracts in
[pctw-user](https://github.com/Morenta-Ai/pctw-user/blob/main/docs/API_CONTRACT.md) and
[pctw-collector](https://github.com/Morenta-Ai/pctw-collector/blob/main/docs/API_CONTRACT.md). A pickup is
one record on the server: the customer sees a pickup, the collector a job, and the portal a pickup request.

If you change a shape here, change the schema and the mock source in the same PR. `test/contract/` parses
each response sample below through its schema.

Sections are added as each feature is built. See the README's status table.

## Conventions

| Topic     | Rule                                                                                                                                                                                                              |
| --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Base path | Everything is under `/api/v1/admin`. `API_BASE_URL` includes `/api/v1`, so paths below start at `/admin`. Keeping staff endpoints under one prefix lets the API apply one staff-only policy to them.              |
| JSON      | camelCase keys. Enums are camelCase strings (`callCentre`, `readyForCollection`).                                                                                                                                 |
| Dates     | ISO-8601 in UTC with a `Z` suffix: `2026-11-07T04:30:00Z`. The portal shows them in Asia/Colombo (UTC+05:30), 24-hour. Date-only values are `YYYY-MM-DD`.                                                         |
| Money     | Integer LKR cents, in fields ending in `Cents`. `88800` is Rs. 888.00. Never a float.                                                                                                                             |
| Weight    | Kilograms as a JSON number with at most 2 decimals, in fields ending in `Kg`.                                                                                                                                     |
| Distance  | Kilometres with 1 decimal, in fields ending in `Km`.                                                                                                                                                              |
| Auth      | `Authorization: Bearer <accessToken>` on everything except `/admin/auth/login` and `/admin/auth/refresh`.                                                                                                         |
| Roles     | Every staff member has one role: `admin` or `callCentre`. Endpoints marked **Admin** return 403 `FORBIDDEN` for `callCentre`.                                                                                     |
| Lists     | Wrapped in an object. Table lists are paged: `{ "items": [...], "page": 1, "pageSize": 25, "totalCount": 132 }`, with `?page=&pageSize=` (max 100). Short lists that are never paged return `{ "items": [...] }`. |
| Sorting   | `?sort=field` ascending, `?sort=-field` descending, on the fields each endpoint lists.                                                                                                                            |
| IDs       | Pickup IDs are human-readable because the UI shows them: `RT-24817`. Collector codes look like `COL-0457`. Order numbers look like `ORD-10234`, waybills `WB-261107-0012`. Everything else is an opaque string.   |

### Errors

Any non-2xx response has this body, the same as the apps:

```json
{
  "code": "ASSIGNMENT_EXPIRED",
  "message": "The collector didn't answer in time.",
  "details": { "pickupId": "RT-24841" }
}
```

`code` is a stable `UPPER_SNAKE_CASE` string the portal can branch on. `message` is for logs and as a
fallback. `details` is optional; on a 422 it maps field names to messages.

| Status | Used for                                                                                     |
| ------ | -------------------------------------------------------------------------------------------- |
| 400    | Malformed request                                                                            |
| 401    | Missing or expired token, or wrong credentials at login. The portal clears the session.      |
| 403    | Signed in but not allowed, such as `callCentre` on an Admin endpoint, or a suspended account |
| 404    | Not found                                                                                    |
| 409    | Business conflict (`PICKUP_ALREADY_ASSIGNED`, `ASSIGNMENT_EXPIRED`, `ORDER_STATUS_CHANGED`)  |
| 422    | Validation. `details` maps field name to message.                                            |
| 429    | Rate limited (login attempts in particular)                                                  |
| 5xx    | Server fault. The portal shows a generic retry state.                                        |

## Auth

### `POST /admin/auth/login`

```json
{ "email": "admin@rethread.lk", "password": "••••••••" }
```

Response `200`:

```json
{
  "accessToken": "eyJhbGciOi...",
  "refreshToken": "rt_7f3c...",
  "expiresIn": 900,
  "staff": {
    "id": "stf_1",
    "name": "Nadeesha Perera",
    "email": "admin@rethread.lk",
    "role": "admin"
  }
}
```

`expiresIn` is the access token's lifetime in seconds. Errors: 401 `INVALID_CREDENTIALS`, 403
`ACCOUNT_SUSPENDED`, 429 `TOO_MANY_ATTEMPTS`.

### `POST /admin/auth/refresh`

`{ "refreshToken": "rt_7f3c..." }` → the same response as login, with a new pair of tokens. 401
`SESSION_EXPIRED` sends staff back to sign in.

### `POST /admin/auth/logout`

`{ "refreshToken": "rt_7f3c..." }` → `204`. Revokes the refresh token.

### `GET /admin/me`

Response `200`: the `staff` object from login. The portal uses it to confirm a role change or suspension
without waiting for the token to expire.
