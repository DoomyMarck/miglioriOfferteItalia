# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Full-stack local dev (frontend + Azure Functions + SWA proxy)
npm run dev:swa

# Frontend only
npm run dev

# Build all workspaces (shared → api → app, order matters)
npm run build

# API tests
npm run test

# API watch mode (TypeScript recompile on save)
npm run watch --prefix api

# Run a single test file
npx vitest run api/tests/normalizers.test.ts
```

Prerequisites: Node.js 20+, Azure Functions Core Tools, SWA CLI, Azurite (local blob storage emulator).

## Architecture

**Monorepo** with three npm workspaces: `app` (frontend), `api` (backend), `shared` (types + normalizers).

```
app/     → React 18 + Vite SPA
api/     → Azure Functions v4 (Node.js serverless)
shared/  → @moi/shared — types and normalizers used by both
```

**Frontend** (`app/src/`): Single-component React app (`App.tsx`). Fetches from the Azure Functions API via thin client `api.ts`. State managed with hooks; shopping list and theme persisted in localStorage. Path alias `@shared` resolves to `../shared/src`.

**Backend** (`api/src/`): Three HTTP-triggered Azure Functions — `GET /api/health`, `GET /api/sources`, `GET /api/search`. The search function runs adapters in parallel, applies per-IP rate limiting (30 req/min), and caches results in-memory for 5 minutes.

**Source adapters** (`api/src/sources/`): Pluggable pattern — register in `sources/index.ts`. Each adapter implements `SourceAdapter` from `@moi/shared`. Currently: `esselunga` (HTML scraping via Cheerio) and `mock` (test data). To add a new source: create `sources/<name>/adapter.ts`, export a conforming `SourceAdapter`, and add it to the registry.

**Shared** (`shared/src/`): `types.ts` defines `SearchResult`, `SourceAdapter`, `SourceError`, `SearchResponse`. `normalizers.ts` provides `normalizePrice`, `normalizeUnit`, `isoDateOrUndefined`, `withScrapedAt`. Build shared before api or app.

**HTTP client** (`api/src/lib/http.ts`): wraps undici with domain-level rate limiting (1 req/sec), 10s timeout, 2-retry exponential backoff, and the `PriceCompareBot/0.1` User-Agent.

## TypeScript module systems

- `shared` and `app`: ESNext modules (`"type": "module"`)
- `api`: CommonJS (required by Azure Functions runtime) — do not use top-level `import` in compiled output, TypeScript handles the transpilation

## Deployment

GitHub Actions (`.github/workflows/azure-functions-app-nodejs.yml`) deploys the `api/` workspace to Azure Functions on push to `main`. The `AZURE_FUNCTIONAPP_NAME` placeholder in the workflow must be set to the real resource name. The SWA hosts the frontend and proxies `/api/*` to the function app.
