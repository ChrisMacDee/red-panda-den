import { Stack, Title, SimpleGrid } from '@mantine/core'
import { SERVICES } from './services.config'
import { ServiceCard } from './ServiceCard'
import { useServiceHealth } from './useServiceHealth'
import { FavouritesSection } from '../favourites/FavouritesSection'
import type { ServiceConfig } from './services.config'

const CATEGORY_ORDER: ServiceConfig['category'][] = [
  'den',
  'kitchen-tasks',
  'media',
  'ops',
  'public',
]

const CATEGORY_LABELS: Record<ServiceConfig['category'], string> = {
  den: 'Den',
  'kitchen-tasks': 'Kitchen & Tasks',
  media: 'Media Den',
  ops: 'Ops',
  public: 'Public',
}

export function ServiceGrid() {
  const { data: healthMap } = useServiceHealth()

  return (
    <Stack gap="xl">
      {CATEGORY_ORDER.map((category) => {
        const services = SERVICES.filter((s) => s.category === category)
        if (services.length === 0) return null

        return (
          <Stack key={category} gap="sm">
            <Title order={3} size="h5" c="dimmed" tt="uppercase" style={{ letterSpacing: '0.05em' }}>
              {CATEGORY_LABELS[category]}
            </Title>
            <SimpleGrid
              cols={{ base: 2, sm: 3, lg: 4 }}
              spacing="sm"
            >
              {services.map((service) => (
                <ServiceCard
                  key={service.name}
                  service={service}
                  healthStatus={healthMap?.[service.name]}
                />
              ))}
            </SimpleGrid>
          </Stack>
        )
      })}

      <FavouritesSection />
    </Stack>
  )
}
