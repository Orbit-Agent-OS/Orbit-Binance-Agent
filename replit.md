# Orbit — Binance Agent OS

Orbit is a safety-first crypto command center that explains bounded trade ideas and keeps execution behind an explicit confirmation gate.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080 in the artifact workflow)
- `pnpm --filter @workspace/orbit-binance-agent run dev` — run the Orbit web preview
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string
- Optional secret: `GEMINI_API_KEY` — enables Gemini-generated analysis narratives; without it, the bounded deterministic narrative remains available

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)
- AI: Gemini REST API for narrative analysis, with deterministic fallback

## Where things live

- `artifacts/orbit-binance-agent/src/App.tsx` — dashboard shell, routes, policy editor, and copilot UI
- `artifacts/api-server/src/routes/orbit.ts` — dashboard, market, portfolio, policy, activity, analysis, and execution routes
- `lib/db/src/schema/orbit.ts` — Orbit persistence schema
- `lib/api-spec/openapi.yaml` — source-of-truth API contract
- `artifacts/orbit-binance-agent/src/index.css` — Orbit visual tokens and layout primitives

## Architecture decisions

- Analysis computes notional, stops, targets, and policy status server-side; Gemini only writes the explanatory narrative.
- The execution route requires an explicit confirmation payload and rechecks the active policy before creating a simulated execution record.
- Withdrawals are permanently blocked in the policy model; the current release is demo-mode and does not place live Binance orders.
- Seed data is deterministic and stored in Postgres so the UI can demonstrate activity, policy edits, and execution without external exchange credentials.

## Product

- Command center with account, P&L, risk posture, protected capital, market context, and portfolio exposure.
- Gemini-assisted copilot that produces a bounded setup thesis while preserving policy checks and confirmation gates.
- Activity log showing analysis, policy, execution, blocked-action, and sync events.
- Execution policy editor for trade size, leverage, daily loss, allowed symbols, and confirmation requirements.
- Settings view for demo/live mode intent and the safety contract.

## User preferences

- Keep demo mode as the default and never imply that a live trade was placed when the app is using simulated execution.
- Treat every generated thesis as explainable context, not financial advice or an order instruction.

## Gotchas

- Frontend builds require both `PORT` and `BASE_PATH` in standalone shell commands; the artifact workflow supplies them automatically.
- Gemini credentials must remain server-side; never expose `GEMINI_API_KEY` to Vite client code or browser logs.
- `OPENAI_API_KEY` is not used by Orbit; Gemini uses the separately named `GEMINI_API_KEY` secret.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
