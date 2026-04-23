# Dashboard Frontend

React 18 SPA and PWA for Red Panda Den. Built with Mantine v7, Vite, TanStack Query, and React Router v6. Served on **port 3000**.

## Commands

```bash
npm run dev          # Vite dev server on http://localhost:3000
npm run build        # Type-check + production build → dist/
npm run preview      # Preview production build locally
npm run type-check   # tsc --noEmit (no emit, just type errors)
npm run lint         # ESLint (flat config, TypeScript + React rules)
npm run test         # Vitest (single run)
npm run test:watch   # Vitest (watch mode)
npm run test -- src/features/favourites   # Single file or directory
```

## Source Structure

```
src/
  main.tsx          # App entry point — MantineProvider, QueryClient, Router
  App.tsx           # Root layout (sidebar + bottom nav shell)
  router.tsx        # React Router v6 route definitions
  theme.ts          # Mantine theme — red-panda colour scale, typography
  api/              # Axios instance + typed API client functions
  components/       # Shared UI components (not feature-specific)
  features/         # Feature modules — co-located component/hook/types/tests
    favourites/     # Favourites widget (drag-to-reorder quick links)
    services/       # Service health grid (Den, Kitchen, Media, Favourites)
  pages/            # Route-level page components
    DashboardPage.tsx
    JobsPage.tsx / JobDetailPage.tsx
    KnowledgePage.tsx / KnowledgeDetailPage.tsx
    MedicationPage.tsx
```

## Architecture Notes

- **API calls** go through `src/api/` — a typed wrapper around Axios pointed at `/api` (proxied to port 3001 in dev via `vite.config.ts`)
- **Server state** is managed with TanStack Query; cache keys mirror the REST resource path (e.g. `['jobs']`, `['jobs', id]`)
- **Forms** use Mantine's `useForm` with Zod schemas for validation
- **Feature modules** follow the pattern: `FeaturePage.tsx` (route) → `useFeature.ts` (hook, all logic) → sub-components in the same directory
- **Colour scheme** defaults to dark (`#0C0C0C`), persisted in `localStorage` via `useMantineColorScheme`

## PWA

`vite-plugin-pwa` generates the service worker and manifest at build time. The service worker uses an **app shell** model — the UI is cached, data is always fetched live.

Config lives in `vite.config.ts` under `VitePWA(...)`. Icons (192×192 and 512×512) are generated from `public/logo.png`.

On iOS, add to Home Screen from Safari to install as a PWA. The status bar renders as `black-translucent` against the `#0C0C0C` background.

## Design System

Theme is defined in `src/theme.ts`. Key values:

| Token | Dark | Light |
|-------|------|-------|
| Background | `#0C0C0C` | `#FAFAFA` |
| Accent | `#C2162E` | `#B01830` |
| Text | `#F5F5F5` | `#1A1A1A` |
| Muted text | `#A0A0A0` | `#666666` |

Fonts loaded via Google Fonts in `index.html`: **Plus Jakarta Sans** (UI) and **JetBrains Mono** (data/numbers).

No Tailwind — Mantine only.

## Environment

The only env var needed for local dev is the API base URL, which Vite proxies automatically. For production, set:

```
VITE_API_BASE_URL=https://life.redpandacreations.co.uk/api
```
