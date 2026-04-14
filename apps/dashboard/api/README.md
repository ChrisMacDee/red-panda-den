# Dashboard API

Express REST API for Red Panda Den. Built with TypeScript, Drizzle ORM, and Zod. Connects to a shared PostgreSQL 16 instance. Served on **port 3001**.

## Commands

```bash
npm run dev          # tsx watch — hot-reload on http://localhost:3001
npm run build        # tsc → dist/
npm run type-check   # tsc --noEmit
npm run lint         # ESLint (flat config, TypeScript rules)
npm run test         # Vitest (single run)
npm run test -- src/routes/favourites.test.ts   # Single file
```

## Source Structure

```
src/
  index.ts          # Express app setup, middleware, route mounting
  routes/
    health.ts       # GET /api/health
    favourites.ts   # CRUD for dashboard quick-links
  db/
    index.ts        # Drizzle client — pool capped at 10 connections
    schema/         # Drizzle table definitions mirroring init.sql schemas
```

## API Conventions

All endpoints follow a consistent shape:

```
Success:  { data: T }
Error:    { error: string, details?: unknown }
```

Routes are RESTful:
```
GET    /api/favourites
POST   /api/favourites
PATCH  /api/favourites/:id
DELETE /api/favourites/:id
```

All request bodies are validated with **Zod** schemas before reaching route handlers. Invalid payloads return `400` with the Zod error details.

## Database

Drizzle ORM manages queries and migrations. The database is **PostgreSQL 16** (`life_platform` database, multiple schemas).

Schema definitions live in `src/db/schema/` and mirror `infra/postgres/init.sql`:

| Schema | Tables |
|--------|--------|
| `jobs` | `applications`, `events` |
| `knowledge` | `topics`, `resources`, `notes` |
| `medication` | `medications`, `stock`, `log` |
| `dashboard` | `favourites` |

Connection pool is capped at **10 connections** — multiple services share the same Postgres instance.

## File Uploads

Multer handles file uploads. Files are stored at:
```
/data/uploads/<module>/<YYYY-MM-DD>/<uuid>.<ext>
```

Accepted types per endpoint are enforced at the Multer `fileFilter` level. Max size: **5MB**.

## Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `PORT` | API listen port (default: `3001`) |
| `NTFY_BASE_URL` | Ntfy server URL for push alerts |
| `NTFY_MEDICATION_TOPIC` | Ntfy topic for medication stock alerts |
| `NTFY_DEPLOY_TOPIC` | Ntfy topic for deploy notifications |
| `UPLOADS_DIR` | Base path for file uploads (default: `/data/uploads`) |

Copy `infra/.env.example` and source it, or let Docker Compose inject the vars.
