# Architecture

The portal is organised by feature, and each feature is split into the same layers as the Flutter apps.
This document explains the rules and why they exist.

## Data flow

```text
Page / Server Component      Renders data. Knows nothing about HTTP.
Server Action                Changes data, checks the role, revalidates the page.
  │
  ▼
Repository                   <feature>-repository.ts. Returns Result<T>, never throws.
  │
  ▼
Source (type)                Returns zod-parsed models, throws ApiError on failure.
  ├── RemoteSource           ApiClient → .NET API → PostgreSQL
  └── MockSource             MockWorld, in memory
```

Client Components get data as props from a Server Component, or call a Server Action. They never call the
API, so access tokens never reach the browser.

## Folders

```text
src/
├── app/                     Routes only: pages, layouts, loading and error files, route handlers
├── components/
│   ├── ui/                  shadcn output (Radix). Compose it; avoid editing it.
│   └── app/                 Shared ReThread widgets: logo, StatusPill, page header, data table …
├── core/                    No feature knowledge
│   ├── api/                 ApiClient, ApiError
│   ├── config/              Validated env
│   ├── format/              Money, weight, distance and Colombo time
│   └── result.ts            Result<T>, guard(), unwrap()
├── features/<feature>/
│   ├── data/
│   │   ├── models.ts                    zod schemas and their types, matching API_CONTRACT.md
│   │   ├── <feature>-source.ts          The source type
│   │   ├── <feature>-remote-source.ts
│   │   ├── <feature>-mock-source.ts
│   │   └── <feature>-repository.ts      Picks the source, wraps calls in guard()
│   ├── components/          The feature's Server and Client Components
│   └── actions.ts           'use server' actions
├── mock/                    MockWorld and its seed data
└── lib/utils.ts             shadcn's cn()
```

`core/` never imports from `features/` or `app/`. Features may import each other's models, but not each
other's components or sources.

## Mock and remote

`USE_MOCK_DATA` decides which source a repository uses. Both return the same models, so moving to the real
API needs no page changes. The mock source keeps state in `MockWorld` (`src/mock/mock-world.ts`), one
object per server process shared by every feature, so an action on one page shows on the others. Seed data
reuses the IDs from the user and collector apps (`RT-24841`, `COL-0457` …) so the three tell one story.

## Rendering and caching

Cache Components is on. Pages are dynamic where they read the session or data, and static elsewhere:

- Each portal route has a `loading.tsx` or an explicit `<Suspense>` around the part that reads data, so the
  shell (sidebar, headings) shows straight away.
- Nothing staff-specific is cached on the server. After a Server Action changes data it calls
  `revalidatePath` (or `refresh`) so the next render reads fresh data.
- Live views (the dispatch map, the notification bell) poll a route handler instead of holding a socket.

## Auth

Staff sign in with email and password. The API returns tokens and the staff member's role, which the portal
keeps in an encrypted, httpOnly session cookie. Two roles exist: `admin` and `callCentre`.

- `src/proxy.ts` redirects signed-out requests to `/login` and keeps call-centre staff out of admin-only
  sections.
- Every Server Action and route handler checks again with `requireRole()`, because a proxy check can be
  bypassed and a hidden button is not access control.

## Errors

Sources throw `ApiError`; `guard()` turns that into a failed `Result`. Pages either show an inline error
state or `unwrap()` and let the route's `error.tsx` handle it. Server Actions return
`{ ok: false, error }` with a serialised error, and forms show `errorMessage(error)` and any 422 field
errors next to their fields.
