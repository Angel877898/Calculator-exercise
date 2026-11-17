# 3. Docker, CI and documentation

```
## Context
Backend and frontend are working and tested. Now make the project easy to run and review.

## Requirements
Docker:
- Multi-stage Dockerfile at the repo root: build the frontend, build the Go binary,
  final image serves both on port 8080 (small base image, non-root user)
- .dockerignore

Automation:
- Makefile with: dev-api, dev-web, test, coverage, docker-build, docker-run
- GitHub Actions workflow running vet, typecheck, tests with coverage and build for both apps
  on push to main and on pull requests

README:
- Short project overview and folder structure
- Setup: requirements, clone, install dependencies
- How to run the backend, the frontend, and both with Docker
- Configuration table (env vars)
- API reference: every endpoint, operations table, curl examples for success and error cases
  (use real responses from the running API), error codes table
- Tests and coverage: commands and current numbers
- Design decisions (with the trade-offs) and assumptions
- Possible improvements

## Constraints
- Write the README in a natural, direct tone: no filler, no emojis
- Every command in the README must actually work

## Verification
Run each README command you can and tell me which ones you could not test.
```
