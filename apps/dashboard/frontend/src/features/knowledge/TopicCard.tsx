import { Card, Text, Badge, Progress, Group, Stack, ActionIcon } from '@mantine/core'
import { Trash2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useDeleteTopic } from './useKnowledge'
import type { Topic, TopicStatus } from './knowledge.types'

const STATUS_COLOURS: Record<TopicStatus, string> = {
  not_started: 'gray',
  in_progress: 'blue',
  completed: 'green',
  revisiting: 'orange',
}

const STATUS_LABELS: Record<TopicStatus, string> = {
  not_started: 'Not started',
  in_progress: 'In progress',
  completed: 'Completed',
  revisiting: 'Revisiting',
}

interface Props {
  topic: Topic
}

export function TopicCard({ topic }: Props) {
  const navigate = useNavigate()
  const deleteTopic = useDeleteTopic()

  function handleDelete(e: React.MouseEvent) {
    e.stopPropagation()
    if (confirm(`Delete "${topic.title}"?`)) {
      void deleteTopic.mutateAsync(topic.id)
    }
  }

  return (
    <Card
      withBorder
      radius="md"
      style={{ cursor: 'pointer' }}
      onClick={() => navigate(`/knowledge/${topic.id}`)}
    >
      <Stack gap="xs">
        <Group justify="space-between" wrap="nowrap">
          <Text fw={500} lineClamp={2} style={{ flex: 1 }}>
            {topic.title}
          </Text>
          <ActionIcon
            variant="subtle"
            color="red"
            size="sm"
            onClick={handleDelete}
            loading={deleteTopic.isPending}
            aria-label="Delete topic"
          >
            <Trash2 size={14} />
          </ActionIcon>
        </Group>

        <Group gap="xs">
          <Badge size="xs" variant="light" color="red-panda">
            {topic.category}
          </Badge>
          <Badge size="xs" color={STATUS_COLOURS[topic.status]}>
            {STATUS_LABELS[topic.status]}
          </Badge>
        </Group>

        {topic.description && (
          <Text size="xs" c="dimmed" lineClamp={2}>
            {topic.description}
          </Text>
        )}

        <Stack gap={4}>
          <Group justify="space-between">
            <Text size="xs" c="dimmed">
              Progress
            </Text>
            <Text size="xs" c="dimmed" ff="monospace">
              {topic.progress}%
            </Text>
          </Group>
          <Progress
            value={topic.progress}
            color={topic.progress === 100 ? 'green' : 'red-panda'}
            size="xs"
            radius="xl"
          />
        </Stack>
      </Stack>
    </Card>
  )
}
