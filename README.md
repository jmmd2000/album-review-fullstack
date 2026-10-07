# James Reviews Music

Album reviews with track-by-track ratings, scores, artist rankings and stats. Live at [jamesreviewsmusic.com](https://www.jamesreviewsmusic.com).

<p align="center">
  <img src=".github/readme/home.webp" alt="The home page" width="640">
</p>

## Features

- **Reviews:** rate every track out of 10, add a bonus for the album as a whole, and write a review. The album scores out of 100 from the track average and the bonus.
- **Artists:** a leaderboard ranked by overall (weighted), peak and latest score.
- **Stats:** shows statistics for albums, including distribution by score tier.
- **Bookmarks:** albums saved to review later.

## Stack

- Web: React, TanStack Start, React Query
- API: Hono, Drizzle, Postgres
- Tests: Vitest, Playwright

## Setup

Needs Node 26, pnpm and Docker.

```bash
cp .env.example .env    # then fill it in
pnpm install
docker compose up -d db
pnpm --filter @album-reviews/api db:reset
pnpm dev
```

## Database

Postgres has three databases: `albums_dev`, `albums_test` and `albums_test_e2e`. Schema changes go through migrations.

From `apps/api`:

```bash
pnpm db:generate   # create a migration from schema changes
pnpm db:migrate    # apply migrations
pnpm db:reset      # migrate, wipe and seed
pnpm db:seed
pnpm db:wipe
```

## Tests

```bash
pnpm test:unit
pnpm test:integration   # needs Postgres
pnpm test:e2e           # needs Postgres
pnpm test               # all of the above
```

The pre-commit hook runs format, lint, typecheck and unit tests.

## Other commands

```bash
pnpm lint
pnpm format
pnpm typecheck
pnpm build
pnpm coverage
```

## Deploying

Jenkins builds the images, pushes them to GHCR and deploys to staging or production on the VPS. Migrations run before the new containers start.
