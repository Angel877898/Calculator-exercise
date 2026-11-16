# Builds the React app and the Go API, then ships both in one small image.
# The Go server serves the static files and the /api routes on the same port.

FROM node:24-alpine AS web
WORKDIR /app
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

FROM golang:1.24-alpine AS api
WORKDIR /src
COPY backend/go.mod ./
RUN go mod download
COPY backend/ ./
RUN CGO_ENABLED=0 go build -trimpath -ldflags="-s -w" -o /out/server ./cmd/server

FROM gcr.io/distroless/static-debian12:nonroot
COPY --from=api /out/server /server
COPY --from=web /app/dist /web
ENV PORT=8080 STATIC_DIR=/web
EXPOSE 8080
USER nonroot
ENTRYPOINT ["/server"]
