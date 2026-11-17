# Calculator

A small full-stack calculator: a React + TypeScript frontend that sends every operation to a Go REST API.

```
calculator-exercise/
├── backend/            Go API (stdlib only)
│   ├── cmd/server/     entrypoint, config from env vars
│   └── internal/
│       ├── calculator/ arithmetic rules, no HTTP
│       └── api/        handlers, routing, middleware
├── frontend/           React + Vite + Vitest
│   └── src/
│       ├── api/        fetch client
│       ├── lib/        pure helpers (input editing, formatting)
│       ├── hooks/      useCalculator, glues state + API
│       └── components/ Display, Keypad, History
└── Dockerfile          builds both and serves them from one container
```

## Setup

**Requirements:** Go 1.22+, Node 20+ and npm. Docker is optional.

```bash
git clone https://github.com/Angel877898/Calculator-exercise.git
cd Calculator-exercise

# backend has no third-party deps, this only checks it builds
cd backend && go build ./... && cd ..

# frontend deps
cd frontend && npm install && cd ..
```

## Running the backend

```bash
cd backend
go run ./cmd/server
```

The API listens on http://localhost:8080. Quick check:

```bash
curl localhost:8080/healthz
# {"status":"ok"}
```

To build a binary instead: `go build -o bin/server ./cmd/server` and run `./bin/server`.

## Running the frontend

With the backend running, in a second terminal:

```bash
cd frontend
npm run dev
```

Open http://localhost:5173. Vite proxies `/api` to `localhost:8080`, so no CORS setup is needed in development.

Production build:

```bash
npm run build      # outputs frontend/dist
npm run preview    # serves the build locally
```

If the UI is hosted on a different origin than the API, build it with `VITE_API_URL=https://api.example.com` and start the backend with `ALLOWED_ORIGIN` set to the UI's origin.

## Running both with Docker

```bash
docker build -t calculator .
docker run --rm -p 8080:8080 calculator
```

Open http://localhost:8080. The Go binary serves the built frontend and the API on the same port, so there's no CORS to deal with.

## Configuration

| Variable         | Default | Description                                            |
| ---------------- | ------- | ------------------------------------------------------ |
| `PORT`           | `8080`  | Port the API listens on                                |
| `STATIC_DIR`     | –       | If set, serves the frontend build from this folder     |
| `ALLOWED_ORIGIN` | –       | Enables CORS for one origin (e.g. a separately hosted UI) |
| `VITE_API_URL`   | `""`    | Frontend build-time API base URL (same origin by default) |

## API

Base path: `/api/v1`. All responses are JSON.

### `POST /api/v1/calculate`

```json
{ "operation": "divide", "operands": [10, 4] }
```

| Operation    | Operands | Result               |
| ------------ | -------- | -------------------- |
| `add`        | 2        | `a + b`              |
| `subtract`   | 2        | `a - b`              |
| `multiply`   | 2        | `a * b`              |
| `divide`     | 2        | `a / b`              |
| `power`      | 2        | `a ^ b`              |
| `percentage` | 2        | `a` percent of `b`   |
| `sqrt`       | 1        | `√a`                 |

**200 OK**

```bash
curl -s localhost:8080/api/v1/calculate \
  -H 'Content-Type: application/json' \
  -d '{"operation":"divide","operands":[10,4]}'
```

```json
{ "operation": "divide", "operands": [10, 4], "result": 2.5 }
```

More examples:

```bash
# square root, one operand
curl -s localhost:8080/api/v1/calculate -H 'Content-Type: application/json' \
  -d '{"operation":"sqrt","operands":[144]}'
# {"operation":"sqrt","operands":[144],"result":12}

# power
curl -s localhost:8080/api/v1/calculate -H 'Content-Type: application/json' \
  -d '{"operation":"power","operands":[2,8]}'
# {"operation":"power","operands":[2,8],"result":256}

# 15% of 200
curl -s localhost:8080/api/v1/calculate -H 'Content-Type: application/json' \
  -d '{"operation":"percentage","operands":[15,200]}'
# {"operation":"percentage","operands":[15,200],"result":30}
```

On Windows PowerShell:

```powershell
Invoke-RestMethod -Method Post -Uri http://localhost:8080/api/v1/calculate `
  -ContentType 'application/json' -Body '{"operation":"multiply","operands":[6,7]}'
```

**Errors** always look like this:

```bash
curl -s localhost:8080/api/v1/calculate \
  -H 'Content-Type: application/json' \
  -d '{"operation":"divide","operands":[1,0]}'
```

```json
{ "error": { "code": "division_by_zero", "message": "division by zero" } }
```

| Status | Code                    | When                                               |
| ------ | ----------------------- | -------------------------------------------------- |
| 400    | `invalid_request`       | Malformed JSON, wrong types, unknown fields        |
| 400    | `unknown_operation`     | Operation not in the table above                   |
| 400    | `invalid_operand_count` | Wrong number of operands for the operation         |
| 400    | `invalid_operand`       | `null` operand                                     |
| 422    | `division_by_zero`      | Divisor is 0                                       |
| 422    | `negative_sqrt`         | `sqrt` of a negative number                        |
| 422    | `out_of_range`          | Result overflows or isn't a real number (e.g. `(-8)^0.5`) |

A couple more:

```bash
curl -s localhost:8080/api/v1/calculate -H 'Content-Type: application/json' \
  -d '{"operation":"sqrt","operands":[-9]}'
