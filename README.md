# Album Reviews

## Overview

A personal music review app for tracking album reviews. Uses the Spotify API and allows me to rate albums, track score statistics and bookmark albums for later. Built as a monorepo with a React frontend and Express backend.

See at [jamesreviewsmusic.com](https://www.jamesreviewsmusic.com)

## Tech Stack

**Frontend:** React, Vite, TailwindCSS, TypeScript, TanStack Router, React Query, Vitest, Cypress

**Backend:** Express, TypeScript, Drizzle ORM, PostgreSQL, Jest

## Development

```bash
# Install dependencies
pnpm install

# Start both frontend and backend
make dev

# Can also run individually with:
make dev-frontend # http://localhost:5173
make dev-backend # http://localhost:4000
```

## Database

```bash
cd backend

# Push db changes
pnpm db:push

# Seed with sample data
pnpm db:seed

# Wipe current data
pnpm db:wipe
```

## Testing

```bash
# Run all tests
make test

# Run backend tests only
make test-backend

# Run frontend tests only (unit + e2e)
make test-frontend
```

## Project Structure

- `backend/` - Express server
- `frontend/` - React app
- `shared/` - Shared types and utilities used by both frontend and backend
