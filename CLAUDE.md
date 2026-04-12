# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# Red Panda Den — Project Brain

## What This Is

**Red Panda Den** — a self-hosted life management platform running on a Raspberry Pi 5 (8GB). It combines custom-built modules (job tracker, knowledge base, medication tracker) with ready-made self-hosted apps (Mealie, Actual Budget, Vikunja), all behind a unified dashboard accessible as a PWA on iOS.

The platform also includes a public-facing **portfolio and blog** at the base domain (powered by Ghost) and a **shop** for commissions and products (powered by Medusa.js).

All subdomains of `redpandacreations.co.uk` route through Cloudflare Tunnel → Traefik → Authelia (SSO for private services).

## Commands

### Dashboard Frontend (`apps/dashboard/frontend`)
```bash
npm run dev          # Vite dev server on port 3000
npm run build        # Production build
npm run type-check   # tsc --noEmit
npm run lint         # ESLint
npm run test         # Vitest (all tests)
npm run test -- path/to/file.test.tsx  # Single test file
```

### Dashboard API (`apps/dashboard/api`)
```bash
npm run dev          # tsx watch src/index.ts on port 3001
npm run build        # tsc
npm run type-check   # tsc --noEmit
npm run test         # Vitest (all tests)
npm run test -- path/to/file.test.ts   # Single test file
```

### Medusa Storefront (`apps/storefront`)
```bash
npm run dev          # Vite dev server on port 3002
npm run build        # Production build
npm run type-check   # tsc --noEmit
```

### Infrastructure
```bash
cd infra && docker compose up -d          # Start all services
cd infra && docker compose up -d <name>   # Start specific service
bash scripts/deploy.sh                    # Rolling deploy (pull images → up → health check)
bash scripts/health-check.sh             # Run health checks manually
```

## Architecture Overview

```
Internet → Cloudflare Tunnel → Traefik (reverse proxy + routing)
                                    ↓
                    ┌───────────────┼───────────────┐
                    ↓                               ↓
              PUBLIC (no auth)              PRIVATE (Authelia SSO)
              ┌──────────────┐              ┌──────────────────────────────┐
              │ Ghost Blog   │              │ Red Panda Den Dashboard      │
              │ (base domain)│              │ life.redpandacreations       │
              │              │              │  Job Tracker                 │
              │ Medusa Shop  │              │  Knowledge Base              │
              │ (shop.*)     │              │  Medication Tracker          │
              └──────────────┘              │  Service Links               │
                                            │                              │
                                            │ Ready-Made Apps              │
                                            │ meals/money/tasks/wiki.*     │
                                            │ Mealie, Actual, Vikunja,     │
                                            │ Wiki.js                      │
                                            │                              │
                                            │ YAMS Stack                   │
                                            │ jellyfin/sonarr/radarr etc.  │
                                            └──────────────────────────────┘
                                                        │
                                               ┌────────┴────────┐
                                               │ Express API      │
                                               │ PostgreSQL       │
                                               │ Ntfy (alerts)    │
                                               └─────────────────┘
```

### Auth Boundary

**Public (no Authelia):** Ghost blog at base domain, Medusa storefront at `shop.*`.

**Private (Authelia SSO):** Everything else. One login covers all private subdomains via wildcard session cookie on `*.redpandacreations.co.uk`.

Ghost admin (`/ghost`) and Medusa admin (`/app`) have their own built-in auth but sit behind Authelia for defence in depth.

## Monorepo Structure

```
apps/
  dashboard/frontend/   # React SPA + PWA (port 3000)
  dashboard/api/        # Express REST API (port 3001)
  storefront/           # Medusa shop frontend (port 3002)
infra/
  docker-compose.yml
  docker-compose.dev.yml
  traefik/dynamic/yams.yml   # Routes to existing YAMS stack (do not modify YAMS itself)
  authelia/
  postgres/init.sql          # Schema definitions for all custom modules
  .env.example
scripts/
  deploy.sh             # Rolling deploy: pull → up → health check → Ntfy alert
  backup.sh             # Encrypted DB + uploads backup
  health-check.sh
  setup-pi.sh
```

## Tech Stack

### Frontend (dashboard + storefront)
- **React 18** + TypeScript strict mode
- **Mantine v7** — component library, theming, forms, notifications
- **Vite** — build tool and dev server
- **React Router v6** — client-side routing
- **TanStack Query** — server state, caching, mutations
- **vite-plugin-pwa** — PWA manifest and service worker

### Backend API
- **Node.js + Express** + TypeScript
- **Drizzle ORM** — type-safe PostgreSQL queries and migrations
- **Zod** — request validation
- **Multer** — file uploads

### Infrastructure
- **PostgreSQL 16** — single shared instance, separate schemas per module
- **Traefik v3** — reverse proxy, subdomain routing via container labels
- **Authelia** — SSO
- **Ntfy** — self-hosted push notifications (medication alerts, deploy status)
- **Ghost 5** — blog/portfolio CMS
- **Wiki.js 2** — documentation wiki with Mermaid support
- **Medusa.js v2** — headless e-commerce + Redis 7
- **Crowdsec** — intrusion detection + Traefik bouncer
- **Docker Socket Proxy** (Tecnativa) — Traefik reads Docker metadata without raw socket access

