import { Router } from 'express'

export const healthRouter = Router()

type HealthStatus = 'healthy' | 'degraded' | 'unknown'

interface ServiceDefinition {
  name: string
  url: string
}

function buildServiceList(): ServiceDefinition[] {
  const base = process.env.BASE_DOMAIN ?? 'redpandacreations.co.uk'

  return [
    { name: 'Mealie', url: `https://meals.${base}` },
    { name: 'Actual Budget', url: `https://money.${base}` },
    { name: 'Vikunja', url: `https://tasks.${base}` },
    { name: 'Wiki.js', url: `https://wiki.${base}` },
    { name: 'Ntfy', url: `https://ntfy.${base}` },
    { name: 'Jellyfin', url: `https://jellyfin.${base}` },
    { name: 'Sonarr', url: `https://sonarr.${base}` },
    { name: 'Radarr', url: `https://radarr.${base}` },
    { name: 'Prowlarr', url: `https://prowlarr.${base}` },
    { name: 'Uptime Kuma', url: `https://status.${base}` },
    { name: 'Dozzle', url: `https://logs.${base}` },
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
