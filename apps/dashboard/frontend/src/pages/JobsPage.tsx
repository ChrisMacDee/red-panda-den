import { Stack, Title, Text, Center } from '@mantine/core'
import { Briefcase } from 'lucide-react'

export function JobsPage() {
  return (
    <Center h="60vh">
      <Stack align="center" gap="md">
        <Briefcase size={48} style={{ color: 'var(--mantine-color-dimmed)' }} />
        <Title order={2}>Job Tracker</Title>
        <Text c="dimmed">Coming in Phase 4</Text>
      </Stack>
    </Center>
  )
}
