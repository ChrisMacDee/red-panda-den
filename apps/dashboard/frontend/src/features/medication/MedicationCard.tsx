import { Card, Text, Badge, Group, Stack, ActionIcon, Progress } from '@mantine/core'
import { Trash2, AlertTriangle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useDeactivateMedication } from './useMedication'
import { stockStatus, daysRemainingLabel } from './medication.types'
import type { MedicationWithStock } from './medication.types'

const STATUS_COLOURS = { ok: 'green', low: 'orange', critical: 'red' } as const
const STATUS_LABELS = { ok: 'OK', low: 'Low', critical: 'Critical' } as const

interface Props {
  medication: MedicationWithStock
}

export function MedicationCard({ medication: med }: Props) {
  const navigate = useNavigate()
  const deactivate = useDeactivateMedication()

  const quantity = med.stock?.quantity ?? 0
  const threshold = med.stock?.reorderThreshold ?? 14
  const status = med.stock ? stockStatus(quantity, med.dosesPerDay, threshold) : 'ok'
  const daysLabel = med.stock ? daysRemainingLabel(quantity, med.dosesPerDay) : null

  function handleDeactivate(e: React.MouseEvent) {
    e.stopPropagation()
    if (confirm(`Deactivate "${med.name}"? It will be hidden but not deleted.`)) {
      void deactivate.mutateAsync(med.id)
    }
  }

  return (
    <Card
      withBorder
      radius="md"
      style={{ cursor: 'pointer' }}
      onClick={() => navigate(`/medication/${med.id}`)}
    >
      <Stack gap="xs">
        <Group justify="space-between" wrap="nowrap">
          <Stack gap={2} style={{ flex: 1, minWidth: 0 }}>
            <Text fw={500} lineClamp={1}>
              {med.name}
            </Text>
            <Text size="xs" c="dimmed">
              {med.dosage} · {med.frequency}
            </Text>
          </Stack>
          <ActionIcon
            variant="subtle"
            color="red"
            size="sm"
            onClick={handleDeactivate}
            loading={deactivate.isPending}
            aria-label="Deactivate medication"
          >
            <Trash2 size={14} />
          </ActionIcon>
        </Group>

        <Group gap="xs">
          <Badge size="xs" variant="light" color="red-panda">
            {med.person}
          </Badge>
          {med.stock && (
            <Badge size="xs" color={STATUS_COLOURS[status]} variant="light">
              {status === 'critical' && <AlertTriangle size={10} style={{ marginRight: 2 }} />}
              {STATUS_LABELS[status]}
            </Badge>
          )}
        </Group>

        {med.stock && (
          <Stack gap={4}>
            <Group justify="space-between">
              <Text size="xs" c="dimmed">
                {quantity} {med.stock.unit}
              </Text>
              <Text
                size="xs"
                ff="monospace"
                c={status === 'critical' ? 'red' : status === 'low' ? 'orange' : 'dimmed'}
              >
                {daysLabel}
              </Text>
            </Group>
            <Progress
              value={Math.min(100, (quantity / Math.max(1, threshold * med.dosesPerDay)) * 100)}
              color={STATUS_COLOURS[status]}
              size="xs"
              radius="xl"
            />
          </Stack>
        )}
      </Stack>
    </Card>
  )
}