## Coding Conventions

### TypeScript
- Strict mode always (`"strict": true`)
- Prefer `interface` over `type` for object shapes
- Discriminated unions for state: `{ status: 'loading' } | { status: 'error'; error: string } | { status: 'success'; data: T }`
- No `any` — use `unknown` and narrow
- Barrel exports (`index.ts`) per feature directory

### React
- Functional components only
- Custom hooks extract all non-trivial logic from components
- Co-locate component, styles, tests, and types in the same directory
- Mantine's `useForm` for form state; prefer controlled components

### API
- RESTful: `GET /api/jobs`, `POST /api/jobs`, `PATCH /api/jobs/:id`, `DELETE /api/jobs/:id`
- All request bodies validated with Zod schemas
- Error shape: `{ error: string, details?: unknown }`
- Success shape: `{ data: T }`
- File uploads → `/data/uploads/<module>/<date>/` with UUID filenames

### Naming
- Files: `kebab-case.ts` / `kebab-case.tsx`
- Components: `PascalCase`
- Functions/variables: `camelCase`
- Database tables/columns: `snake_case`
- Environment variables: `SCREAMING_SNAKE_CASE`

### Git
- Conventional commits: `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`
- Branch from `main`, PR back to `main` — no direct pushes
- Feature branches: `feat/job-tracker`, `feat/medication-alerts`, etc.

## Database Schema

All custom modules share one PostgreSQL database (`life_platform`) with separate schemas. Full DDL is in `infra/postgres/init.sql`.

### `jobs` schema
- `jobs.applications` — job applications with status (`interested` → `applied` → `screening` → `interviewing` → `offer` → `rejected`/`withdrawn`/`accepted`)
- `jobs.events` — timeline events per application (`applied`, `email_sent`, `phone_screen`, `interview`, `offer`, `rejection`, `follow_up`, `note`)

### `knowledge` schema
- `knowledge.topics` — learning topics with category, status (`not_started`/`in_progress`/`completed`/`revisiting`), and 0–100 progress
- `knowledge.resources` — linked resources per topic (`course`, `video`, `article`, `book`, `documentation`, `wiki`, `other`), with optional uploaded content file path
- `knowledge.notes` — freeform learning notes per topic

