# 2. Frontend

```
## Context
The Go API from the previous step runs on localhost:8080. Now build the React frontend that consumes it.
All math must happen on the server; the frontend only edits the number being typed.

## Requirements
Setup:
- Vite + React + TypeScript (strict mode), Vitest + Testing Library
- Dev proxy: /api -> localhost:8080

Architecture:
- api/client.ts: fetch wrapper that turns API errors, network failures and bad responses into a typed ApiError
- lib/: pure functions for input editing (digits, decimal point, sign, backspace, 16-digit limit)
  and result formatting (round float noise, thousands separators, exponent for huge/tiny numbers)
- hooks/useCalculator: connects the pure logic to the API, handles errors, loading state and history
- components/: presentational only (Display, Keypad, History, Calculator)

UX:
- Desk-calculator behavior: chained operations left to right, operator swap if pressed twice,
  "200 + 10 %" -> 20
- Show the pending expression above the result; highlight the active operator
- Friendly error messages ("Can't divide by zero"); the next key press clears the error
- Disable keys while a request is in flight (except AC)
- Keyboard support: digits, + - * / ^, Enter, Backspace, Esc, %
- Clickable history to reuse a result

UI:
- Modern and clean, dark/light mode following the OS
- Responsive: single column, usable at 375px wide
- Accessible: aria-labels on keys, aria-live on the display, visible focus

## Constraints
- No UI or state libraries; plain CSS with custom properties
- Components must not contain business logic

## Deliverables and verification
- Unit tests for the client (mocked fetch) and the pure functions
- Component tests against a mocked API: full calculation, chaining, errors, keyboard, history, loading state
- Run `tsc --noEmit` and `vitest run --coverage` and show the results
- Start both servers and confirm a real calculation works end to end
```
