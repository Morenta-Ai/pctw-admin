# ReThread Admin & Call Centre portal

Web portal for ReThread call-centre staff and admins, part of the PCTW (Post-Consumer Textile Waste)
platform. It covers module 3 of the project proposal:

- **Dispatch & logistics:** live map of collectors and pending pickups, manual assignment, marketplace
  orders and waybills
- **Rates & content:** price per kg, impact multipliers, rejuvenated-garment catalogue
- **Users & finance:** customer, collector and staff accounts, donation campaigns, redemptions

| Related repo                                                   | What it is                       |
| -------------------------------------------------------------- | -------------------------------- |
| [pctw-user](https://github.com/Morenta-Ai/pctw-user)           | Flutter customer app             |
| [pctw-collector](https://github.com/Morenta-Ai/pctw-collector) | Flutter collector app            |
| [pctw-backend](https://github.com/Morenta-Ai/pctw-backend)     | ASP.NET Core API (not built yet) |
| [pctw-designs](https://github.com/Morenta-Ai/pctw-designs)     | Design reference                 |

## Stack

Next.js 16 (App Router, Cache Components) · TypeScript · Tailwind CSS v4 · shadcn/ui (Radix) · zod ·
Vitest. Package manager: pnpm.

## Getting started

Requires Node 22 and pnpm 11 (`corepack enable` picks up the version in `package.json`).

```sh
pnpm install
cp .env.example .env.local   # optional: the defaults use mock data
pnpm dev                     # http://localhost:3000
```

### Configuration

| Variable        | Default                        | Meaning                                                          |
| --------------- | ------------------------------ | ---------------------------------------------------------------- |
| `APP_ENV`       | `dev`                          | `dev`, `staging` or `prod`                                       |
| `API_BASE_URL`  | `http://localhost:5080/api/v1` | The .NET API, including `/api/v1`                                |
| `USE_MOCK_DATA` | `true`                         | Serve everything from the in-memory MockWorld instead of the API |

Until pctw-backend exists, keep `USE_MOCK_DATA=true`. Mock data lives for the life of the dev server and
resets when it restarts.

### Signing in with mock data

| Role        | Email                    | Password              |
| ----------- | ------------------------ | --------------------- |
| Admin       | `admin@rethread.lk`      | `rethread-admin`      |
| Call Centre | `callcentre@rethread.lk` | `rethread-callcentre` |

`ishara@rethread.lk` is a suspended call-centre account, for testing the "account suspended" message.
In mock data, a collector who is free accepts an offer after about 8 seconds, one already on a job declines,
and `COL-0421` never answers, so the offer expires after 45 seconds.

Call-centre staff can't open Rates & impact, Catalogue, Donations or Staff.

## Scripts

| Script                              | Does                            |
| ----------------------------------- | ------------------------------- |
| `pnpm dev`                          | Dev server                      |
| `pnpm build` / `pnpm start`         | Production build and server     |
| `pnpm format` / `pnpm format:check` | Prettier                        |
| `pnpm lint`                         | ESLint                          |
| `pnpm typecheck`                    | Route type generation and `tsc` |
| `pnpm test`                         | Vitest unit and component tests |

## Status

| Step | Area                                   | Status  |
| ---- | -------------------------------------- | ------- |
| 1    | Project setup, brand theme, core layer | Done    |
| 2    | Sign-in, roles and portal shell        | Planned |
| 3    | Dashboard                              | Done    |
| 4    | Pickup requests                        | Done    |
| 5    | Dispatch map                           | Done    |
| 6    | Manual assignment                      | Done    |
| 7    | Marketplace orders and waybills        | Planned |
| 8    | Rates and impact multipliers           | Planned |
| 9    | Catalogue                              | Planned |
| 10   | Customers, collectors and staff        | Planned |
| 11   | Donations and redemptions              | Planned |
| 12   | Notifications                          | Planned |

## Docs

- [Architecture](docs/ARCHITECTURE.md)
- [Conventions](docs/CONVENTIONS.md)
- [API contract](docs/API_CONTRACT.md)
