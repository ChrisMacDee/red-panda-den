import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Stack,
  Title,
  Text,
  Badge,
  Group,
  Button,
  Card,
  NumberInput,
  Select,
  TextInput,
  Textarea,
  Skeleton,
  Divider,
  Center,
  Paper,
  SimpleGrid,
} from '@mantine/core'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import { ArrowLeft, Plus, Minus, RefreshCw, Settings, AlertTriangle } from 'lucide-react'
import {
  useMedicationDetail,
  useUpdateStockSettings,
  useLogAction,
} from '../features/medication/useMedication'
import { stockStatus, daysRemainingLabel } from '../features/medication/medication.types'
import type { MedicationAction } from '../features/medication/medication.types'

const ACTION_OPTIONS: { value: MedicationAction; label: string }[] = [
  { value: 'taken', label: 'Taken' },
  { value: 'restocked', label: 'Restocked' },
  { value: 'disposed', label: 'Disposed' },
  { value: 'adjusted', label: 'Adjusted' },
]

const ACTION_COLOURS: Record<MedicationAction, string> = {
  taken: 'blue',
  restocked: 'green',
  disposed: 'orange',
  adjusted: 'gray',
}

const STATUS_COLOURS = { ok: 'green', low: 'orange', critical: 'red' } as const

export function MedicationDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: med, isLoading } = useMedicationDetail(id ?? '')
  const updateStock = useUpdateStockSettings()
  const logAction = useLogAction()

  const [showStockSettings, setShowStockSettings] = useState(false)

  const logForm = useForm({
    initialValues: {
      action: 'taken' as MedicationAction,
      quantityDelta: 1,
      notes: '',
    },
    validate: {
      quantityDelta: (v) => (v !== 0 ? null : 'Quantity cannot be zero'),
    },
  })

  const stockForm = useForm({
    initialValues: {
      unit: '',
      reorderThreshold: 14,
    },
  })

  if (!id) return null

  if (isLoading) {
    return (
      <Stack gap="lg">
        <Skeleton height={32} width={200} />
        <Skeleton height={24} width="50%" />
        <Skeleton height={120} />
        <Skeleton height={200} />
      </Stack>
    )
  }

  if (!med) {
    return (
      <Center h="40vh">
        <Stack align="center" gap="md">
          <Text c="dimmed">Medication not found.</Text>
          <Button
            variant="subtle"
            leftSection={<ArrowLeft size={14} />}
            onClick={() => navigate('/medication')}
          >
            Back to Medication Tracker
          </Button>
        </Stack>
      </Center>
    )
  }

  const quantity = med.stock?.quantity ?? 0
  const threshold = med.stock?.reorderThreshold ?? 14
  const status = med.stock ? stockStatus(quantity, med.dosesPerDay, threshold) : 'ok'
  const daysLabel = med.stock ? daysRemainingLabel(quantity, med.dosesPerDay) : '—'

  async function handleLog(values: typeof logForm.values) {
    const delta =
      values.action === 'taken' || values.action === 'disposed'
        ? -Math.abs(values.quantityDelta)
        : Math.abs(values.quantityDelta)
    try {
      const result = await logAction.mutateAsync({
        id: med!.id,
        action: values.action,
        quantityDelta: delta,
        notes: values.notes.trim() || undefined,
      })
      notifications.show({
        message: `Recorded. New quantity: ${result.newQuantity} ${med!.stock?.unit ?? ''}`,
        color: 'green',
      })
      logForm.reset()
    } catch {
      notifications.show({ message: 'Failed to record action', color: 'red' })
    }
  }

  async function handleSaveStockSettings(values: typeof stockForm.values) {
    try {
      await updateStock.mutateAsync({
        id: med!.id,
        unit: values.unit.trim() || undefined,
        reorderThreshold: values.reorderThreshold,
      })
      notifications.show({ message: 'Stock settings updated', color: 'green' })
      setShowStockSettings(false)
    } catch {
      notifications.show({ message: 'Failed to update settings', color: 'red' })
    }
  }

  function openStockSettings() {
    stockForm.setValues({
      unit: med!.stock?.unit ?? 'tablets',
      reorderThreshold: med!.stock?.reorderThreshold ?? 14,
    })
    setShowStockSettings(true)
  }

  return (
    <Stack gap="lg">
      {/* Header */}
      <Stack gap="xs">
        <Button
          variant="subtle"
          size="xs"
          leftSection={<ArrowLeft size={14} />}
          onClick={() => navigate('/medication')}
          w="fit-content"
          px={0}
        >
          Medication Tracker
        </Button>

        <Group justify="space-between" align="flex-start" wrap="nowrap">
          <Stack gap={4} style={{ flex: 1 }}>
            <Title order={2}>{med.name}</Title>
            <Text c="dimmed">
              {med.dosage} · {med.frequency}
            </Text>
          </Stack>
        </Group>

        <Group gap="xs">
          <Badge color="red-panda" variant="light">
            {med.person}
          </Badge>
          {!med.active && (
            <Badge color="gray" variant="light">
              Inactive
            </Badge>
          )}
          {med.prescriber && (
            <Badge color="blue" variant="light">
              Rx: {med.prescriber}
            </Badge>
          )}
          {med.pharmacy && (
            <Badge color="teal" variant="light">
              {med.pharmacy}
            </Badge>
          )}
        </Group>

        {med.notes && (
          <Text size="sm" c="dimmed">
            {med.notes}
          </Text>
        )}
      </Stack>

      <Divider />

      {/* Stock overview */}
      <Card withBorder radius="md">
        <Stack gap="sm">
          <Group justify="space-between" align="center">
            <Text fw={500}>Current Stock</Text>
            <Button
              size="xs"
              variant="subtle"
              leftSection={<Settings size={14} />}
              onClick={openStockSettings}
            >
              Settings
            </Button>
          </Group>

          {med.stock && (
            <SimpleGrid cols={3} spacing="sm">
              <Stack gap={2} align="center">
                <Text ff="monospace" fw={700} size="xl" c={STATUS_COLOURS[status]}>
                  {quantity}
                </Text>
                <Text size="xs" c="dimmed">
                  {med.stock.unit}
                </Text>
              </Stack>
              <Stack gap={2} align="center">
                <Text
                  ff="monospace"
                  fw={700}
                  size="xl"
                  c={status === 'critical' ? 'red' : status === 'low' ? 'orange' : 'inherit'}
                >
                  {daysLabel}
                </Text>
                <Text size="xs" c="dimmed">
                  at {med.dosesPerDay}/day
                </Text>
              </Stack>
              <Stack gap={2} align="center">
                <Badge size="lg" color={STATUS_COLOURS[status]} variant="light">
                  {status === 'critical' && <AlertTriangle size={12} style={{ marginRight: 4 }} />}
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </Badge>
                <Text size="xs" c="dimmed">
                  reorder at {threshold} days
                </Text>
              </Stack>
            </SimpleGrid>
          )}

          {showStockSettings && (
            <form onSubmit={stockForm.onSubmit((v) => void handleSaveStockSettings(v))}>
              <Card withBorder radius="md" p="sm" mt="xs">
                <Stack gap="sm">
                  <SimpleGrid cols={2} spacing="sm">
                    <TextInput
                      label="Unit"
                      placeholder="tablets"
                      {...stockForm.getInputProps('unit')}
                    />
                    <NumberInput
                      label="Reorder threshold (days)"
                      min={1}
                      {...stockForm.getInputProps('reorderThreshold')}
                    />
                  </SimpleGrid>
                  <Group justify="flex-end" gap="xs">
                    <Button size="xs" variant="subtle" onClick={() => setShowStockSettings(false)}>
                      Cancel
                    </Button>
                    <Button size="xs" type="submit" loading={updateStock.isPending}>
                      Save
                    </Button>
                  </Group>
                </Stack>
              </Card>
            </form>
          )}
        </Stack>
      </Card>

      {/* Log action */}
      <Card withBorder radius="md">
        <Stack gap="sm">
          <Text fw={500}>Log action</Text>
          <form onSubmit={logForm.onSubmit((v) => void handleLog(v))}>
            <Stack gap="sm">
              <SimpleGrid cols={2} spacing="sm">
                <Select
                  label="Action"
                  data={ACTION_OPTIONS}
                  {...logForm.getInputProps('action')}
                />
                <NumberInput
                  label="Quantity"
                  description={
                    logForm.values.action === 'taken' || logForm.values.action === 'disposed'
                      ? 'Will be subtracted'
                      : 'Will be added'
                  }
                  min={1}
                  leftSection={
                    logForm.values.action === 'taken' || logForm.values.action === 'disposed' ? (
                      <Minus size={14} />
                    ) : (
                      <Plus size={14} />
                    )
                  }
                  {...logForm.getInputProps('quantityDelta')}
                />
              </SimpleGrid>
              <Textarea
                label="Notes"
                placeholder="Optional"
                autosize
                minRows={1}
                maxRows={3}
                {...logForm.getInputProps('notes')}
              />
              <Group justify="flex-end">
                <Button
                  type="submit"
                  leftSection={<RefreshCw size={14} />}
                  loading={logAction.isPending}
                >
                  Record
                </Button>
              </Group>
            </Stack>
          </form>
        </Stack>
      </Card>

      <Divider />

      {/* Recent log */}
      <Stack gap="sm">
        <Title order={4}>Recent log</Title>
        {med.recentLog.length === 0 ? (
          <Text size="sm" c="dimmed">
            No log entries yet.
          </Text>
        ) : (
          <Stack gap="xs">
            {med.recentLog.map((entry) => (
              <Paper key={entry.id} withBorder p="sm" radius="md">
                <Group justify="space-between" wrap="nowrap">
                  <Group gap="xs" wrap="nowrap">
                    <Badge size="sm" color={ACTION_COLOURS[entry.action]} variant="light">
                      {entry.action}
                    </Badge>
                    <Text size="sm" ff="monospace" c={entry.quantityDelta < 0 ? 'red' : 'green'}>
                      {entry.quantityDelta > 0 ? '+' : ''}
                      {entry.quantityDelta}
                    </Text>
                    {entry.notes && (
                      <Text size="sm" c="dimmed" lineClamp={1}>
                        {entry.notes}
                      </Text>
                    )}
                  </Group>
                  <Text size="xs" c="dimmed" style={{ whiteSpace: 'nowrap' }}>
                    {new Date(entry.occurredAt).toLocaleDateString()}
                  </Text>
                </Group>
              </Paper>
            ))}
          </Stack>
        )}
      </Stack>
    </Stack>
  )
}
