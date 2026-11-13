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

## Shared enums

| Enum            | Values                                                                                                                                                                                                                       |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Pickup `status` | `pending` (no collector yet), `assigned`, `enRoute`, `arrived`, `collected`, `deliveredToHub`, `cancelled`. The user app folds `arrived` into `enRoute`; the collector app calls `pending` `open` and `assigned` `accepted`. |
| Pickup `source` | `app` (booked by the customer), `callCentre` (booked or rescued by the call centre)                                                                                                                                          |
| Order `status`  | `placed`, `confirmed`, `outForDelivery`, `readyAtVendor`, `completed`, `cancelled`, as in the user app                                                                                                                       |

## Dashboard

### `GET /admin/dashboard`

Today's figures (Colombo calendar day) and the last 14 days, in one call.

Response `200`:

```json
{
  "date": "2026-11-07",
  "pickupsToday": {
    "total": 15,
    "pending": 5,
    "assigned": 1,
    "enRoute": 1,
    "arrived": 1,
    "collected": 4,
    "deliveredToHub": 1,
    "cancelled": 1
  },
  "unassignedOverdue": 2,
  "collectedTodayKg": 48.0,
  "customerPayoutsTodayCents": 576000,
  "collectorPayoutsTodayCents": 192000,
  "collectors": { "online": 7, "active": 11 },
  "orders": { "open": 4, "placedToday": 3 },
  "daily": [
    { "date": "2026-10-25", "pickups": 9, "collectedKg": 61.25 },
    { "date": "2026-11-07", "pickups": 15, "collectedKg": 48.0 }
  ],
  "recentActivity": [
    {
      "id": "act_RT-24844_pending",
      "type": "pickupRequested",
      "subjectId": "RT-24844",
      "summary": "Battaramulla · about 6 kg · booked in the app",
      "occurredAt": "2026-11-07T05:52:00Z"
    }
  ]
}
```

- `pickupsToday` counts pickups scheduled for today, by status.
- `unassignedOverdue` counts `pending` pickups created more than 30 minutes ago: the call centre's queue.
- `collectedTodayKg` and both payout totals cover pickups weighed today.
- `collectors.online` counts collectors online now; `active` excludes suspended accounts.
- `orders.open` counts orders not yet `completed` or `cancelled`.
- `daily` has one entry per day for the last 14 days, oldest first, ending today. `collectedKg` is by the day
  the pickup was weighed.
- `recentActivity` is the newest 10 events. `type` is `pickupRequested`, `pickupAssigned`,
  `pickupCollected`, `pickupDelivered`, `pickupCancelled` or `orderPlaced`. `subjectId` is the pickup or
  order ID.

## Pickups

### `GET /admin/pickups?status=pending&date=2026-11-07&source=app&q=wella&page=1&pageSize=25&sort=-createdAt`

All filters are optional. `status` and `source` take one value each. `date` is the scheduled date. `q`
matches the pickup ID, the customer's name or mobile, the area and the collector's code, ignoring case.
`sort` is `createdAt`, `scheduledDate` or `estimatedKg`, with `-` for descending; the default is
`-createdAt`.

Response `200`:

```json
{
  "items": [
    {
      "id": "RT-24841",
      "status": "pending",
      "source": "callCentre",
      "method": "bulk",
      "customerName": "Kumudu Herath",
      "area": "Rajagiriya",
      "scheduledDate": "2026-11-07",
      "slot": "afternoon",
      "windowStart": "2026-11-07T09:30:00Z",
      "windowEnd": "2026-11-07T10:30:00Z",
      "estimatedKg": 9.5,
      "actualWeightKg": null,
      "collector": null,
      "createdAt": "2026-11-07T05:18:00Z"
    }
  ],
  "page": 1,
  "pageSize": 25,
  "totalCount": 1
}
```

`collector` is `{ "id": "col_457", "code": "COL-0457", "name": "Ruwan Silva" }` once assigned.

### `GET /admin/pickups/{id}`

Response `200`:

