# ReThread admin & call-centre portal

Next.js web portal for ReThread call-centre staff and admins, part of the PCTW platform. Data flows from this
app to a .NET REST API (pctw-backend, not built yet) to PostgreSQL on Neon. The portal never connects to the
database.

@AGENTS.md

Read `docs/ARCHITECTURE.md` before structural changes, and `docs/API_CONTRACT.md` before touching models.
This is Next.js 16 with Cache Components on: check `node_modules/next/dist/docs/` before using an API you
remember from older versions (`middleware` is now `proxy`, for one).

## Rules

- Keep the layers: page or Server Action → repository → source. Components never call `fetch` or `ApiClient`.
- Repositories return `Result<T>` and never throw to the UI. Wrap source calls in `guard()`.
- Every feature with data has `<feature>-remote-source.ts` and `<feature>-mock-source.ts` behind one source
  type. Both return the same zod-parsed models. `USE_MOCK_DATA` picks one.
- Models are zod schemas in `src/features/<feature>/data/models.ts` and must match `docs/API_CONTRACT.md`.
  Change the contract, schema and mock together, and keep `test/contract/` covering new samples.
- Money is integer cents (`…Cents`). Never use floats for money; convert typed rupees with `rupeesToCents`.
  Weights are kg (`…Kg`). Show both through `src/core/format`. Times are Asia/Colombo, 24-hour.
- Rates and impact multipliers come from the server, never from constants.
- Authorise every Server Action and route handler on the server with `requireRole()`. Hiding a button is
  not access control, and `proxy.ts` alone is not trusted.
- Use the brand tokens (`bg-primary`, `bg-lime`, `text-muted-foreground` …) and components from
  `src/components/ui` and `src/components/app`. No hex colours or arbitrary font families in features.
- With Cache Components, anything that reads cookies, the session or mock/API data renders inside a
  `<Suspense>` boundary (or under a `loading.tsx`). Don't await the session at the top of a layout.
- Mock sign-in accounts are in the README. e2e tests sign in through `e2e/helpers.ts`.
- Show maps with `AppMap` (`src/components/app/app-map`), never `GoogleMap` or `DrawnMap` directly: it
  falls back to the drawn map without a key, like the collector app.
- English only: this is an internal staff tool, so there is no l10n.
- `src/components/ui` is shadcn output. Prefer composing it in `src/components/app` over editing it.

## Commands

```sh
pnpm dev            # http://localhost:3000, mock data by default
pnpm format         # Prettier, including Tailwind class order
pnpm lint
pnpm typecheck      # next typegen + tsc
pnpm test           # Vitest
pnpm test:e2e       # Playwright, against a production build on mock data
pnpm build
```

Run format, lint, typecheck and test before committing. CI runs all of them plus the build.

## Design reference

There is no admin design yet (`pctw-designs/admin-portal` is "Design pending"). Follow the shared ReThread
brand in `pctw-designs/README.md` and the patterns already in this repo. `/dev/design-system` shows the
tokens and shared components.

## Git

Work on a branch (`feature/<name>`, `fix/<name>`, `chore/<name>`), never directly on `main`, and use
Conventional Commits. See `docs/CONVENTIONS.md`.
