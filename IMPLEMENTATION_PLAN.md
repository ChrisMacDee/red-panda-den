# Implementation Plan — Red Panda Den

This document is a step-by-step build guide. Work through each phase sequentially. Each phase has acceptance criteria — don't move to the next phase until all criteria are met.

---

## Phase 1: Repository Scaffold & CI Pipeline

**Goal**: Empty monorepo with CI that runs on every push.

### Tasks
1. Initialise the monorepo structure as defined in CLAUDE.md
2. Set up the frontend project:
   - `npm create vite@latest` with React + TypeScript template
   - Install Mantine v7: `@mantine/core`, `@mantine/hooks`, `@mantine/form`, `@mantine/notifications`, `@mantine/dates`
   - Install: `react-router-dom`, `@tanstack/react-query`, `axios`, `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`
   - Install dev deps: `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `jsdom`
   - Configure `vite.config.ts` with path aliases (`@/` → `src/`)
   - Configure `tsconfig.json` with strict mode
   - Create a placeholder `App.tsx` that renders "Red Panda Den" with Mantine provider
   - Add one passing test

3. Set up the API project:
   - `npm init` with TypeScript
   - Install: `express`, `drizzle-orm`, `drizzle-kit`, `postgres`, `zod`, `multer`, `cors`, `helmet`
   - Install dev deps: `vitest`, `tsx`, `typescript`, `@types/express`, `@types/multer`, `@types/cors`
   - Create `src/index.ts` with a basic Express server and `/api/health` endpoint returning `{ status: 'ok', timestamp: ... }`
   - Add one passing test for the health endpoint

4. Create `.github/workflows/ci.yml`:
   ```yaml
   name: CI
   on: [push, pull_request]
   jobs:
     frontend:
       runs-on: ubuntu-latest
       steps:
         - checkout
         - setup node 20
         - npm ci (in apps/dashboard/frontend)
         - npm run lint
         - npm run type-check
         - npm run test
     api:
       runs-on: ubuntu-latest
       steps:
         - checkout
         - setup node 20
         - npm ci (in apps/dashboard/api)
         - npm run lint
         - npm run type-check
         - npm run test
   ```

5. Create `.gitignore` covering node_modules, dist, .env, data volumes
6. Create `infra/.env.example` with all required env vars (placeholder values)
7. Create `README.md` with project overview and setup instructions

### Acceptance Criteria
- [ ] `npm run dev` works in both frontend and api directories
- [ ] `npm run test` passes in both directories
- [ ] `npm run type-check` passes with zero errors
- [ ] CI workflow file is valid YAML and covers both projects
- [ ] `.env.example` documents all required variables
- [ ] Monorepo structure matches CLAUDE.md exactly

---

## Phase 2: Infrastructure — Docker Compose, Traefik, Authelia

**Goal**: All services defined in docker-compose, Traefik routing works, Authelia protects all routes.

### Tasks
1. Create Dockerfiles for frontend and API:
   - Frontend: multi-stage (node builder → nginx serving built assets)
   - API: multi-stage (node builder → node production with compiled JS)
   - Both targeting `linux/arm64`

2. Create `infra/docker-compose.yml` with all services:
   ```
   Services:
   - traefik (v3, with docker provider, entrypoints for 80/443)
   - authelia (with forwardAuth middleware)
   - postgres (v16, with init.sql for schemas)
   - redis (v7 alpine, for Medusa)
   - dashboard-frontend (custom image, traefik labels)
   - dashboard-api (custom image, traefik labels, depends on postgres)
   - ghost (ghost:5-alpine, base domain, public)
   - medusa-server (medusajs/medusa, depends on postgres + redis)
   - medusa-storefront (custom image, shop.* subdomain, public)
   - mealie (ghcr.io/mealie-recipes/mealie, traefik labels)
   - actual-budget (actualbudget/actual-server, traefik labels)
   - vikunja (vikunja/vikunja, traefik labels)
   - wikijs (ghcr.io/requarks/wiki:2, depends on postgres, traefik labels)
   - ntfy (binwiederhier/ntfy, traefik labels)
   - crowdsec (crowdsecurity/crowdsec, reads traefik logs)
   - crowdsec-bouncer (fbonalair/traefik-crowdsec-bouncer, traefik middleware)
   - docker-socket-proxy (tecnativa/docker-socket-proxy, read-only)
   - uptime-kuma (louislam/uptime-kuma:1, traefik labels)
   - dozzle (amir20/dozzle, traefik labels, reads docker socket via proxy)
   - watchtower (containrrr/watchtower, monitor-only mode, ntfy notifications)
   ```

3. Create `infra/traefik/traefik.yml`:
   - Docker provider enabled
   - Entrypoints: web (80), websecure (443) — though Cloudflare Tunnel handles TLS, so internal traffic is HTTP
   - ForwardAuth middleware pointing to Authelia for all routes

4. Create `infra/authelia/configuration.yml`:
   - Session domain: `redpandacreations.co.uk`
   - Default policy: `one_factor`
   - Access control rules:
     - `redpandacreations.co.uk` (base domain, excluding `/ghost/*`) → bypass (public)
     - `shop.redpandacreations.co.uk` (excluding `/app/*`) → bypass (public)
     - `redpandacreations.co.uk/ghost/*` → one_factor (admin)
     - `shop.redpandacreations.co.uk/app/*` → one_factor (admin)
     - Everything else (`*.redpandacreations.co.uk`) → one_factor (private)
   - Storage: local SQLite
   - Session: in-memory (fine for single user)
   - TOTP enabled for optional 2FA

5. Create `infra/authelia/users_database.yml`:
   - One user (Chris) with argon2id hashed password
   - Instructions in README for generating the password hash

6. Create `infra/postgres/init.sql`:
   - Create schemas: `jobs`, `knowledge`, `medication`, `dashboard` (in `life_platform` database)
   - Create separate `medusa` database (Medusa manages its own tables)
   - Create all tables from CLAUDE.md schema (including `dashboard.favourites`)

7. Create `infra/docker-compose.dev.yml`:
   - Override frontend/api to mount local source and use hot-reload
   - Expose Postgres port for local tooling
   - No Traefik/Authelia (dev accesses services directly)

8. Create Traefik labels for each service so routing works:
   - `redpandacreations.co.uk` → ghost (PUBLIC, no Authelia)
   - `redpandacreations.co.uk/ghost/*` → ghost (WITH Authelia — admin only)
   - `shop.redpandacreations.co.uk` → medusa-storefront (PUBLIC)
   - `shop.redpandacreations.co.uk/api/*` → medusa-server (PUBLIC — storefront API)
   - `shop.redpandacreations.co.uk/app/*` → medusa-server admin (WITH Authelia)
   - `life.redpandacreations.co.uk` → dashboard-frontend (Authelia)
   - `life.redpandacreations.co.uk/api/*` → dashboard-api (Authelia, with stripPrefix)
   - `meals.redpandacreations.co.uk` → mealie (Authelia)
   - `money.redpandacreations.co.uk` → actual-budget (Authelia)
   - `tasks.redpandacreations.co.uk` → vikunja (Authelia)
   - `wiki.redpandacreations.co.uk` → wikijs (Authelia)
   - `ntfy.redpandacreations.co.uk` → ntfy (Authelia)
   - `auth.redpandacreations.co.uk` → authelia (no Authelia on itself)

### Acceptance Criteria
- [ ] `docker compose -f infra/docker-compose.yml config` validates without errors
- [ ] Traefik config is valid and references correct entrypoints
- [ ] Authelia config has session scoped to wildcard domain
- [ ] Authelia access control correctly marks Ghost and shop storefront as public (bypass)
- [ ] Authelia access control correctly protects Ghost admin and Medusa admin
- [ ] Postgres init.sql creates all three schemas, tables, and the medusa database
- [ ] Each service has correct Traefik labels for subdomain routing
- [ ] ForwardAuth middleware is applied to all private services, NOT to public routes
- [ ] Dev compose overrides correctly enable hot-reload

---

## Phase 3: Dashboard Shell & PWA

**Goal**: A working dashboard app with navigation, PWA installability, and service links grid.

### Tasks
1. Set up Mantine theme:
   - Custom `MantineProvider` theme object as defined in CLAUDE.md (Branding & Design Direction section)
   - Implement dark/light mode toggle using Mantine's `useMantineColorScheme` and `ColorSchemeScript`
   - Dark mode as default, preference persisted in localStorage
   - Colour palette: crimson red (`#C2162E`) accent on near-black (`#0C0C0C`) background (dark), off-white (`#FAFAFA`) background (light)
   - Custom `red-panda` colour swatch in theme (10 shades as defined in CLAUDE.md)
   - Typography: JetBrains Mono (for data/stats), Plus Jakarta Sans (for UI)
   - Import fonts via Google Fonts in `index.html`
   - Custom component defaults (card radius, button styles, etc.)
   - Theme toggle: accessible from user menu / settings gear icon in sidebar header

2. Create app layout:
   - `AppShell` component using Mantine's AppShell
   - Desktop: sidebar navigation with Red Panda Den logo at top (32-40px), icon + label for each module, theme toggle, settings gear
   - Mobile: bottom tab bar navigation (detect via Mantine's `useMediaQuery` or breakpoints), logo in compact top bar
   - Header with app title ("Red Panda Den") and user avatar/menu with theme toggle option

3. Set up React Router:
   ```
   /                → Dashboard home (service links grid)
   /jobs            → Job tracker
   /jobs/:id        → Job application detail
   /knowledge       → Knowledge base
   /knowledge/:id   → Topic detail
   /medication      → Medication tracker
   ```

4. Create the service links grid (dashboard home page):
   - Card grid showing all services (custom modules + external apps + YAMS)
   - Each card: icon, service name, description, status indicator
   - External service cards link to their subdomain URLs
   - Custom module cards use React Router navigation
   - Cards grouped by category: "Den" (custom modules), "Kitchen & Tasks" (Mealie, Actual, Vikunja), "Media Den" (YAMS), "Public Site" (Ghost, Shop), "Favourites" (user-saved)
   - Service health check: API endpoint that pings each service, cards show green/red dot

5. Create the Favourites feature:
   - API routes:
     - `GET /api/favourites` — list all favourites (ordered by sort_order)
     - `POST /api/favourites` — create a favourite (title, url, icon, colour)
     - `PATCH /api/favourites/:id` — update a favourite
     - `DELETE /api/favourites/:id` — delete a favourite
     - `PATCH /api/favourites/reorder` — update sort_order for multiple items (drag-and-drop)
   - Zod validation for request bodies
   - Frontend:
     - "Favourites" section in the dashboard grid with user-saved link cards
     - Each card: title, icon, optional accent colour
     - **Icon defaults to the site's favicon** — auto-fetched via Google's favicon service (`https://www.google.com/s2/favicons?domain={domain}&sz=64`). No server-side work needed, just an `<img>` tag.
     - "Add Favourite" button opens a Mantine modal with form:
       - Title (auto-populated from URL if possible via page title fetch)
       - URL (required)
       - Icon: defaults to "Auto (favicon)" — user can override by switching to library icon picker (Mantine/Lucide icons) or pasting a custom icon URL
       - Colour picker for optional card accent
     - Edit/delete via context menu (right-click on desktop, long-press on mobile) or an edit icon on hover
     - Drag-to-reorder using `@dnd-kit/core` + `@dnd-kit/sortable`
     - Empty state: "Add your favourite sites for quick access"

6. Configure PWA:
   - Install `vite-plugin-pwa`
   - Create `manifest.json`:
     ```json
     {
       "name": "Red Panda Den",
       "short_name": "Den",
       "display": "standalone",
       "start_url": "/",
       "background_color": "#0C0C0C",
       "theme_color": "#0C0C0C",
       "icons": [
         { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
         { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
       ]
     }
     ```
   - Add Apple meta tags to `index.html`:
     ```html
     <meta name="apple-mobile-web-app-capable" content="yes">
     <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
     <link rel="apple-touch-icon" href="/icons/icon-192.png">
     ```
   - Service worker: precache app shell, network-first for API calls
   - Generate PWA icons from the Red Panda Den logo (resize to 192x192 and 512x512 with padding)

7. Create placeholder pages for each module (just the page title and a "coming soon" state)

### Acceptance Criteria
- [ ] App renders with custom Mantine dark theme using Red Panda Den colour palette
- [ ] Dark/light mode toggle works and preference persists across page reloads
- [ ] Sidebar navigation works on desktop (with logo), bottom tabs on mobile
- [ ] All routes render correct placeholder pages
- [ ] Service links grid shows all services with correct URLs, grouped by category
- [ ] Favourites: can add, edit, delete, and reorder saved links
- [ ] Favourites persist across sessions (stored in database)
- [ ] Favourite cards display with icon and optional accent colour
- [ ] PWA manifest is valid (test with Chrome DevTools → Application tab)
- [ ] App is installable as PWA on iOS Safari (Add to Home Screen works, shows "Red Panda Den")
- [ ] Service worker caches app shell for offline access
- [ ] Fonts load correctly (JetBrains Mono + Plus Jakarta Sans)
- [ ] Logo displays correctly in sidebar header and PWA icon

---

## Phase 4: Job Application Tracker

**Goal**: Fully functional job tracker replacing the Google Spreadsheet.

### Tasks

#### API
1. Create Drizzle schema for `jobs.applications` and `jobs.events`
2. Create routes:
   - `GET /api/jobs` — list all applications (with query params for status filter, sort, search)
   - `GET /api/jobs/:id` — single application with its events
   - `POST /api/jobs` — create application
   - `PATCH /api/jobs/:id` — update application
   - `DELETE /api/jobs/:id` — delete application (soft delete via status='archived'?)
   - `POST /api/jobs/:id/events` — add event to timeline
   - `DELETE /api/jobs/:id/events/:eventId` — remove event
3. Zod validation schemas for all request bodies
4. Write tests for each route

#### Frontend
1. **Jobs list page** (`/jobs`):
   - Table/list view of all applications
   - Columns: company, role, status, applied date, last activity
   - Status shown as coloured badge
   - Filter by status (tabs or dropdown)
   - Search by company/role name
   - Sort by date, company, status
   - "Add Application" button → opens modal/drawer
   - Click row → navigate to detail page

2. **Job detail page** (`/jobs/:id`):
   - Header: company, role, status badge, applied date
   - Editable fields (inline or edit mode)
   - URL link (opens in new tab)
   - Salary range, location, contact info
   - Notes section (textarea, auto-saves)
   - Timeline: chronological list of events with type icons
   - "Add Event" button with event type selector and description
   - Status change buttons (e.g., "Mark as Interviewing", "Mark as Rejected")

3. **Add/Edit Application modal**:
   - Form with: company, role, URL, status, salary range, location, contact name, contact email, notes, applied date
   - Mantine useForm with Zod validation

4. **Dashboard summary card** (on home page):
   - Total active applications
   - Breakdown by status (small bar or badges)
   - Most recent activity

### Acceptance Criteria
- [ ] Can create, view, edit, and delete job applications
- [ ] Can add and view timeline events per application
- [ ] Status filter and search work correctly
- [ ] Form validation prevents bad data
- [ ] Dashboard home shows job tracker summary card
- [ ] All API routes have passing tests
- [ ] Mobile layout is usable (responsive table/cards)

---

## Phase 5: Knowledge Base & Learning Tracker

**Goal**: Track learning topics, link resources, monitor progress.

### Tasks

#### API
1. Drizzle schema for `knowledge.topics`, `knowledge.resources`, `knowledge.notes`
2. Routes:
   - CRUD for topics
   - CRUD for resources (nested under topics)
   - CRUD for notes (nested under topics)
   - `PATCH /api/knowledge/:id/progress` — update progress percentage
   - `POST /api/knowledge/:id/resources/upload` — upload text content file (multer)
   - `GET /api/knowledge/stats` — overall stats (total topics, in progress, completed)
3. File upload handling: text files stored in `/data/uploads/knowledge/`
4. Tests for all routes

#### Frontend
1. **Knowledge list page** (`/knowledge`):
   - Card grid of topics
   - Each card: title, category badge, progress bar, resource count, status
   - Filter by status and category
   - Search by title
   - "Add Topic" button

2. **Topic detail page** (`/knowledge/:id`):
   - Title, description, category, status
   - Progress slider (0-100) — updates via API on change
   - Resources section: list of linked resources with type icons (video, article, course, wiki, etc.)
   - Each resource: title, URL (clickable), type badge, completed checkbox
   - "Add Resource" button: form with title, URL, type, notes
   - "Link Wiki Page" shortcut: pre-fills the resource URL with `https://wiki.redpandacreations.co.uk/en/` prefix and sets type to `wiki`
   - "Upload Content" button: file upload for text-based learning content
   - Notes section: markdown-capable notes list with add/edit
   - Status change buttons

3. **Dashboard summary card**:
   - Topics in progress count
   - Overall completion stats
   - Recently updated topics

### Acceptance Criteria
- [ ] Can create and manage learning topics
- [ ] Can link external resources (URLs) and mark as completed
- [ ] Can upload text content files
- [ ] Progress bar updates and persists
- [ ] Category and status filters work
- [ ] Dashboard shows knowledge summary
- [ ] File uploads are stored correctly and retrievable

---

## Phase 6: Medication Tracker + Ntfy Alerts

**Goal**: Track medication stock, log usage, get push alerts when stock is low.

### Tasks

#### API
1. Drizzle schema for `medication.medications`, `medication.stock`, `medication.log`
2. Routes:
   - CRUD for medications
   - `GET /api/medication/:id/stock` — current stock level
   - `PATCH /api/medication/:id/stock` — update stock (restock or adjust)
   - `POST /api/medication/:id/log` — log action (taken, restocked, disposed)
   - `GET /api/medication/alerts` — medications below reorder threshold
3. Ntfy service (`src/services/ntfy.ts`):
   - Function to send notification to Ntfy topic
   - Payload: title, message, priority, tags
4. Stock check scheduler:
   - Runs daily (use `node-cron` or simple `setInterval`)
   - Calculates days of supply remaining based on dosage frequency and current stock
   - If below threshold → sends Ntfy alert
   - Also triggers when stock is manually updated and falls below threshold
5. Tests for routes and alert logic

#### Frontend
1. **Medication list page** (`/medication`):
   - Card list of all active medications
   - Each card: name, dosage, frequency, person, current stock level
   - Stock shown as visual indicator (green/amber/red based on days remaining)
   - "Add Medication" button
   - Toggle to show/hide inactive medications

2. **Medication detail page** (`/medication/:id` or drawer/modal):
   - All medication info (editable)
   - Current stock with restock/adjust buttons
   - "Log Taken" quick button (decrements stock by one dose)
   - Stock history / log timeline
   - Reorder threshold setting
   - Prescriber and pharmacy info

3. **Dashboard summary card**:
   - Medications needing reorder (red alert)
   - Quick "taken" buttons for daily medications

### Acceptance Criteria
- [ ] Can add and manage medications
- [ ] Stock tracking works (restock, log taken, adjust)
- [ ] Days remaining calculation is correct based on frequency
- [ ] Ntfy notification fires when stock drops below threshold
- [ ] Ntfy notification contains medication name and action needed
- [ ] Daily scheduled check runs and alerts correctly
- [ ] Dashboard shows medication alerts prominently
- [ ] Mobile-friendly quick "taken" buttons work

---

## Phase 7: Ready-Made Apps Integration

**Goal**: Mealie, Actual Budget, Vikunja, and Wiki.js are running and accessible from the dashboard.

### Tasks
1. Verify all four services start correctly in docker-compose
2. Confirm Traefik routes each to correct subdomain
3. Confirm Authelia protects all four (forwardAuth middleware)
4. Add service health check to the dashboard API:
   - `GET /api/services/health` — pings each external service and returns status
5. Update dashboard service links grid with live status indicators
6. Test each service is accessible and functional:
   - Mealie: can create a recipe, generate shopping list
   - Actual Budget: can create a budget, add transactions
   - Vikunja: can create a project with Kanban view and list view
   - Wiki.js: can create a page with Markdown, verify Mermaid diagrams render
7. Document initial setup steps for each service (first-run configuration)
8. Wiki.js specific setup:
   - Configure PostgreSQL connection (shared instance)
   - Enable Mermaid diagram module in admin (Administration → Rendering → Markdown)
   - Enable code block syntax highlighting
   - Optionally enable Git sync to a private GitHub repo for content backup
   - Create initial page structure: Red Panda Den architecture overview, with Mermaid diagram of the service architecture
   - Set up navigation sidebar matching the suggested wiki structure from CLAUDE.md

### Acceptance Criteria
- [ ] All four services are accessible at their subdomains
- [ ] Authelia SSO session carries across — login once, access all
- [ ] Dashboard shows live health status for each service
- [ ] Each service is functional after first-run setup
- [ ] Wiki.js renders Mermaid diagrams correctly
- [ ] Wiki.js full-text search works
- [ ] Wiki.js initial page structure is created
- [ ] Docker compose starts all services without errors on Pi

---

## Phase 8: YAMS Integration

**Goal**: Existing YAMS services are accessible from the dashboard and protected by Authelia.

### Tasks
1. Create Traefik configuration to route to YAMS services:
   - Option A: Add Traefik labels to YAMS docker-compose (requires modifying YAMS compose)
   - Option B: Use Traefik file provider to define routes to YAMS service ports (no YAMS changes)
   - **Prefer Option B** — keeps YAMS compose untouched
2. Create `infra/traefik/dynamic/yams.yml` with routes for each YAMS service
3. Apply Authelia forwardAuth middleware to YAMS routes
4. Add YAMS services to dashboard service links grid
5. Test each YAMS service is accessible via its new subdomain

### Acceptance Criteria
- [ ] All YAMS services accessible via subdomains
- [ ] Authelia SSO protects YAMS services
- [ ] Dashboard shows YAMS services with health indicators
- [ ] Existing YAMS docker-compose is NOT modified
- [ ] YAMS services continue working via their original ports too (no breaking changes)

---

## Phase 9: Security Hardening & Monitoring

**Goal**: Lock down the stack and set up independent monitoring with alerting.

### Tasks

#### Crowdsec
1. Add Crowdsec and bouncer to docker-compose:
   ```yaml
   crowdsec:
     image: crowdsecurity/crowdsec
     volumes:
       - crowdsec_config:/etc/crowdsec
       - crowdsec_data:/var/lib/crowdsec/data
       - traefik_logs:/var/log/traefik:ro
     environment:
       COLLECTIONS: "crowdsecurity/traefik crowdsecurity/http-cve"
   
   crowdsec-bouncer:
     image: fbonalair/traefik-crowdsec-bouncer
     environment:
       CROWDSEC_BOUNCER_API_KEY: ${CROWDSEC_API_KEY}
       CROWDSEC_AGENT_HOST: crowdsec:8080
   ```
2. Add Crowdsec bouncer as Traefik middleware (applied to all routes)
3. Configure Crowdsec to send Ntfy alerts on ban events
4. Test by simulating a brute force attempt and verifying the IP gets blocked

#### Traefik Hardening
5. Create TWO security headers middlewares:
   - `security-headers-private`: includes `X-Robots-Tag: noindex, nofollow` (prevents search engines indexing private services)
   - `security-headers-public`: same headers but WITHOUT `X-Robots-Tag` (Ghost and shop SHOULD be indexed)
   - Both include: `X-Content-Type-Options`, `X-Frame-Options`, `Strict-Transport-Security`, `Permissions-Policy`, `Content-Security-Policy`
6. Add rate limiting middleware to public routes (Ghost, shop), with a stricter rate limit on shop checkout endpoint
7. Replace direct Docker socket mount with Docker Socket Proxy:
   ```yaml
   docker-socket-proxy:
     image: tecnativa/docker-socket-proxy
     environment:
       CONTAINERS: 1
     volumes:
       - /var/run/docker.sock:/var/run/docker.sock:ro
   ```
   Update Traefik to connect to proxy instead of socket

#### PostgreSQL Hardening
8. Remove exposed Postgres port from production compose (keep in dev compose only)
9. Configure `scram-sha-256` authentication
10. Move database password to Docker secrets

#### Uptime Kuma
11. Add Uptime Kuma to docker-compose with Traefik labels for `status.redpandacreations.co.uk`
12. Configure monitors for every service endpoint
13. Configure Ntfy as notification provider
14. Set check interval to 60 seconds
15. Add to dashboard service links grid under "Infrastructure" category

#### Watchtower
16. Add Watchtower in monitor-only mode:
    ```yaml
    watchtower:
      image: containrrr/watchtower
      command: --monitor-only --notification-url "generic://ntfy.redpandacreations.co.uk/red-panda-den-updates"
      volumes:
        - /var/run/docker.sock:/var/run/docker.sock:ro
    ```
17. Verify it sends Ntfy notifications when test image updates are available

#### Dozzle
18. Add Dozzle to docker-compose with Traefik labels for `logs.redpandacreations.co.uk` (behind Authelia)
19. Verify it shows live logs from all containers
20. Add to dashboard service links grid under "Infrastructure" category

#### Gluetun Health Check
21. Add Gluetun VPN status check to `scripts/health-check.sh`
22. If Gluetun is down, send high-priority Ntfy alert

#### PostgreSQL Connection Pooling
23. Set `max_connections = 100` in Postgres config
24. Configure dashboard API Drizzle pool to max 10 connections
25. Note pool size settings for Wiki.js, Medusa, and Vikunja in README

#### Backup Encryption
26. Update `scripts/backup.sh` to encrypt dumps with GPG before offsite sync
27. Document the decryption process in README

#### Email DNS (do this before Ghost and shop go live)
28. Choose a transactional email provider (Brevo, Mailgun, or Resend free tier)
29. Add SPF TXT record to `redpandacreations.co.uk` in Cloudflare DNS
30. Add DKIM TXT record (provided by email service)
31. Add DMARC TXT record (`v=DMARC1; p=quarantine`)
32. Test deliverability by sending a test email and checking headers

#### Cloudflare Failover
33. Create a simple static "We'll be back shortly" page on Cloudflare Pages
34. Enable Cloudflare's Always Online feature for the Ghost domain
35. Configure the failover page for the shop subdomain

### Acceptance Criteria
- [ ] Crowdsec is running and parsing Traefik logs
- [ ] Simulated brute force attempt results in IP ban
- [ ] Crowdsec sends Ntfy alert on ban
- [ ] Security headers present on all responses (verify with `curl -I`)
- [ ] Public routes use `security-headers-public` (no noindex), private routes use `security-headers-private`
- [ ] Rate limiting active on public endpoints
- [ ] Docker socket proxy is in use — Traefik has no direct socket access
- [ ] Postgres port not exposed in production
- [ ] Uptime Kuma monitors all services and sends Ntfy on downtime
- [ ] Dozzle shows live logs from all containers
- [ ] Watchtower sends Ntfy when image updates are available
- [ ] Gluetun health check works and alerts on VPN failure
- [ ] Backup encryption works and can be decrypted
- [ ] SPF, DKIM, and DMARC DNS records are configured and pass validation
- [ ] Test email from SMTP provider arrives in inbox (not spam)
- [ ] Cloudflare failover page displays when tunnel is down

---

## Phase 10: Ghost — Portfolio & Blog

**Goal**: Public-facing portfolio and blog live at the base domain.

### Tasks
1. Add Ghost to `infra/docker-compose.yml`:
   ```yaml
   ghost:
     image: ghost:5-alpine
     volumes:
       - ghost_content:/var/lib/ghost/content
     environment:
       url: https://redpandacreations.co.uk
       database__client: sqlite3
       NODE_ENV: production
     labels:
       - traefik routing to base domain
       - Authelia on /ghost admin path ONLY
   ```

2. Configure Traefik routing:
   - `redpandacreations.co.uk` → ghost (public, NO Authelia)
   - `redpandacreations.co.uk/ghost/*` → ghost (WITH Authelia middleware)
   - This requires a path-based Traefik rule with middleware only on the admin path

3. Set up Ghost theme:
   - Start with a clean base theme (Casper or Source) and customise
   - Apply Red Panda Creations branding: logo, crimson/black/white colour scheme
   - Create a custom "Portfolio" page template with:
     - Category-filtered card grid (Games, Puppets, Guitars, Leather Craft)
     - Large featured images per project
     - "Commission this" CTA buttons linking to the shop
   - Ensure mobile responsiveness

4. Create initial content structure:
   - Homepage: hero with logo, tagline, featured projects, latest blog posts
   - Portfolio page: filterable project grid
   - Blog: standard Ghost blog layout
   - About page: bio, skills, links to GitHub/LinkedIn
   - Contact page (or section)

5. Add Ghost to dashboard service links grid (under a "Public Site" category)
6. Configure Ghost SMTP for transactional emails (optional, can use Mailgun free tier)
7. If enabling Ghost membership/comments: add cookie consent banner and link to privacy policy (can share with shop or create a site-wide one)
8. Verify Ghost is using the `security-headers-public` middleware (NOT the private one — Ghost should be search-indexed)

### Acceptance Criteria
- [ ] Ghost accessible at `redpandacreations.co.uk` without auth
- [ ] Ghost admin at `/ghost` is protected by Authelia
- [ ] Theme matches Red Panda Creations branding (logo, colours)
- [ ] Portfolio page displays project showcases with images
- [ ] Blog posts render correctly with images and formatting
- [ ] Security headers present but `X-Robots-Tag` is NOT set (site should be indexed)
- [ ] Mobile responsive
- [ ] Dashboard shows Ghost in service links
- [ ] Site loads in under 3 seconds on mobile

---

## Phase 11: Medusa.js — Shop

**Goal**: Self-hosted shop for selling products and accepting commissions.

### Tasks

#### Infrastructure
1. Add Redis to `infra/docker-compose.yml`:
   ```yaml
   redis:
     image: redis:7-alpine
     volumes:
       - redis_data:/data
   ```

2. Add Medusa server to `infra/docker-compose.yml`:
   ```yaml
   medusa-server:
     image: medusajs/medusa:latest
     depends_on: [postgres, redis]
     environment:
       DATABASE_URL: postgres://...medusa database
       REDIS_URL: redis://redis:6379
       STORE_CORS: https://shop.redpandacreations.co.uk
       ADMIN_CORS: https://shop.redpandacreations.co.uk
     labels:
       - traefik routing for shop.redpandacreations.co.uk/api
       - traefik routing for shop.redpandacreations.co.uk/app (Authelia protected)
   ```

3. Update `infra/postgres/init.sql` to create a `medusa` database
4. Configure Traefik routing:
   - `shop.redpandacreations.co.uk` → medusa-storefront (public)
   - `shop.redpandacreations.co.uk/api/*` → medusa-server (public, storefront API)
   - `shop.redpandacreations.co.uk/app/*` → medusa-server admin (Authelia protected)

#### Storefront (apps/storefront)
5. Scaffold React + Mantine + TypeScript + Vite project (same stack as dashboard)
6. Create storefront pages:
   - **Home**: Hero banner, featured products grid, categories
   - **Product listing** (`/products`): Card grid with filters by category
   - **Product detail** (`/products/:handle`): Image gallery, description, variants selector, Add to Cart / Commission form
   - **Cart** (`/cart`): Line items, quantities, totals, checkout button
   - **Checkout** (`/checkout`): Shipping info, payment (Stripe Elements), order confirmation
   - **Commission request** (`/commission/:handle`): Form for custom orders — description, budget, timeline, reference images (upload)

7. Implement cart state management:
   - Use Medusa's cart API
   - Cart persisted via Medusa session (cookie-based)
   - Cart icon with item count in header

8. Integrate Stripe payment:
   - Medusa handles Stripe integration server-side
   - Frontend uses Stripe Elements for card input
   - Configure Stripe API keys in environment variables

9. Create Dockerfile for storefront (multi-stage, same pattern as dashboard)

#### Medusa Configuration
10. Set up product categories: Games, Puppets, Guitars, Leather Craft
11. Configure shipping zones (UK, international)
12. Set up Stripe payment provider
13. Create a commission product type with custom metadata fields

#### Integration
14. Add "Commission this" links in Ghost portfolio posts → deep link to shop commission pages
15. Add shop to Red Panda Den dashboard service links
16. Storefront shares the Red Panda Creations branding but with a shop-focused layout

#### Security
17. Enable Stripe Radar fraud detection in Stripe dashboard
18. Ensure all session cookies have `Secure`, `HttpOnly`, `SameSite=Strict` flags
19. Commission file uploads: validate image-only types (`.jpg`, `.png`, `.webp`), 5MB max, strip EXIF metadata, UUID filenames
20. Add honeypot hidden field to checkout and commission forms — reject if filled
21. Apply stricter Traefik rate limit on checkout completion endpoint
22. Create privacy policy page on storefront (GDPR requirement — covers data collection, storage, deletion rights)
23. Add cookie consent banner to storefront
24. Verify login/registration endpoints don't reveal whether an email exists (account enumeration protection)

### Acceptance Criteria
- [ ] Medusa server starts and connects to Postgres + Redis
- [ ] Storefront accessible at `shop.redpandacreations.co.uk` without auth
- [ ] Medusa admin accessible at `shop.redpandacreations.co.uk/app` behind Authelia
- [ ] Can create products with images, variants, and pricing in admin
- [ ] Storefront displays products with category filtering
- [ ] Cart functionality works (add, remove, update quantity)
- [ ] Stripe test payment completes successfully
- [ ] Commission form creates a draft order in Medusa
- [ ] Commission file uploads reject non-image files and oversized files
- [ ] Honeypot field rejects bot submissions
- [ ] Session cookies have correct security flags
- [ ] Privacy policy page exists and is linked from footer
- [ ] Cookie consent banner displays on first visit
- [ ] Mobile responsive storefront
- [ ] Ghost portfolio posts can link directly to shop products
- [ ] Dashboard shows shop in service links

---

## Phase 12: CI/CD Pipeline & Deploy Scripts

**Goal**: Push to main automatically builds, tests, and deploys to the Pi.

### Tasks
1. Create `Dockerfile` for dashboard frontend, dashboard API, and storefront with ARM64 support
2. Create `.github/workflows/deploy.yml`:
   ```yaml
   name: Deploy
   on:
     push:
       branches: [main]
   jobs:
     build-and-deploy:
       runs-on: ubuntu-latest
       steps:
         - checkout
         - Set up Docker Buildx
         - Login to ghcr.io
         - Build & push dashboard frontend image (arm64)
         - Build & push dashboard api image (arm64)
         - Build & push storefront image (arm64)
         - SSH into Pi (via Cloudflare Tunnel or direct)
         - Run deploy.sh
   ```
3. Create `scripts/deploy.sh`:
   - `docker compose pull` (fetch new images)
   - `docker compose up -d` (recreate only changed containers)
   - Sleep 15 seconds for services to start
   - Run `health-check.sh`
   - If any health checks fail: send Ntfy alert with failing service names
   - If all pass: send Ntfy success notification
   - No blue-green, no rollback automation — if something breaks, check logs and manually redeploy previous tag
4. Create `scripts/health-check.sh`:
   - Check each service endpoint returns 200
   - Returns exit code 0 if all healthy, 1 if any failed
   - Outputs which specific services failed
5. Set up GitHub Secrets:
   - `SSH_PRIVATE_KEY` — for Pi access
   - `SSH_HOST` — Pi's Cloudflare Tunnel hostname or direct IP
   - `GHCR_TOKEN` — Container registry access

### Acceptance Criteria
- [ ] Push to main triggers build workflow
- [ ] Docker images build for arm64 (dashboard frontend, API, storefront)
- [ ] Images push to ghcr.io successfully
- [ ] Deploy script SSH's into Pi and updates services
- [ ] Health check script correctly identifies healthy/unhealthy services
- [ ] Ntfy notifications sent on deploy success/failure
- [ ] Full pipeline: push → build → test → deploy takes < 15 minutes

---

## Phase 13: Backup Automation

**Goal**: Automated daily backups of database, Ghost content, and uploaded files.

### Tasks
1. Create `scripts/backup.sh`:
   - `pg_dump` the entire `life_platform` database AND the `medusa` database
   - Backup Ghost content volume (`ghost_content`)
   - Compress with gzip, name with timestamp
   - Copy uploaded files directory
   - Retain last 7 daily backups locally
   - (Optional) sync to remote storage via rclone (Backblaze B2 or Google Drive)
   - Send Ntfy notification on success/failure
2. Set up cron job on Pi: `0 3 * * * /path/to/backup.sh` (3am daily)
3. Create `scripts/restore.sh`:
   - Takes a backup file as argument
   - Restores databases from pg_dump
   - Restores Ghost content volume
   - Restores uploaded files
4. Document backup/restore process in README

### Acceptance Criteria
- [ ] Backup script runs without errors
- [ ] Both databases are dumped and restorable
- [ ] Ghost content is backed up
- [ ] Uploaded files are backed up
- [ ] Old backups are rotated (7-day retention)
- [ ] Cron job is scheduled
- [ ] Restore script successfully restores from backup
- [ ] Ntfy notification fires on backup completion

---

## General Notes for All Phases

- Run `npm run type-check` after every significant change — zero errors always
- Write tests as you build, not after — each route/component should have at least basic test coverage
- Commit frequently with conventional commit messages
- Test on mobile viewport regularly (the PWA experience is a primary use case)
- Monitor Pi resource usage after each phase — if RAM is tight, address before continuing
- Reference CLAUDE.md for all naming conventions, file structure, and architectural decisions
- Public-facing sites (Ghost, shop storefront) should be fast and SEO-friendly — test with Lighthouse
- The storefront (`apps/storefront`) shares the same tech stack and coding conventions as the dashboard — reference the same CLAUDE.md conventions for both
- Ghost and Medusa are added to docker-compose in Phase 2 but not fully configured until Phases 9-10 — they'll start but won't be functional until their respective phases
