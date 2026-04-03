# Smart Expense Tracker

## Overview

A full-stack Smart Expense Tracker web application with a clean dashboard, category-wise charts, budget alerts, and smart spending insights.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React + Vite (artifacts/expense-tracker)
- **API framework**: Express 5 (artifacts/api-server)
- **Database**: PostgreSQL + Drizzle ORM
- **Charts**: Recharts
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Features

- Add/view/delete expenses (amount, category, description, date)
- Filter expenses by category
- Total spending stats and transaction count
- Smart insight: "You spent the most on X this month"
- Budget limit setting with exceeded-budget alert
- Pie chart for category-wise spending (Recharts)
- Monthly spending summary
- REST API: POST /add-expense, GET /expenses, DELETE /expense/:id

## Database Schema

### expenses
| Column | Type | Notes |
|--------|------|-------|
| id | serial | PK |
| amount | real | |
| category | text | |
| description | text | |
| date | text | YYYY-MM-DD |
| created_at | timestamptz | auto |

### budget
| Column | Type | Notes |
|--------|------|-------|
| id | serial | PK |
| limit | real | |
| updated_at | timestamptz | auto |

## API Endpoints

- `GET /api/expenses` — list all expenses (filter: ?category=&month=YYYY-MM)
- `POST /api/expenses` — add a new expense
- `DELETE /api/expenses/:id` — delete an expense
- `GET /api/expenses/summary` — aggregated insights (totals, categories, budget status)
- `GET /api/expenses/budget` — get current budget limit
- `POST /api/expenses/budget` — set monthly budget limit

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally
- `pnpm --filter @workspace/expense-tracker run dev` — run frontend locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