# 422 {"error":{"code":"negative_sqrt","message":"square root of a negative number"}}

curl -s localhost:8080/api/v1/calculate -H 'Content-Type: application/json' \
  -d '{"operation":"add","operands":[1]}'
# 400 {"error":{"code":"invalid_operand_count","message":"wrong number of operands: add expects 2, got 1"}}
```

400 means the request itself is wrong; 422 means it's well formed but the math has no valid answer. The `code` field is stable so clients can branch on it, the `message` is for humans.

### `GET /api/v1/operations`

Lists the supported operations and how many operands each one takes. Handy for clients that want to build their UI from the API.

```json
{ "operations": [{ "name": "add", "operands": 2 }, { "name": "sqrt", "operands": 1 }, "..."] }
```

### `GET /healthz`

Returns `{"status":"ok"}`. Used for container health checks.

## Tests and coverage

```bash
cd backend && go test ./... -cover
cd frontend && npm run coverage
```

Or `make test` / `make coverage` from the root. `make coverage` also writes `backend/coverage.html` and `frontend/coverage/index.html`.

Current numbers:

| Package                         | Coverage                     |
| ------------------------------- | ---------------------------- |
| `backend/internal/calculator`   | 100% statements              |
| `backend/internal/api`          | 94.5% statements             |
| `frontend` (all files)          | 91% statements, 98% lines    |

`cmd/server` isn't unit tested; it only reads env vars and starts the server.

What's covered:

- **calculator**: every operation, plus edge cases (division by zero, `-0` divisor, negative sqrt, overflow, NaN/Inf inputs, wrong operand count).
- **api**: real HTTP round trips through `httptest`, status codes and error codes for each failure, body size limit, method not allowed, CORS on/off, SPA fallback.
- **frontend**: input editing and formatting as pure functions, the fetch client with a mocked `fetch`, and the full UI driven with Testing Library against a fake backend (chaining, errors, keyboard, history, loading state).

CI runs all of this on every push and PR (`.github/workflows/ci.yml`).

## Design decisions

**All math happens on the server.** The frontend only edits the number being typed (digits, decimal point, sign, backspace) and asks the API for every result. That's what the exercise asks for and it keeps one source of truth for the rules. The trade-off is a round trip per operation, which is fine on a local network; keys are disabled while a request is in flight so the user can't race it.

**One endpoint with an `operation` field** instead of `/add`, `/divide`, etc. Validation, error handling and the response shape are the same for every operation, so this keeps the handler small, and adding an operation is one line in the `rules` map in `calculator.go` with no new routes.

**Domain package separate from HTTP.** `internal/calculator` knows nothing about JSON or status codes; it returns sentinel errors. The `api` package maps those to HTTP in a single `classify` function. That makes the math trivial to test and the transport easy to swap.

**Stdlib only on the backend.** Go 1.22's `ServeMux` supports method + path patterns (`POST /api/v1/calculate`), which was the main reason to reach for a router. No third-party dependencies means nothing to keep patched.

**Strict input.** Unknown fields are rejected, `null` operands are rejected (a plain `[]float64` would silently turn them into 0), the body is capped at 64 KB, and non-finite results are reported as errors instead of returning `Infinity`, which JSON can't represent anyway.

**Floating point.** The API returns the raw `float64`. The UI rounds to 12 significant digits for display, so `0.1 + 0.2` shows `0.3`, and switches to exponent notation for very large or very small values. Arbitrary precision felt out of scope for this exercise.

**Frontend state.** Input editing lives in `lib/entry.ts` as pure functions (`state -> state`), so it's tested without React. `useCalculator` only orchestrates: it calls those helpers, talks to the API, handles errors and keeps history. Components are presentational. No state library; the state is small.

**Percentage** works like a desk calculator: `200 + 10 %` turns `10` into `20` (10% of 200), then `=` gives `220`. With no pending operation, `%` divides by 100.

**UX details.** Keyboard support (`0-9 . + - * / ^ Enter Backspace Esc %`, `r` for √), operator highlight, running expression above the result, history you can click to reuse a result, font that shrinks for long numbers, light/dark following the OS, and a single-column layout on phones.

## Assumptions

- It's a calculator app, not an expression evaluator: one operation per request, evaluated left to right as you press keys (`2 + 3 × 4` gives `20`, like a basic desk calculator).
- Numbers are IEEE-754 doubles on both sides. The API doesn't round; `0.1 + 0.2` returns `0.30000000000000004` and the UI displays `0.3`.
- `percentage(a, b)` means "a percent of b". A single-operand percent (`50%` → `0.5`) is the same call with `b = 1`.
- Input is capped at 16 digits in the UI, which is about the precision a double can hold.
- No auth, persistence or rate limiting: the service is stateless and meant to run behind something else if exposed publicly.
- History lives in memory in the browser and is cleared on reload.

## Possible improvements

- Expression parsing (`2 + 3 * 4` with precedence) via a `/evaluate` endpoint.
- Decimal arithmetic (e.g. `shopspring/decimal`) if exact results matter.
- Rate limiting and request IDs if this were exposed publicly.
- Persist history in `localStorage`.
