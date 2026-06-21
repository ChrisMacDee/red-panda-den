import { Router } from 'express'

export const healthRouter = Router()

type HealthStatus = 'healthy' | 'degraded' | 'unknown'

interface ServiceDefinition {
  name: string
  url: string
}

function buildServiceList(): ServiceDefinition[] {
  const base = process.env.BASE_DOMAIN ?? 'redpandacreations.co.uk'
  // YAMS services run on the host; probe via host.docker.internal for a fast
  // local check rather than round-tripping through Cloudflare.
  const yams = process.env.YAMS_HOST ?? 'host.docker.internal'

  return [
    { name: 'Mealie', url: `https://meals.${base}` },
    { name: 'Actual Budget', url: `https://money.${base}` },
    { name: 'Vikunja', url: `https://tasks.${base}` },
    { name: 'Wiki.js', url: `https://wiki.${base}` },
    { name: 'Ntfy', url: `https://ntfy.${base}` },
    { name: 'Uptime Kuma', url: `https://status.${base}` },
    { name: 'Dozzle', url: `https://logs.${base}` },
    // YAMS media stack — probed directly on local ports
    { name: 'Jellyfin', url: `http://${yams}:8096` },
    { name: 'Sonarr', url: `http://${yams}:8989` },
    { name: 'Radarr', url: `http://${yams}:7878` },
    { name: 'Prowlarr', url: `http://${yams}:9696` },
    { name: 'Jellyseerr', url: `http://${yams}:5055` },
    { name: 'qBittorrent', url: `http://${yams}:8080` },
  ]
}

async function checkService(service: ServiceDefinition): Promise<[string, HealthStatus]> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 3000)

  try {
    const response = await fetch(service.url, {
      signal: controller.signal,
      method: 'GET',
    })
    const status: HealthStatus = response.ok ? 'healthy' : 'degraded'
    return [service.name, status]
  } catch {
    return [service.name, 'unknown']
  } finally {
    clearTimeout(timeout)
  }
}

// GET /
healthRouter.get('/', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// GET /services
healthRouter.get('/services', async (_req, res) => {
  const services = buildServiceList()

  const results = await Promise.allSettled(services.map(checkService))

  const healthMap: Record<string, HealthStatus> = {}

  for (const result of results) {
    if (result.status === 'fulfilled') {
      const [name, status] = result.value
      healthMap[name] = status
    }
  }

  res.json({ data: healthMap })
})
