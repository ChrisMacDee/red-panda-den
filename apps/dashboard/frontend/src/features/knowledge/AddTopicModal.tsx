import { Modal, TextInput, Textarea, Select, Button, Stack, Group } from '@mantine/core'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import { useCreateTopic } from './useKnowledge'
import type { TopicStatus } from './knowledge.types'

interface Props {
  opened: boolean
  onClose: () => void
}

const STATUS_OPTIONS: { value: TopicStatus; label: string }[] = [
  { value: 'not_started', label: 'Not started' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'revisiting', label: 'Revisiting' },
]

const CATEGORY_SUGGESTIONS = [
  'Programming',
  'DevOps',
  'Security',
  'Design',
  'Mathematics',
  'Science',
  'Language',
  'Career',
  'Other',
]

export function AddTopicModal({ opened, onClose }: Props) {
  const createTopic = useCreateTopic()

  const form = useForm({
    initialValues: {
      title: '',
      description: '',
      category: '',
      status: 'not_started' as TopicStatus,
    },
    validate: {
      title: (v) => (v.trim() ? null : 'Title is required'),
      category: (v) => (v.trim() ? null : 'Category is required'),
    },
  })

  function handleClose() {
    form.reset()
    onClose()
  }

  async function handleSubmit(values: typeof form.values) {
    try {
      await createTopic.mutateAsync({
        title: values.title.trim(),
        description: values.description.trim() || undefined,
        category: values.category.trim(),
        status: values.status,
      })
      notifications.show({ message: 'Topic created', color: 'green' })
      handleClose()
    } catch {
      notifications.show({ message: 'Failed to create topic', color: 'red' })
    }
  }

  return (
    <Modal opened={opened} onClose={handleClose} title="Add topic" size="md">
      <form onSubmit={form.onSubmit((v) => void handleSubmit(v))}>
        <Stack gap="sm">
          <TextInput
            label="Title"
            placeholder="e.g. TypeScript generics"
            required
            {...form.getInputProps('title')}
          />
          <Textarea
            label="Description"
            placeholder="What is this topic about?"
            autosize
            minRows={2}
            maxRows={4}
            {...form.getInputProps('description')}
          />
          <Select
            label="Category"
            placeholder="Select or type a category"
            data={CATEGORY_SUGGESTIONS}
            searchable
            creatable
            required
            {...form.getInputProps('category')}
          />
          <Select
            label="Status"
            data={STATUS_OPTIONS}
            {...form.getInputProps('status')}
          />
          <Group justify="flex-end" mt="xs">
            <Button variant="subtle" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" loading={createTopic.isPending}>
              Add topic
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  )
}
