# Album Reviews

## Overview

A personal music review app for tracking album reviews. Uses the Spotify API and allows me to rate albums, track score statistics and bookmark albums for later. Built as a pnpm monorepo with a React frontend and a Hono backend.

See at [jamesreviewsmusic.com](https://www.jamesreviewsmusic.com)

## Tech Stack

**Frontend:** React, Vite, TailwindCSS, TypeScript, TanStack Router, React Query, Vitest, Playwright

**Backend:** Hono, TypeScript, Drizzle ORM, PostgreSQL, Vitest

## Development

```bash
# Install dependencies
pnpm install

# Start both frontend and backend
pnpm dev

# Or run one side on its own
pnpm --filter @album-reviews/api dev # http://localhost:4000
pnpm --filter @album-reviews/web dev # http://localhost:5173
```

## Database

The dev Postgres container holds three databases. It creates them the first time it starts on an empty volume.

- `albums_dev`: the dev servers use it, through `DATABASE_URL`.
- `albums_test`: the unit and integration tests use it, through `DATABASE_URL_TEST`. The test run brings it up to date with the migrations and gives each worker its own copy.
- `albums_test_e2e`: e2e uses it, through `DATABASE_URL_TEST_E2E`. Each e2e run migrates, wipes and seeds it.

Wipe and seed only run against a local database whose name ends in `_dev`, `_test` or `_test_e2e`. Tests also need `NODE_ENV=test` and a test database.

Schema changes go through migrations. Never use `drizzle-kit push`.

```bash
cd apps/api

# Make a migration from changes to src/db/schema.ts
pnpm db:generate

# Apply the migrations to the dev database
pnpm db:migrate

# Apply the migrations, wipe the review data and seed the sample library
pnpm db:reset

# Seed or wipe on their own
pnpm db:seed
pnpm db:wipe
```

The tests and e2e reset their own databases, so they never need these commands.

## Testing

```bash
# Run the unit and integration suites in every package
pnpm test

# Run the Playwright e2e suite
pnpm e2e
```

e2e starts its own API on port 4100 and its own web server on port 5180, both on the e2e database. It never uses the dev servers or the dev database, so it can run while they're up.

## Other root commands

```bash
# Lint everything
pnpm lint

# Format and autofix everything
pnpm format

# Typecheck every package
pnpm typecheck

# Build every package
pnpm build
```

## Project Structure

- `apps/api` - Hono server
- `apps/web` - React app
- `packages/shared` - Types and helpers used by both sides
