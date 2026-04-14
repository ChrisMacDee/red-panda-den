import { Stack, Title, Text, Center } from '@mantine/core'
import { BookOpen } from 'lucide-react'

export function KnowledgePage() {
  return (
    <Center h="60vh">
      <Stack align="center" gap="md">
        <BookOpen size={48} style={{ color: 'var(--mantine-color-dimmed)' }} />
        <Title order={2}>Knowledge Base</Title>
        <Text c="dimmed">Coming in Phase 5</Text>
      </Stack>
    </Center>
  )
}
