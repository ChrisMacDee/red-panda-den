# Red Panda Den

A self-hosted life management platform running on a **Raspberry Pi 5 (8GB)**. Custom-built modules (job tracker, knowledge base, medication tracker) sit behind a unified React PWA dashboard, alongside ready-made self-hosted apps (Mealie, Actual Budget, Vikunja, Wiki.js). A public Ghost blog and Medusa.js shop round out the platform.

All private services are protected by **Authelia SSO** via Cloudflare Tunnel → Traefik.

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

## Apps

| App | README | Description |
|-----|--------|-------------|
| Dashboard Frontend | [apps/dashboard/frontend/README.md](apps/dashboard/frontend/README.md) | React PWA — the main UI |
| Dashboard API | [apps/dashboard/api/README.md](apps/dashboard/api/README.md) | Express REST API + Drizzle ORM |
| Infrastructure | [infra/README.md](infra/README.md) | Docker Compose stack, Traefik, Authelia |

## Quick Start (local dev)

```bash
# 1. Copy and fill in environment variables
cp infra/.env.example infra/.env

# 2. Start core services (Postgres, Redis, dashboard)
cd infra
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d \
  postgres redis dashboard-frontend dashboard-api

# 3. Or run apps directly without Docker
cd apps/dashboard/api   && npm install && npm run dev   # :3001
cd apps/dashboard/frontend && npm install && npm run dev   # :3000
```

## Service Map

| Service | URL | Auth |
|---------|-----|------|
| Ghost Blog | redpandacreations.co.uk | Public |
| Medusa Storefront | shop.redpandacreations.co.uk | Public |
| Dashboard | life.redpandacreations.co.uk | Authelia SSO |
| Mealie | meals.redpandacreations.co.uk | Authelia SSO |
| Actual Budget | money.redpandacreations.co.uk | Authelia SSO |
| Vikunja | tasks.redpandacreations.co.uk | Authelia SSO |
| Wiki.js | wiki.redpandacreations.co.uk | Authelia SSO |
| Jellyfin | jellyfin.redpandacreations.co.uk | Authelia SSO |

## Tech Stack

**Frontend:** React 18, TypeScript, Mantine v7, Vite, TanStack Query, React Router v6, vite-plugin-pwa

**API:** Node.js, Express, TypeScript, Drizzle ORM, Zod, Multer

**Infra:** PostgreSQL 16, Redis 7, Traefik v3, Authelia, Ghost 5, Wiki.js 2, Medusa.js v2, Ntfy, Crowdsec, Docker Socket Proxy

## Security Layers

```
Cloudflare  →  Crowdsec  →  Traefik  →  Authelia SSO  →  App auth
(DDoS/WAF)    (IDS/block)  (rate limit)  (TOTP 2FA)    (Ghost/Medusa)
```

## Hardware

Raspberry Pi 5 · 8GB RAM · Geekpi Neo 5 case · 1TB NVMe SSD