```json
{
  "id": "RT-24817",
  "status": "enRoute",
  "source": "callCentre",
  "method": "bulk",
  "customer": {
    "id": "cus_1",
    "name": "Nadeesha Perera",
    "mobile": "+94764821190"
  },
  "area": "Dehiwala",
  "address": "42/3 Galle Road, Dehiwala",
  "latitude": 6.8511,
  "longitude": 79.8655,
  "scheduledDate": "2026-11-07",
  "slot": "morning",
  "windowStart": "2026-11-07T04:30:00Z",
  "windowEnd": "2026-11-07T05:30:00Z",
  "estimatedKg": 8.0,
  "itemCount": null,
  "bagCount": 3,
  "actualWeightKg": null,
  "note": "Bags are next to the side gate. Please ring twice — gate code 1144.",
  "items": [
    {
      "name": "T-shirts & shirts",
      "quantity": null,
      "size": null,
      "condition": "good"
    }
  ],
  "collector": {
    "id": "col_457",
    "code": "COL-0457",
    "name": "Ruwan Silva",
    "mobile": "+94771234567",
    "vehiclePlate": "WP ABC-1234"
  },
  "customerRatePerKgCents": 12000,
  "collectorRatePerKgCents": 4000,
  "customerPayoutCents": null,
  "collectorPayoutCents": null,
  "hub": null,
  "cancelReason": null,
  "createdAt": "2026-11-07T02:00:00Z",
  "timeline": [
    {
      "status": "pending",
      "occurredAt": "2026-11-07T02:00:00Z",
      "actor": "Call centre"
    },
    {
      "status": "assigned",
      "occurredAt": "2026-11-07T02:30:00Z",
      "actor": "Ruwan Silva"
    },
    {
      "status": "enRoute",
      "occurredAt": "2026-11-07T04:18:00Z",
      "actor": "Ruwan Silva"
    }
  ]
}
```

- The rates are the ones in force when the pickup was booked, so later rate changes don't alter it.
  Payouts are `null` until the pickup is weighed.
- `hub` is `{ "id": "hub_plg", "name": "Central Hub — Peliyagoda" }` once delivered.
- `timeline` lists what has happened, oldest first. `actor` is the staff member or collector who did it,
  or `null` for the customer or the system.
- 404 `PICKUP_NOT_FOUND`.

### `POST /admin/pickups/{id}/cancel`

```json
{ "reason": "Customer called to cancel: travelling this week." }
```

Response `200`: the updated pickup, as `GET /admin/pickups/{id}`. `reason` is required (3–300 characters).
409 `PICKUP_NOT_CANCELLABLE` once the pickup is collected, delivered or already cancelled. The customer
and any assigned collector are notified.

## Dispatch

### `GET /admin/dispatch`

Everything the live map shows, in one call. The portal polls it every 10 seconds.

Response `200`:

```json
{
  "generatedAt": "2026-11-07T06:00:00Z",
  "collectors": [
    {
      "id": "col_457",
      "code": "COL-0457",
      "name": "Ruwan Silva",
      "mobile": "+94771234567",
      "online": true,
      "latitude": 6.8562,
      "longitude": 79.8641,
      "lastSeenAt": "2026-11-07T05:59:52Z",
      "area": "Dehiwala",
      "vehicle": {
        "type": "threeWheeler",
        "plate": "WP ABC-1234",
        "capacityKg": 120
      },
      "loadKg": 20.5,
      "activePickupId": "RT-24817"
    }
  ],
  "pickups": [
    {
      "id": "RT-24841",
      "status": "pending",
      "source": "callCentre",
      "customerName": "Kumudu Herath",
      "area": "Rajagiriya",
      "latitude": 6.9094,
      "longitude": 79.894,
      "estimatedKg": 9.5,
      "windowStart": "2026-11-07T09:30:00Z",
      "windowEnd": "2026-11-07T10:30:00Z",
      "createdAt": "2026-11-07T05:18:00Z",
      "collectorId": null
    }
  ],
  "hubs": [
    {
      "id": "hub_plg",
      "code": "PLG",
      "name": "Central Hub — Peliyagoda",
      "latitude": 6.9622,
      "longitude": 79.8829
    }
  ]
}
```

- `collectors` lists every active (not suspended) collector. Offline collectors keep their last reported
  position; `lastSeenAt` says how old it is.
- `loadKg` is what the collector is carrying: collected, not yet delivered to a hub.
- `activePickupId` is the pickup they are assigned to, travelling to or at, or `null`.
- `pickups` lists open pickups (`pending`, `assigned`, `enRoute`, `arrived`) for today and later.
  `collectorId` is set once assigned.
