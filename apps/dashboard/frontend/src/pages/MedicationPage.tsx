import { Stack, Title, Text, Center } from '@mantine/core'
import { Pill } from 'lucide-react'

export function MedicationPage() {
  return (
    <Center h="60vh">
      <Stack align="center" gap="md">
        <Pill size={48} style={{ color: 'var(--mantine-color-dimmed)' }} />
        <Title order={2}>Medication Tracker</Title>
        <Text c="dimmed">Coming in Phase 6</Text>
      </Stack>
    </Center>
  )
}
