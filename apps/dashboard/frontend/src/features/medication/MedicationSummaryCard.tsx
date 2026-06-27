import { Card, Title, Text, Group, Stack, Badge, Anchor, Skeleton } from '@mantine/core'
import { Pill, AlertTriangle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useMedicationAlerts } from './useMedication'
import { stockStatus } from './medication.types'

export function MedicationSummaryCard() {
  const { data: alerts, isLoading } = useMedicationAlerts()

  const criticalCount = alerts?.filter(
    (m) => m.stock && stockStatus(m.stock.quantity, m.dosesPerDay, m.stock.reorderThreshold) === 'critical',
  ).length ?? 0

  const lowCount = alerts?.filter(
    (m) => m.stock && stockStatus(m.stock.quantity, m.dosesPerDay, m.stock.reorderThreshold) === 'low',
  ).length ?? 0

  return (
    <Card withBorder radius="md">
      <Stack gap="sm">
        <Group justify="space-between" align="center">
          <Group gap="xs">
            <Pill size={16} style={{ color: 'var(--mantine-color-red-panda-5)' }} />
            <Title order={5}>Medication</Title>
          </Group>
          <Anchor component={Link} to="/medication" size="xs" c="dimmed">
            View all
          </Anchor>
        </Group>

        {isLoading ? (
          <Stack gap="xs">
            <Skeleton height={12} width="50%" />
            <Skeleton height={40} />
          </Stack>
        ) : !alerts || alerts.length === 0 ? (
          <Text size="sm" c="dimmed">
            All medications are stocked.
          </Text>
        ) : (
          <>
            <Group gap="sm">
              {criticalCount > 0 && (
                <Badge color="red" variant="light" size="sm" leftSection={<AlertTriangle size={10} />}>
                  {criticalCount} critical
                </Badge>
              )}
              {lowCount > 0 && (
                <Badge color="orange" variant="light" size="sm">
                  {lowCount} low
                </Badge>
              )}
            </Group>

            <Stack gap={4}>
              {alerts.slice(0, 4).map((m) => {
                const status = m.stock
                  ? stockStatus(m.stock.quantity, m.dosesPerDay, m.stock.reorderThreshold)
                  : 'ok'
                return (
                  <Anchor
                    key={m.id}
                    component={Link}
                    to={`/medication/${m.id}`}
                    size="sm"
                    c="inherit"
                    style={{ textDecoration: 'none' }}
                  >
                    <Group justify="space-between" gap="xs">
                      <Text size="sm" lineClamp={1} style={{ flex: 1 }}>
                        {m.name}
                      </Text>
                      <Text
                        size="xs"
                        ff="monospace"
                        c={status === 'critical' ? 'red' : 'orange'}
                      >
                        {m.stock ? `${m.stock.quantity} left` : '—'}
                      </Text>
                    </Group>
                  </Anchor>
                )
              })}
              {alerts.length > 4 && (
                <Text size="xs" c="dimmed">
                  +{alerts.length - 4} more
                </Text>
              )}
            </Stack>
          </>
        )}
      </Stack>
    </Card>
  )
}
