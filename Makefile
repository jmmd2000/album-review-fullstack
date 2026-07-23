.PHONY: dev dev-frontend dev-backend test test-backend test-frontend test-e2e clean-servers kill-ports lint format help

dev:
	@echo "Starting frontend + backend..."
	@$(MAKE) dev-frontend & \
	$(MAKE) dev-backend & \
	wait

dev-frontend:
	cd apps/web && pnpm dev

dev-backend:
	cd apps/api && pnpm dev

kill-ports:
	@-pkill -f "tsx src/index.ts" 2>/dev/null; true
	@-pkill -f "vite" 2>/dev/null; true
	@-sleep 1

test: test-backend test-frontend kill-ports test-e2e

test-backend:
	cd apps/api && pnpm test

test-frontend:
	cd apps/web && pnpm test

test-e2e:
	cd apps/web && pnpm e2e

lint:
	pnpm lint

format:
	pnpm format

help:
	@echo "Available commands:"
	@echo "  make dev           - Start frontend + backend dev servers"
	@echo "  make dev-frontend  - Start the frontend dev server"
	@echo "  make dev-backend   - Start the backend dev server"
	@echo "  make test          - Run all tests (backend, frontend, e2e)"
	@echo "  make test-backend  - Run backend Jest tests"
	@echo "  make test-frontend - Run frontend Vitest unit tests"
	@echo "  make test-e2e      - Run Cypress e2e tests"
	@echo "  make kill-ports    - Kill processes on 4000/5173"
	@echo "  make lint          - Run ESLint on all packages"
	@echo "  make format        - Fix ESLint issues"