### `medication` schema
- `medication.medications` — medications with dosage, frequency, person, active flag
- `medication.stock` — current stock quantity + `reorder_threshold` (days' supply before alert fires)
- `medication.log` — audit log of actions: `taken`, `restocked`, `disposed`, `adjusted`

### `dashboard` schema
- `dashboard.favourites` — user-saved quick-access links with `icon_type` (`favicon`/`library`/`custom`), `colour` (hex accent), and `sort_order`

**Favicon strategy**: `icon_type = 'favicon'` → frontend renders via `https://www.google.com/s2/favicons?domain={domain}&sz=64`. API never fetches or stores favicons.

## Service Map

| Service | Subdomain | Internal Port | Auth |
|---------|-----------|---------------|------|
| Ghost Blog | redpandacreations.co.uk | 2368 | Public |
| Ghost Admin | redpandacreations.co.uk/ghost | 2368 | Authelia + Ghost |
| Medusa Storefront | shop.* | 3002 | Public |
| Medusa API | shop.*/api | 9000 | Public |
| Medusa Admin | shop.*/app | 9000 | Authelia + Medusa |
| Dashboard Frontend | life.* | 3000 | Authelia |
| Dashboard API | life.*/api | 3001 | Authelia |
| Mealie | meals.* | 9925 | Authelia |
| Actual Budget | money.* | 5006 | Authelia |
| Vikunja | tasks.* | 3456 | Authelia |
| Wiki.js | wiki.* | 3003 | Authelia |
| Ntfy | ntfy.* | 8080 | Authelia |
| Uptime Kuma | status.* | 3001 | Authelia |
| Dozzle | logs.* | 8080 | Authelia |
| Traefik Dashboard | traefik.* | 8080 | Authelia |
| Jellyfin | jellyfin.* | 8096 | Authelia |
| Sonarr | sonarr.* | 8989 | Authelia |
| Radarr | radarr.* | 7878 | Authelia |
| Prowlarr | prowlarr.* | 9696 | Authelia |
| qBittorrent | qbit.* | 8080 | Authelia |
| Jellyseerr | jellyseerr.* | 5055 | Authelia |

All subdomains are `*.redpandacreations.co.uk`. YAMS services route through `infra/traefik/dynamic/yams.yml` — never modify the YAMS docker-compose itself.

## PWA Requirements

- `manifest.json`: `display: standalone`, `name: "Red Panda Den"`, `short_name: "Den"`, theme colour `#0C0C0C`
- Icons at 192×192 and 512×512 (generated from `logo.png`)
- Service worker: app shell model — cache the UI, fetch data live
- Apple meta tags: `apple-mobile-web-app-capable`, `apple-mobile-web-app-status-bar-style: black-translucent`
- External service navigation opens in PWA webview where possible

## Ntfy Integration

Medication alerts sent to topic `red-panda-den-medication`:
- Trigger: stock quantity falls below `reorder_threshold` days' supply
- Daily scheduled check in the API
- Payload includes medication name, current stock, required action
- Deploy health checks also alert via Ntfy (success and failure)

## Branding & Design

Logo at `apps/dashboard/frontend/public/logo.png` — crimson red, white, black circular badge.

### Colour Palette

```
Dark Mode (default):
  bg-primary:      #0C0C0C    bg-secondary:   #1A1A1A    bg-tertiary:  #242424
  border:          #333333    text-primary:   #F5F5F5    text-muted:   #A0A0A0
  accent:          #C41E3A    accent-hover:   #D4374F    accent-muted: #3D1520
  success:         #2D8B4E    warning:        #D4A843    danger:       #C41E3A

Light Mode:
  bg-primary:      #FAFAFA    bg-secondary:   #FFFFFF    bg-tertiary:  #F0F0F0
  border:          #E0E0E0    text-primary:   #1A1A1A    text-muted:   #666666
  accent:          #B01830    accent-hover:   #C41E3A    accent-muted: #FDE8EC
  success:         #2D8B4E    warning:        #C49A20    danger:       #B01830
```

### Typography
- **UI / Body**: Plus Jakarta Sans
- **Display / Data / Numbers**: JetBrains Mono
- Import via Google Fonts in `index.html`

### Mantine Theme

```typescript
const theme = createTheme({
  primaryColor: 'red-panda',
  colors: {
    'red-panda': [
      '#FDE8EC', '#F9C2CC', '#F09AAA', '#E57185', '#D4374F',
      '#C41E3A', '#B01830', '#8E1327', '#6C0E1E', '#3D1520',
    ],
  },
  fontFamily: '"Plus Jakarta Sans", sans-serif',
  fontFamilyMonospace: '"JetBrains Mono", monospace',
  defaultRadius: 'md',
  components: {
    Button: { defaultProps: { radius: 'md' } },
    Card: { defaultProps: { radius: 'md', withBorder: true } },
    Badge: { defaultProps: { radius: 'sm' } },
  },
});
```

- Default to dark mode; persist preference in `localStorage`
- Use Mantine's `ColorSchemeScript` + `useMantineColorScheme`

### Design Aesthetic

"Cosy command centre" — warm, personal, characterful. Not corporate SaaS.

- **Layout**: Sidebar nav on desktop (logo at top), bottom tab bar on mobile/PWA
- **Service grid**: Cards grouped as "Den" (custom modules), "Kitchen & Tasks", "Media Den" (YAMS), "Favourites". Green dot = healthy, red = down.
- **Favourites**: Title, URL, optional icon (library icon or auto-fetched favicon), optional hex accent colour, drag-to-reorder. Add via modal. Long-press or edit button to modify/delete.
- **Empty states**: Friendly copy — "Nothing here yet. Add your first application to get started."
- **Animations**: Subtle — page transitions, card hover lift with soft shadow, loading skeletons with muted red tint. Nothing bouncy.

## Security

```
Layer 1: Cloudflare   → DDoS, WAF, TLS, no open ports on Pi
Layer 2: Crowdsec     → Intrusion detection, IP blocklisting via Traefik bouncer
Layer 3: Traefik      → Rate limiting, security headers, Docker socket proxy
Layer 4: Authelia     → SSO, TOTP 2FA, wildcard session cookie
Layer 5: Application  → Ghost admin auth, Medusa admin auth
Layer 6: Infra        → Docker network isolation, Postgres hardening, encrypted backups
```

Key rules:
- Public routes (Ghost, shop storefront) must **not** have `X-Robots-Tag: noindex` — apply that header only to private routes
- Rate limit `/api/store/carts/*/complete` more aggressively than other endpoints
- Commission/upload endpoints: images only (`.jpg`, `.png`, `.webp`), max 5MB, strip EXIF, UUID filenames
- Login/register endpoints: return identical error messages regardless of whether email exists (prevent enumeration)
- Honeypot hidden field on checkout and commission forms — reject if filled

## Medusa Commission Flow

1. Customer sees product on Ghost blog → clicks "Commission this"
2. Lands on shop product page (commission flag = true) → fills commission form
3. Creates a draft order in Medusa with details in notes
4. Chris reviews in Medusa admin, sets price, sends payment link
5. Customer pays → order confirmed

## Important Context

- Raspberry Pi 5 (8GB RAM), Geekpi Neo 5 case, 1TB NVMe SSD
- YAMS media stack runs in a separate docker-compose — integrate via Traefik routing only, never modify YAMS
- Prefer Mantine for all UI — no Tailwind
- Email DNS records (SPF, DKIM, DMARC) must be configured before Ghost and shop go live
- DB connection pools: cap at 5–10 per service — multiple services share one Postgres instance
- Ops runbooks and RAM budget tracked in Wiki.js at `wiki.redpandacreations.co.uk/red-panda-den`
