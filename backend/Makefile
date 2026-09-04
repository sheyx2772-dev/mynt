# The commands this backend is worked on with. `make` on its own lists them.

SHELL := /bin/bash

# goose and sqlc are pinned in go.mod under a `tool` directive, so `go tool`
# runs the versions this repository was built against rather than whatever a
# machine happens to have on its PATH. Nothing has to be installed first.
DATABASE_URL ?= postgres://flex:flex@127.0.0.1:5432/flex?sslmode=disable

.DEFAULT_GOAL := help

.PHONY: help
help: ## Show this list
	@grep -hE '^[a-zA-Z_-]+:.*?## ' $(MAKEFILE_LIST) \
		| awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-12s\033[0m %s\n", $$1, $$2}'

.PHONY: db
db: ## Start Postgres on its own, which is what development needs
	docker compose up -d db

.PHONY: dev
dev: ## Run the API from source against the local database
	DATABASE_URL="$(DATABASE_URL)" APP_ENV=development go run ./cmd/api

.PHONY: migrate
migrate: ## Apply pending migrations
	go tool goose -dir db/migrations postgres "$(DATABASE_URL)" up

.PHONY: migrate-status
migrate-status: ## Show which migrations have run
	go tool goose -dir db/migrations postgres "$(DATABASE_URL)" status

.PHONY: migrate-down
migrate-down: ## Undo the last migration
	go tool goose -dir db/migrations postgres "$(DATABASE_URL)" down

.PHONY: sqlc
sqlc: ## Regenerate internal/store from db/queries
	go tool sqlc generate

.PHONY: test
test: ## Run the tests
	go test ./...

.PHONY: check
check: ## Everything CI runs
	go vet ./...
	go build ./...
	go test ./...
