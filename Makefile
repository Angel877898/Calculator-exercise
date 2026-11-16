.PHONY: dev-api dev-web test test-api test-web coverage docker-build docker-run

dev-api:
	cd backend && ALLOWED_ORIGIN=http://localhost:5173 go run ./cmd/server

dev-web:
	cd frontend && npm run dev

test: test-api test-web

test-api:
	cd backend && go test ./... -race

test-web:
	cd frontend && npm test

coverage:
	cd backend && go test ./... -coverprofile=coverage.out && go tool cover -func=coverage.out && go tool cover -html=coverage.out -o coverage.html
	cd frontend && npm run coverage

docker-build:
	docker build -t calculator .

docker-run:
	docker run --rm -p 8080:8080 calculator
