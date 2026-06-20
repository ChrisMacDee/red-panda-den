import { Card, Title, Text, Group, Stack, Badge, Progress, Anchor, Skeleton } from '@mantine/core'
import { BookOpen } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useKnowledgeStats } from './useKnowledge'

export function KnowledgeSummaryCard() {
  const { data: stats, isLoading } = useKnowledgeStats()

  const completionPct = stats?.total
    ? Math.round((stats.completed / stats.total) * 100)
    : 0

  return (
    <Card withBorder radius="md">
      <Stack gap="sm">
        <Group justify="space-between" align="center">
          <Group gap="xs">
            <BookOpen size={16} style={{ color: 'var(--mantine-color-red-panda-5)' }} />
            <Title order={5}>Knowledge Base</Title>
          </Group>
          <Anchor component={Link} to="/knowledge" size="xs" c="dimmed">
            View all
          </Anchor>
        </Group>

        {isLoading ? (
          <Stack gap="xs">
            <Skeleton height={12} width="60%" />
            <Skeleton height={8} />
            <Skeleton height={40} />
          </Stack>
        ) : stats?.total === 0 ? (
          <Text size="sm" c="dimmed">
            No topics yet. Start learning something new.
          </Text>
        ) : (
          <>
            <Group gap="sm">
              <Badge color="blue" variant="light" size="sm">
                {stats?.inProgress ?? 0} in progress
              </Badge>
              <Badge color="green" variant="light" size="sm">
                {stats?.completed ?? 0} completed
              </Badge>
              <Text size="xs" c="dimmed">
                of {stats?.total ?? 0} total
              </Text>
            </Group>

            <Stack gap={4}>
              <Group justify="space-between">
                <Text size="xs" c="dimmed">
                  Overall completion
                </Text>
                <Text size="xs" c="dimmed" ff="monospace">
                  {completionPct}%
                </Text>
              </Group>
              <Progress value={completionPct} color="green" size="sm" radius="xl" />
            </Stack>

            {stats?.recentlyUpdated && stats.recentlyUpdated.length > 0 && (
              <Stack gap={4}>
                <Text size="xs" c="dimmed" tt="uppercase" style={{ letterSpacing: '0.05em' }}>
                  Recently updated
                </Text>
                {stats.recentlyUpdated.map((t) => (
                  <Anchor
                    key={t.id}
                    component={Link}
                    to={`/knowledge/${t.id}`}
                    size="sm"
                    c="inherit"
                    style={{ textDecoration: 'none' }}
                  >
                    <Text size="sm" lineClamp={1}>
                      {t.title}
                    </Text>
                  </Anchor>
                ))}
              </Stack>
            )}
          </>
        )}
      </Stack>
    </Card>
  )
}
