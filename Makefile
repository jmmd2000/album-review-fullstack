.PHONY: dev dev-frontend dev-backend test test-frontend test-backend lint format help

dev:
	@echo "Starting frontend + backend..."
	@$(MAKE) dev-frontend & \
	$(MAKE) dev-backend & \
	wait

dev-frontend:
	cd frontend && pnpm dev

dev-backend:
	cd backend && pnpm dev

test: test-frontend test-backend

test-frontend:
	@$(MAKE) dev-frontend & \
	$(MAKE) dev-backend & \
	sleep 5; \
	cd frontend && pnpm test && pnpm e2e:run; \
	kill %1 %2 2>/dev/null || true

test-backend:
	cd backend && pnpm test

lint:
	pnpm lint

format:
	pnpm format

help:
	@echo "Available commands:"
	@echo "  make dev           - Start frontend + backend dev servers"
	@echo "  make dev-frontend  - Start the frontend dev server"
	@echo "  make dev-backend   - Start the backend dev server"
	@echo "  make test          - Run all tests"
	@echo "  make test-frontend - Run frontend tests"
	@echo "  make test-backend  - Run backend tests"
	@echo "  make lint          - Run ESLint on all packages"
	@echo "  make format        - Fix ESLint issues"
