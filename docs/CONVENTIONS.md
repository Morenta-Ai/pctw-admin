# Conventions

## Naming

| Thing                | Convention                              | Example                                |
| -------------------- | --------------------------------------- | -------------------------------------- |
| Files                | `kebab-case.ts(x)`                      | `pickups-repository.ts`                |
| Components, types    | `PascalCase`                            | `PickupTable`, `PickupSummary`         |
| Variables, functions | `camelCase`                             | `pricePerKgCents`                      |
| zod schemas          | `<name>Schema`, type without the suffix | `pickupSchema`, `type Pickup`          |
| Enum values          | `camelCase` strings, matching the API   | `"callCentre"`, `"readyForCollection"` |
| Money fields         | End in `Cents`, integer                 | `payoutCents`                          |
| Weight fields        | End in `Kg`                             | `weightKg`                             |
| Server Actions       | Verb first, in `actions.ts`             | `assignCollector`                      |

## Files by role

| Role           | Pattern                                            |
| -------------- | -------------------------------------------------- |
| Models         | `features/<f>/data/models.ts`                      |
| Source type    | `features/<f>/data/<f>-source.ts`                  |
| Remote source  | `features/<f>/data/<f>-remote-source.ts`           |
| Mock source    | `features/<f>/data/<f>-mock-source.ts`             |
| Repository     | `features/<f>/data/<f>-repository.ts`              |
| Server Actions | `features/<f>/actions.ts`                          |
| Tests          | `test/`, mirroring `src/`, ending in `.test.ts(x)` |

## Code

- Import with the `@/` alias, not relative paths that leave the folder.
- Server-only modules (sources, repositories, session) start with `import "server-only"`.
- Mark a component `"use client"` only when it needs state, effects or browser APIs, and keep it small.
- Use brand tokens through Tailwind classes. No hex colours, inline font families or arbitrary font sizes
  in features. The dev-only design system page is the exception.
- Add a component to `components/app` once a second feature needs it.
- Write comments that explain why, not what.
- Lint and typecheck must be clean. If you disable a rule, say why on the same line.

## Branches

Branch from `main`:

- `feature/<name>`, such as `feature/dispatch-map`
- `fix/<name>`
- `chore/<name>`

## Commits

Use [Conventional Commits](https://www.conventionalcommits.org), one logical change per commit:

```text
feat(dispatch): show pending pickups on the live map
fix(orders): keep the waybill number when reprinting
chore: update dependencies
```

The usual types are `feat`, `fix`, `refactor`, `test`, `docs`, `chore` and `ci`.

## Pull request checklist

- [ ] `pnpm format:check`, `pnpm lint`, `pnpm typecheck` and `pnpm test` pass
- [ ] New data has both a mock and a remote source
- [ ] `docs/API_CONTRACT.md` matches any model changes, with a contract test sample
- [ ] Server Actions and route handlers check the role
- [ ] Only brand tokens and shared components are used in features
- [ ] Checked in the browser at 1440 wide and at tablet width
