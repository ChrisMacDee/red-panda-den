# Red Panda Den

A self-hosted life management platform running on a **Raspberry Pi 5 (8GB)**. Custom-built modules (job tracker, knowledge base, medication tracker) sit behind a unified React PWA dashboard, alongside ready-made self-hosted apps (Mealie, Actual Budget, Vikunja, Wiki.js). A public Ghost blog and Medusa.js shop complete the platform.

All private services are protected by **Authelia SSO** (single login, wildcard session cookie) via Cloudflare Tunnel → Traefik.

---

## Repository Structure

```
apps/
  dashboard/
    frontend/     # React 18 SPA + PWA  (port 3000)
    api/          # Express REST API     (port 3001)
  storefront/     # Medusa shop frontend (port 3002) — Phase 11
infra/            # Docker Compose, Traefik, Authelia, Postgres
scripts/          # Deploy, backup, health-check, Pi setup
```

## Apps & Services

| | README | Description |
|--|--------|-------------|
| Dashboard Frontend | [apps/dashboard/frontend/README.md](apps/dashboard/frontend/README.md) | React PWA — the main private UI |
| Dashboard API | [apps/dashboard/api/README.md](apps/dashboard/api/README.md) | Express REST API + Drizzle ORM |
| Infrastructure | [infra/README.md](infra/README.md) | Docker Compose stack, Traefik, Authelia, Postgres |

## Quick Start (local dev, no Docker auth)

```bash
# 1. Copy and fill in environment variables
cp infra/.env.example infra/.env

# 2. Start Postgres + Redis + both apps with hot-reload
cd infra
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d \
  postgres redis dashboard-frontend dashboard-api

# 3. Or run the apps without Docker at all
cd apps/dashboard/api      && npm install && npm run dev   # → http://localhost:3001
cd apps/dashboard/frontend && npm install && npm run dev   # → http://localhost:3000
```

See [infra/README.md](infra/README.md) for the full production stack.

## Service Map

| Service | URL | Auth |
|---------|-----|------|
| Ghost Blog | redpandacreations.co.uk | Public |
| Ghost Admin | redpandacreations.co.uk/ghost | Authelia + Ghost |
| Medusa Storefront | shop.redpandacreations.co.uk | Public |
| Medusa Admin | shop.redpandacreations.co.uk/app | Authelia + Medusa |
| Dashboard | life.redpandacreations.co.uk | Authelia SSO |
| Mealie | meals.redpandacreations.co.uk | Authelia SSO |
| Actual Budget | money.redpandacreations.co.uk | Authelia SSO |
| Vikunja | tasks.redpandacreations.co.uk | Authelia SSO |
| Wiki.js | wiki.redpandacreations.co.uk | Authelia SSO |
| Ntfy | ntfy.redpandacreations.co.uk | Authelia SSO |
| Jellyfin | jellyfin.redpandacreations.co.uk | Authelia SSO |

## Tech Stack

**Frontend:** React 18, TypeScript (strict), Mantine v7, Vite, TanStack Query, React Router v6, vite-plugin-pwa

**API:** Node.js, Express, TypeScript, Drizzle ORM, Zod, Multer

**Infra:** PostgreSQL 16, Redis 7, Traefik v3, Authelia, Ghost 5, Wiki.js 2, Medusa.js v2, Ntfy, Crowdsec, Docker Socket Proxy

## Security Layers

```
Cloudflare  →  Crowdsec  →  Traefik  →  Authelia SSO  →  App auth
(DDoS/WAF)    (IDS/block)  (rate limit)  (TOTP 2FA)    (Ghost/Medusa)
```

## CI

GitHub Actions runs on every push and pull request:
- `npm run lint` — ESLint (flat config, v9)
- `npm run type-check` — TypeScript strict mode
- `npm run test` — Vitest

## Hardware

Raspberry Pi 5 · 8GB RAM · Geekpi Neo 5 case · 1TB NVMe SSD
