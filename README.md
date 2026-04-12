# Red Panda Den

## What This Is

**Red Panda Den** — a self-hosted life management platform running on a Raspberry Pi 5 (8GB). It combines custom-built modules (job tracker, knowledge base, medication tracker) with ready-made self-hosted apps (Mealie, Actual Budget, Vikunja), all behind a unified dashboard accessible as a PWA on iOS.

The platform also includes a public-facing **portfolio and blog** at the base domain (powered by Ghost) and a **shop** for commissions and products (powered by Medusa.js).

All subdomains of `redpandacreations.co.uk` route through Cloudflare Tunnel → Traefik → Authelia (SSO for private services)