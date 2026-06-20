import { Stack, SimpleGrid } from '@mantine/core'
import { ServiceGrid } from '../features/services/ServiceGrid'
import { KnowledgeSummaryCard } from '../features/knowledge/KnowledgeSummaryCard'

export function DashboardPage() {
  return (
    <Stack gap="xl">
      <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="sm">
        <KnowledgeSummaryCard />
      </SimpleGrid>
      <ServiceGrid />
    </Stack>
  )
}
