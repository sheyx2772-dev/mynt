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
	@until docker compose exec -T db psql -U flex -d flex -c 'select 1' >/dev/null 2>&1; do sleep 1; done

.PHONY: minio
minio: ## Start the local S3 bucket, for image uploads while working
	docker compose up -d minio minio-setup
	@echo "MinIO: http://127.0.0.1:9000  konsol: http://127.0.0.1:9001  (flexflex / flexflex)"

.PHONY: schema
schema: db migrate schema-test ## Build the whole schema, then check it holds
	@echo "Schema OK — every migration applied and every constraint held."

.PHONY: schema-test
schema-test: db ## Replay every migration into a scratch database and check it holds
	@# A scratch database, not the development one. The assertions insert
	@# fixtures — a handle, an account, an order — and against a database with
	@# data in it they collide with real rows and report a failure that is not
	@# one. This also makes the run a real test of the migrations themselves:
	@# they go into an empty database, in order, the way production's will.
	@docker compose exec -T db psql -U flex -d postgres -q \
		-c 'drop database if exists flex_schema_test' \
		-c 'create database flex_schema_test'
	@go tool goose -dir internal/database/migrations postgres \
		"postgres://flex:flex@127.0.0.1:5432/flex_schema_test?sslmode=disable" up >/dev/null
	@# The output is captured before it is filtered rather than piped into
	@# grep: grep exits 1 when it filters everything away, which is the normal
	@# case here, and a `|| true` covering that would cover psql too — so a
	@# failed assertion would print its ERROR and the run would still say every
	@# constraint held.
	@out=$$(docker compose exec -T db psql -U flex -d flex_schema_test \
		-v ON_ERROR_STOP=1 -qtA < db/test/constraints.sql); status=$$?; \
		printf '%s\n' "$$out" | grep -v '^$$' || true; \
		docker compose exec -T db psql -U flex -d postgres -q \
			-c 'drop database flex_schema_test' >/dev/null; \
		exit $$status

.PHONY: dev
dev: ## Run the API from source against the local database
	DATABASE_URL="$(DATABASE_URL)" APP_ENV=development go run ./cmd/api

.PHONY: migrate
migrate: ## Apply pending migrations
	go tool goose -dir internal/database/migrations postgres "$(DATABASE_URL)" up

.PHONY: migrate-status
migrate-status: ## Show which migrations have run
	go tool goose -dir internal/database/migrations postgres "$(DATABASE_URL)" status

.PHONY: migrate-down
migrate-down: ## Undo the last migration
	go tool goose -dir internal/database/migrations postgres "$(DATABASE_URL)" down

.PHONY: sqlc
sqlc: ## Regenerate internal/store from db/queries
	go tool sqlc generate

.PHONY: test
test: ## Run the tests, including the ones that need a database
	TEST_DATABASE_URL="$(DATABASE_URL)" go test ./...

.PHONY: check
check: ## Everything CI runs
	go vet ./...
	go build ./...
	TEST_DATABASE_URL="$(DATABASE_URL)" go test ./...
