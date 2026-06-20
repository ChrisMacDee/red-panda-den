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
  SegmentedControl,
  Skeleton,
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { Plus, Search, BookOpen } from 'lucide-react'
import { useTopics } from '../features/knowledge/useKnowledge'
import { AddTopicModal } from '../features/knowledge/AddTopicModal'
import { TopicCard } from '../features/knowledge/TopicCard'
import type { TopicStatus } from '../features/knowledge/knowledge.types'

const STATUS_FILTER_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'not_started', label: 'Not started' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'revisiting', label: 'Revisiting' },
]

export function KnowledgePage() {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<TopicStatus | ''>('')
  const [category, setCategory] = useState('')
  const [addOpen, { open: openAdd, close: closeAdd }] = useDisclosure(false)

  const { data: topics, isLoading } = useTopics({
    status: status || undefined,
    category: category || undefined,
    search: search || undefined,
  })

  const categories = topics
    ? [...new Set(topics.map((t) => t.category))].sort()
    : []

  return (
    <>
      <Stack gap="lg">
        <Group justify="space-between" align="center">
          <Title order={2}>Knowledge Base</Title>
          <Button leftSection={<Plus size={16} />} onClick={openAdd}>
            Add topic
          </Button>
        </Group>

        <Stack gap="sm">
          <Group gap="sm">
            <TextInput
              placeholder="Search topics..."
              leftSection={<Search size={14} />}
              value={search}
              onChange={(e) => setSearch(e.currentTarget.value)}
              style={{ flex: 1 }}
            />
            <Select
              placeholder="All categories"
              data={categories}
              value={category}
              onChange={(v) => setCategory(v ?? '')}
              clearable
              w={180}
            />
          </Group>

          <SegmentedControl
            value={status}
            onChange={(v) => setStatus(v as TopicStatus | '')}
            data={STATUS_FILTER_OPTIONS}
            size="xs"
          />
        </Stack>

        {isLoading ? (
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="sm">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} height={140} radius="md" />
            ))}
          </SimpleGrid>
        ) : topics?.length === 0 ? (
          <Center h="40vh">
            <Stack align="center" gap="md">
              <BookOpen size={48} style={{ color: 'var(--mantine-color-dimmed)' }} />
              <Text c="dimmed">
                {search || status || category
                  ? 'No topics match your filters.'
                  : 'Nothing here yet. Add your first topic to start learning.'}
              </Text>
              {!search && !status && !category && (
                <Button leftSection={<Plus size={16} />} onClick={openAdd}>
                  Add topic
                </Button>
              )}
            </Stack>
          </Center>
        ) : (
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="sm">
            {topics?.map((topic) => <TopicCard key={topic.id} topic={topic} />)}
          </SimpleGrid>
        )}
      </Stack>

      <AddTopicModal opened={addOpen} onClose={closeAdd} />
    </>
  )
}
