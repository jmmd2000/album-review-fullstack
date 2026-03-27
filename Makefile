.PHONY: dev dev-frontend dev-backend test test-backend test-frontend test-e2e clean-servers kill-ports lint format help

dev:
	@echo "Starting frontend + backend..."
	@$(MAKE) dev-frontend & \
	$(MAKE) dev-backend & \
	wait

dev-frontend:
	cd frontend && pnpm dev

dev-backend:
	cd backend && pnpm dev

kill-ports:
	@-pkill -f "tsx src/index.ts" 2>/dev/null; true
	@-pkill -f "vite" 2>/dev/null; true
	@-sleep 1

test: test-backend test-frontend kill-ports test-e2e

test-backend:
	cd backend && pnpm test

test-frontend:
	cd frontend && pnpm test

test-e2e: kill-ports
	@( \
		(cd backend && pnpm dev >/dev/null 2>&1) & BPID=$$!; \
		(cd frontend && pnpm dev >/dev/null 2>&1) & FPID=$$!; \
		trap "kill $$BPID $$FPID 2>/dev/null; wait $$BPID $$FPID 2>/dev/null; true" EXIT INT TERM; \
		sleep 8; \
		cd frontend && pnpm e2e:run; \
	)

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
