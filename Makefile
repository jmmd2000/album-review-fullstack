.PHONY:  dev dev-frontend dev-backend test lint clean help

dev:
	@echo "Starting frontend + backend..."
	@$(MAKE) dev-frontend & \
	$(MAKE) dev-backend & \
	wait

dev-frontend:
	cd frontend && npm run dev

dev-backend:
	cd backend && npm run dev

test: test-frontend test-backend

test-frontend:
	@$(MAKE) dev-frontend & \
	$(MAKE) dev-backend & \
	sleep 5; \
	cd frontend && npm run test && npm run e2e:run; \
	kill %1 %2 2>/dev/null || true

test-backend:
	cd backend && npm run test

help:
	@echo "Available commands:"
	@echo "  make dev        	- Start frontend + backend dev servers"
	@echo "  make dev-frontend  - Start the frontend dev server"
	@echo "  make dev-backend   - Start the backend dev server"
	@echo "  make test       	- Run all tests"
	@echo "  make test-web   	- Run frontend tests"
	@echo "  make test-api   	- Run backend tests"
