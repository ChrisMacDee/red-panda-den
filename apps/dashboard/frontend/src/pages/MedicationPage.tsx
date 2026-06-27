import { useState } from 'react'
import {
  Stack,
  Title,
  Group,
  Button,
  TextInput,
  Select,
  SimpleGrid,
  Text,
  Center,
  Switch,
  Alert,
  Skeleton,
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { Plus, Search, Pill, AlertTriangle } from 'lucide-react'
import { useMedications, useMedicationAlerts } from '../features/medication/useMedication'
import { AddMedicationModal } from '../features/medication/AddMedicationModal'
import { MedicationCard } from '../features/medication/MedicationCard'

export function MedicationPage() {
  const [search, setSearch] = useState('')
  const [person, setPerson] = useState('')
  const [includeInactive, setIncludeInactive] = useState(false)
  const [addOpen, { open: openAdd, close: closeAdd }] = useDisclosure(false)

  const { data: medications, isLoading } = useMedications(includeInactive)
  const { data: alerts } = useMedicationAlerts()

  const people = medications
    ? [...new Set(medications.map((m) => m.person))].sort()
    : []

  const filtered = medications?.filter((m) => {
    if (person && m.person !== person) return false
    if (search && !m.name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const alertCount = alerts?.length ?? 0

  return (
    <>
      <Stack gap="lg">
        <Group justify="space-between" align="center">
          <Title order={2}>Medication Tracker</Title>
          <Button leftSection={<Plus size={16} />} onClick={openAdd}>
            Add medication
          </Button>
        </Group>

        {alertCount > 0 && (
          <Alert
            icon={<AlertTriangle size={16} />}
            color="orange"
            variant="light"
            title={`${alertCount} medication${alertCount === 1 ? '' : 's'} need${alertCount === 1 ? 's' : ''} attention`}
          >
            {alerts!.map((m) => m.name).join(', ')}
          </Alert>
        )}

        <Stack gap="sm">
          <Group gap="sm">
            <TextInput
              placeholder="Search medications..."
              leftSection={<Search size={14} />}
              value={search}
              onChange={(e) => setSearch(e.currentTarget.value)}
              style={{ flex: 1 }}
            />
            <Select
              placeholder="All people"
              data={people}
              value={person}
              onChange={(v) => setPerson(v ?? '')}
              clearable
              w={160}
            />
          </Group>
          <Switch
            label="Show inactive"
            checked={includeInactive}
            onChange={(e) => setIncludeInactive(e.currentTarget.checked)}
            size="sm"
          />
        </Stack>

        {isLoading ? (
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="sm">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} height={130} radius="md" />
            ))}
          </SimpleGrid>
        ) : filtered?.length === 0 ? (
          <Center h="40vh">
            <Stack align="center" gap="md">
              <Pill size={48} style={{ color: 'var(--mantine-color-dimmed)' }} />
              <Text c="dimmed">
                {search || person
                  ? 'No medications match your filters.'
                  : 'Nothing here yet. Add your first medication to get started.'}
              </Text>
              {!search && !person && (
                <Button leftSection={<Plus size={16} />} onClick={openAdd}>
                  Add medication
                </Button>
              )}
            </Stack>
          </Center>
        ) : (
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="sm">
            {filtered?.map((med) => <MedicationCard key={med.id} medication={med} />)}
          </SimpleGrid>
        )}
      </Stack>

      <AddMedicationModal opened={addOpen} onClose={closeAdd} />
    </>
  )
}
