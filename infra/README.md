# Infrastructure

Docker Compose stack for Red Panda Den. Runs on a Raspberry Pi 5 (ARM64). Manages all services — reverse proxy, auth, databases, custom apps, and ready-made self-hosted tools.

## Files

```
infra/
  docker-compose.yml        # Production stack
  docker-compose.dev.yml    # Dev overrides — direct port exposure, hot-reload mounts, no auth
  .env.example              # All required environment variables with descriptions
  traefik/
    traefik.yml             # Static Traefik config (entrypoints, providers, cert resolver)
    dynamic/
      middlewares.yml       # Auth + security header middleware chains
      yams.yml              # Routes for the YAMS media stack (do not modify YAMS itself)
  authelia/
    configuration.yml       # Authelia SSO config — session, TOTP, access rules
    users_database.yml      # Local user store (hashed passwords)
  postgres/
    init.sql                # Schema DDL for all custom modules — runs once on first start
```

## Running the Stack

```bash
# 1. Copy and populate environment variables
cp .env.example .env

# 2. Production (via Traefik subdomain routing)
docker compose up -d

# 3. Development (direct port access, no Traefik/Authelia)
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d

# 4. Specific services only
docker compose up -d postgres redis dashboard-api dashboard-frontend
```

## Service Profiles

Some services are gated behind Docker Compose profiles and **will not start by default**:

| Profile | Services | Phase |
|---------|----------|-------|
| `medusa` | `medusa-server`, `medusa-storefront` | Phase 11 |
| `security` | `crowdsec`, `crowdsec-bouncer` | Phase 9 |

Enable a profile:
```bash
docker compose --profile medusa up -d
docker compose --profile security up -d
```

## Service Overview

| Service | Image | Port | Notes |
|---------|-------|------|-------|
| `docker-socket-proxy` | tecnativa/docker-socket-proxy | — | Traefik reads Docker metadata safely |
| `traefik` | traefik:v3 | 80, 443 | Reverse proxy, subdomain routing, TLS |
| `authelia` | authelia/authelia | 9091 | SSO + TOTP 2FA for all private services |
| `postgres` | postgres:16 | 5432* | Shared DB — `life_platform`, `medusa`, `wikijs` |
| `redis` | redis:7-alpine | 6379* | Session store (Authelia) + Medusa cache |
| `dashboard-frontend` | (built from source) | 3000* | React PWA |
| `dashboard-api` | (built from source) | 3001* | Express API |
| `ghost` | ghost:5-alpine | 2368 | Blog + portfolio CMS |
| `mealie` | ghcr.io/mealie-recipes/mealie | 9925 | Recipe manager |
| `actual` | actualbudget/actual-server | 5006 | Budget tracker |
| `vikunja` | vikunja/vikunja | 3456 | Task manager |
| `wikijs` | ghcr.io/requarks/wiki | 3003 | Internal wiki |
| `ntfy` | binwiederhier/ntfy | 8080 | Push notifications |
| `uptime-kuma` | louislam/uptime-kuma | 3001 | Service uptime monitoring |
| `dozzle` | amir20/dozzle | 8080 | Docker log viewer |
| `watchtower` | containrrr/watchtower | — | Auto-update containers |

*Ports marked with `*` are only exposed to the host in dev mode.

## Networking

Three Docker networks keep services isolated:

| Network | Purpose |
|---------|---------|
| `proxy` | Traefik + all web-facing services |
| `internal` | Services that don't need Traefik (Postgres, Redis, etc.) |
| `socket-proxy` | Traefik ↔ Docker Socket Proxy only |

## Database

All custom modules share the `life_platform` database with separate schemas. `infra/postgres/init.sql` creates all schemas, tables, and indexes on first start.

To connect locally (dev mode only):
```bash
psql postgresql://lifeplatform:<password>@localhost:5432/life_platform
```

To run migrations after schema changes, update `init.sql` and recreate the volume:
```bash
docker compose down -v postgres   # ⚠ destroys data — dev only
docker compose up -d postgres
```

In production, write migration scripts rather than recreating the volume.

## Authelia

Users are managed in `authelia/users_database.yml`. Passwords must be **argon2id** hashes:

```bash
docker run authelia/authelia:latest authelia crypto hash --password 'yourpassword'
```

Access rules are in `authelia/configuration.yml`. The wildcard session cookie covers all `*.redpandacreations.co.uk` subdomains so a single login grants access to all private services.

## Environment Variables

See `.env.example` for the full list with descriptions. Key variables:

| Variable | Used by |
|----------|---------|
| `BASE_DOMAIN` | Traefik labels, Authelia |
| `POSTGRES_USER / PASSWORD / DB` | Postgres, API |
| `AUTHELIA_JWT_SECRET` | Authelia |
| `AUTHELIA_SESSION_SECRET` | Authelia |
| `CROWDSEC_BOUNCER_API_KEY` | CrowdSec bouncer (profile: security) |

## Scripts

From the repo root:

```bash
bash scripts/deploy.sh        # Pull latest images → up → health check → Ntfy alert
bash scripts/backup.sh        # Encrypted DB + uploads backup
bash scripts/health-check.sh  # Manual health check for all services
bash scripts/setup-pi.sh      # First-time Pi 5 setup (Docker, dirs, firewall)
```
