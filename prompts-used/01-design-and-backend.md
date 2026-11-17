# 1. Design and backend

```
## Context
I'm building a full-stack calculator as a practice exercise. Frontend: React + TypeScript.
Backend: Go REST API. We'll work in stages; this stage covers the design and the full backend.

## Step 1: Design (show it to me before coding)
Propose briefly:
- Folder structure for the monorepo (backend/ and frontend/)
- API contract: endpoints, request/response JSON, error format and status codes
- How responsibilities are split (domain logic, HTTP layer, UI)
Wait for my approval before continuing.

## Step 2: Backend requirements
- Operations: add, subtract, multiply, divide, power, sqrt, percentage ("a percent of b")
- Endpoints:
  - POST /api/v1/calculate  body: {"operation": string, "operands": number[]}
  - GET  /api/v1/operations (lists operations and operand counts)
  - GET  /healthz
- Validation and edge cases:
  - division by zero, square root of a negative, overflow / non-finite results
  - malformed JSON, unknown fields, wrong types, null operands, wrong operand count
  - request bodies over 64 KB
- Error format: {"error": {"code": "...", "message": "..."}}
  400 for bad requests, 422 for valid requests with no mathematical answer
- Config from env vars: PORT, ALLOWED_ORIGIN (optional CORS), STATIC_DIR (optional, serves the frontend build)
- Graceful shutdown and request logging

## Constraints
- Go 1.22+, standard library only
- The domain package must not import anything HTTP-related
- Idiomatic Go; short comments only where the code isn't obvious

## Deliverables
- backend/internal/calculator: domain logic + table-driven tests
- backend/internal/api: handlers, router, middleware + httptest tests for every error path
- backend/cmd/server: entrypoint

## Verification
Run `go vet ./...` and `go test ./... -cover`, and show me the output.
Aim for 90%+ coverage on internal packages.
```
