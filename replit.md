# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Contains the Competitor Intelligence Agent — a full-stack web app that searches the web for real FMCG competitor data using Tavily API and structures it with Gemini AI into a clean benchmarking dashboard.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **AI**: Gemini 2.5 Flash via Replit AI Integrations
- **Web search**: Tavily API

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

## App Structure

### Frontend (`artifacts/competitor-intel/`)
- React + Vite + Tailwind CSS
- Dark intelligence terminal aesthetic (teal/cyan on dark slate)
- Pages:
  - `/` — Home page with company input form (3-5 companies) and recent reports list
  - `/report/:id` — Full benchmarking dashboard with sourced data points
- Components:
  - `components/loading-state.tsx` — Animated terminal loading screen

### Backend (`artifacts/api-server/`)
- Express 5 API server
- Routes:
  - `POST /api/intelligence/analyze` — Search + analyze competitors (Tavily + Gemini)
  - `GET /api/intelligence/reports` — List all saved reports
  - `GET /api/intelligence/reports/:id` — Get a specific report

### Database Schema (`lib/db/src/schema/`)
- `intelligence_reports` table — stores id, title, companies[], profiles (JSONB), createdAt

### AI Integrations (`lib/integrations-gemini-ai/`)
- Gemini AI client via Replit AI Integrations (no user API key needed)
- Used for structuring raw search results into structured company profiles

## Secrets Required
- `TAVILY_API_KEY` — Tavily web search API key (user-provided)
- `AI_INTEGRATIONS_GEMINI_BASE_URL` / `AI_INTEGRATIONS_GEMINI_API_KEY` — Auto-provisioned by Replit

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
