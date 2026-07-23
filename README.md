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

```bash
cd apps/api

# Push db changes
pnpm db:push

# Seed with sample data
pnpm db:seed

# Wipe current data
pnpm db:wipe
```

## Testing

```bash
# Run the unit and integration suites in every package
pnpm test

# Run the Playwright e2e suite
pnpm e2e
```

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
