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
schema: db ## Build a local copy of the real schema, then apply our own migrations
	@# The product's schema is not this backend's to create. It lives in
	@# landing/supabase/migrations, it is already applied to the database the
	@# website serves, and development wants a copy of that rather than an
	@# invention of its own — a query that works here and not there is worse
	@# than one that fails in both places.
	@#
	@# The shim first, standing in for the parts Supabase provides: the `auth`
	@# schema, and the API roles the migrations grant to by name.
	docker compose exec -T db psql -U flex -d flex -q -v ON_ERROR_STOP=1 \
		< ../landing/supabase/test/local-shim.sql
	@for f in ../landing/supabase/migrations/*.sql; do \
		docker compose exec -T db psql -U flex -d flex -q -v ON_ERROR_STOP=1 < "$$f" || exit 1; \
	done
	@$(MAKE) --no-print-directory migrate
	@echo "Schema OK — the website's tables and this backend's sessions."

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
test: ## Run the tests, including the ones that need a database
	TEST_DATABASE_URL="$(DATABASE_URL)" go test ./...

.PHONY: check
check: ## Everything CI runs
	go vet ./...
	go build ./...
	TEST_DATABASE_URL="$(DATABASE_URL)" go test ./...
