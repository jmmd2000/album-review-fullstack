# James Reviews Music

Album reviews with track-by-track ratings, scores, artist rankings and stats. Live at [jamesreviewsmusic.com](https://www.jamesreviewsmusic.com).

<p align="center">
  <img src=".github/readme/home.webp" alt="The home page" width="640">
</p>

## Features

- **Reviews:** rate every track out of 10, add a bonus for the album as a whole, and write a review. The album scores out of 100 from the track average and the bonus.
- **Artists:** a leaderboard ranked by overall (weighted), peak and latest score.
- **Stats:** shows statistics for albums, including distribution by score tier.
- **Drafts:** the review form saves as you type. Drafts show at the top of Bookmarks.
- **Bookmarks:** albums saved to review later.
- **Review an album:** search Spotify or paste an album link.
- **Settings:** each background job has its own schedule.

## Stack

- Web: React, TanStack Start, React Query
- API: Hono, Drizzle, Postgres
- Tests: Vitest, Playwright
- External services: Spotify (albums and artists), Last.fm (listener links and picks), MusicBrainz (genre suggestions), and Browserless, a Chromium sidecar used for scraping artist header images

## Setup

Needs Node 26, pnpm and Docker.

```bash
cp .env.example .env    # then fill it in
pnpm install
docker compose up -d db browserless
pnpm --filter @album-reviews/api db:reset
pnpm dev
```

The API won't start unless `.env` has the Spotify keys, `LASTFM_API_KEY`, `ADMIN_PASSWORD_HASH`, `JWT_SECRET` (at least 32 characters) and `DATABASE_URL`. `LASTFM_API_KEY` comes from [last.fm/api/account/create](https://www.last.fm/api/account/create).

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

Scheduled jobs run by themselves only when `SCHEDULED_REFRESH=true`. Production sets it. Staging leaves it off, because it restores the production database. Each job's interval is set on the Settings page.
