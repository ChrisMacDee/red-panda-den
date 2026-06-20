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
  Slider,
  Select,
  TextInput,
  Textarea,
  ActionIcon,
  Anchor,
  FileInput,
  Skeleton,
  Divider,
  Center,
  Paper,
} from '@mantine/core'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import {
  ArrowLeft,
  Plus,
  Trash2,
  Check,
  ExternalLink,
  Globe,
  Play,
  BookOpen,
  FileText,
  Book,
  GraduationCap,
  Link as LinkIcon,
  Pencil,
  X,
} from 'lucide-react'
import {
  useTopic,
  useUpdateTopic,
  useUpdateProgress,
  useCreateResource,
  useUploadResource,
  useUpdateResource,
  useDeleteResource,
  useCreateNote,
  useUpdateNote,
  useDeleteNote,
} from '../features/knowledge/useKnowledge'
import type { TopicStatus, ResourceType } from '../features/knowledge/knowledge.types'

const STATUS_OPTIONS: { value: TopicStatus; label: string; color: string }[] = [
  { value: 'not_started', label: 'Not started', color: 'gray' },
  { value: 'in_progress', label: 'In progress', color: 'blue' },
  { value: 'completed', label: 'Completed', color: 'green' },
  { value: 'revisiting', label: 'Revisiting', color: 'orange' },
]

const RESOURCE_TYPE_OPTIONS: { value: ResourceType; label: string }[] = [
  { value: 'article', label: 'Article' },
  { value: 'course', label: 'Course' },
  { value: 'video', label: 'Video' },
  { value: 'book', label: 'Book' },
  { value: 'documentation', label: 'Documentation' },
  { value: 'wiki', label: 'Wiki' },
  { value: 'other', label: 'Other' },
]

function ResourceIcon({ type }: { type: ResourceType }) {
  const size = 14
  switch (type) {
    case 'course': return <GraduationCap size={size} />
    case 'video': return <Play size={size} />
    case 'article': return <FileText size={size} />
    case 'book': return <Book size={size} />
    case 'documentation': return <BookOpen size={size} />
    case 'wiki': return <Globe size={size} />
    default: return <LinkIcon size={size} />
  }
}

export function KnowledgeDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: topic, isLoading } = useTopic(id ?? '')

  const updateTopic = useUpdateTopic()
  const updateProgress = useUpdateProgress()
  const createResource = useCreateResource()
  const uploadResource = useUploadResource()
  const updateResource = useUpdateResource()
  const deleteResource = useDeleteResource()
  const createNote = useCreateNote()
  const updateNote = useUpdateNote()
  const deleteNote = useDeleteNote()

  // Progress slider local state (deferred update)
  const [localProgress, setLocalProgress] = useState<number | null>(null)

  // Resource form
  const [showResourceForm, setShowResourceForm] = useState(false)
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const resourceForm = useForm({
    initialValues: { title: '', url: '', resourceType: 'article' as ResourceType, notes: '' },
    validate: { title: (v) => (v.trim() ? null : 'Title is required') },
  })

  // Note form
  const [noteBody, setNoteBody] = useState('')

  // Edit note state
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null)
  const [editingNoteBody, setEditingNoteBody] = useState('')

  if (!id) return null

  if (isLoading) {
    return (
      <Stack gap="lg">
        <Skeleton height={32} width={200} />
        <Skeleton height={24} width="60%" />
        <Skeleton height={100} />
        <Skeleton height={200} />
      </Stack>
    )
  }

  if (!topic) {
    return (
      <Center h="40vh">
        <Stack align="center" gap="md">
          <Text c="dimmed">Topic not found.</Text>
          <Button variant="subtle" leftSection={<ArrowLeft size={14} />} onClick={() => navigate('/knowledge')}>
            Back to Knowledge Base
          </Button>
        </Stack>
      </Center>
    )
  }

  const statusOption = STATUS_OPTIONS.find((s) => s.value === topic.status)
  const displayProgress = localProgress ?? topic.progress

  async function handleStatusChange(newStatus: TopicStatus) {
    try {
      await updateTopic.mutateAsync({ id: topic!.id, status: newStatus })
    } catch {
      notifications.show({ message: 'Failed to update status', color: 'red' })
    }
  }

  async function handleProgressCommit(value: number) {
    setLocalProgress(null)
    try {
      await updateProgress.mutateAsync({ id: topic!.id, progress: value })
    } catch {
      notifications.show({ message: 'Failed to update progress', color: 'red' })
    }
  }

  async function handleAddResource(values: typeof resourceForm.values) {
    try {
      await createResource.mutateAsync({
        topicId: topic!.id,
        title: values.title.trim(),
        url: values.url.trim() || null,
        resourceType: values.resourceType,
        notes: values.notes.trim() || undefined,
      })
      resourceForm.reset()
      setShowResourceForm(false)
    } catch {
      notifications.show({ message: 'Failed to add resource', color: 'red' })
    }
  }

  async function handleUploadFile() {
    if (!uploadFile) return
    try {
      await uploadResource.mutateAsync({ topicId: topic!.id, file: uploadFile })
      setUploadFile(null)
      notifications.show({ message: 'File uploaded', color: 'green' })
    } catch {
      notifications.show({ message: 'Upload failed', color: 'red' })
    }
  }

  async function handleAddNote() {
    if (!noteBody.trim()) return
    try {
      await createNote.mutateAsync({ topicId: topic!.id, body: noteBody.trim() })
      setNoteBody('')
    } catch {
      notifications.show({ message: 'Failed to add note', color: 'red' })
    }
  }

  async function handleSaveNote(noteId: string) {
    if (!editingNoteBody.trim()) return
    try {
      await updateNote.mutateAsync({ topicId: topic!.id, noteId, body: editingNoteBody.trim() })
      setEditingNoteId(null)
    } catch {
      notifications.show({ message: 'Failed to update note', color: 'red' })
    }
  }

  function prefillWikiResource() {
    resourceForm.setValues({
      title: 'Wiki page',
      url: 'https://wiki.redpandacreations.co.uk/en/',
      resourceType: 'wiki',
      notes: '',
    })
    setShowResourceForm(true)
  }

  return (
    <Stack gap="lg">
      {/* Header */}
      <Stack gap="xs">
        <Button
          variant="subtle"
          size="xs"
          leftSection={<ArrowLeft size={14} />}
          onClick={() => navigate('/knowledge')}
          w="fit-content"
          px={0}
        >
          Knowledge Base
        </Button>

        <Group justify="space-between" align="flex-start" wrap="nowrap">
          <Stack gap={4} style={{ flex: 1 }}>
            <Title order={2}>{topic.title}</Title>
            {topic.description && <Text c="dimmed">{topic.description}</Text>}
          </Stack>
        </Group>

        <Group gap="xs">
          <Badge color="red-panda" variant="light">
            {topic.category}
          </Badge>
          <Badge color={statusOption?.color ?? 'gray'}>{statusOption?.label}</Badge>
        </Group>
      </Stack>

      <Divider />

      {/* Progress & Status */}
      <Card withBorder radius="md">
        <Stack gap="md">
          <Group justify="space-between" align="center">
            <Text fw={500}>Progress</Text>
            <Text ff="monospace" fw={600} size="lg" c="red-panda">
              {displayProgress}%
            </Text>
          </Group>

          <Slider
            value={displayProgress}
            onChange={setLocalProgress}
            onChangeEnd={handleProgressCommit}
            min={0}
            max={100}
            step={5}
            marks={[
              { value: 0 },
              { value: 25 },
              { value: 50 },
              { value: 75 },
              { value: 100 },
            ]}
            color={displayProgress === 100 ? 'green' : 'red-panda'}
          />

          <Group gap="xs">
            <Text size="sm" c="dimmed">
              Status:
            </Text>
            {STATUS_OPTIONS.map((s) => (
              <Button
                key={s.value}
                size="xs"
                variant={topic.status === s.value ? 'filled' : 'subtle'}
                color={s.color}
                onClick={() => void handleStatusChange(s.value)}
                loading={updateTopic.isPending}
              >
                {s.label}
              </Button>
            ))}
          </Group>
        </Stack>
      </Card>

      {/* Resources */}
      <Stack gap="sm">
        <Group justify="space-between" align="center">
          <Title order={4}>Resources</Title>
          <Group gap="xs">
            <Button size="xs" variant="subtle" onClick={prefillWikiResource}>
              Link Wiki page
            </Button>
            <Button
              size="xs"
              leftSection={<Plus size={14} />}
              onClick={() => setShowResourceForm((v) => !v)}
            >
              Add resource
            </Button>
          </Group>
        </Group>

        {showResourceForm && (
          <Card withBorder radius="md" p="sm">
            <form onSubmit={resourceForm.onSubmit((v) => void handleAddResource(v))}>
              <Stack gap="sm">
                <Group grow>
                  <TextInput
                    placeholder="Resource title"
                    required
                    {...resourceForm.getInputProps('title')}
                  />
                  <Select
                    data={RESOURCE_TYPE_OPTIONS}
                    {...resourceForm.getInputProps('resourceType')}
                  />
                </Group>
                <TextInput
                  placeholder="URL (optional)"
                  leftSection={<LinkIcon size={14} />}
                  {...resourceForm.getInputProps('url')}
                />
                <TextInput placeholder="Notes (optional)" {...resourceForm.getInputProps('notes')} />
                <Group justify="flex-end" gap="xs">
                  <Button
                    size="xs"
                    variant="subtle"
                    onClick={() => {
                      setShowResourceForm(false)
                      resourceForm.reset()
                    }}
                  >
                    Cancel
                  </Button>
                  <Button size="xs" type="submit" loading={createResource.isPending}>
                    Add
                  </Button>
                </Group>
              </Stack>
            </form>
          </Card>
        )}

        {/* File upload */}
        <Group gap="sm">
          <FileInput
            placeholder="Upload content file"
            value={uploadFile}
            onChange={setUploadFile}
            style={{ flex: 1 }}
            size="xs"
          />
          <Button
            size="xs"
            disabled={!uploadFile}
            loading={uploadResource.isPending}
            onClick={() => void handleUploadFile()}
          >
            Upload
          </Button>
        </Group>

        {topic.resources.length === 0 && !showResourceForm ? (
          <Text size="sm" c="dimmed">
            No resources yet. Add a link or upload a file.
          </Text>
        ) : (
          <Stack gap="xs">
            {topic.resources.map((r) => (
              <Paper key={r.id} withBorder p="xs" radius="md">
                <Group justify="space-between" wrap="nowrap">
                  <Group gap="xs" wrap="nowrap" style={{ flex: 1, minWidth: 0 }}>
                    <ActionIcon
                      size="xs"
                      variant={r.completed ? 'filled' : 'subtle'}
                      color="green"
                      onClick={() =>
                        void updateResource.mutateAsync({
                          topicId: topic.id,
                          resourceId: r.id,
                          completed: !r.completed,
                        })
                      }
                      aria-label="Toggle completed"
                    >
                      <Check size={12} />
                    </ActionIcon>

                    <Badge size="xs" variant="dot" leftSection={<ResourceIcon type={r.resourceType} />}>
                      {r.resourceType}
                    </Badge>

                    <Stack gap={0} style={{ minWidth: 0, flex: 1 }}>
                      {r.url ? (
                        <Anchor
                          href={r.url}
                          target="_blank"
                          rel="noreferrer"
                          size="sm"
                          style={{ textDecoration: 'none' }}
                          td={r.completed ? 'line-through' : 'none'}
                          c={r.completed ? 'dimmed' : 'inherit'}
                        >
                          <Group gap={4} wrap="nowrap">
                            <Text size="sm" lineClamp={1}>
                              {r.title}
                            </Text>
                            <ExternalLink size={11} />
                          </Group>
                        </Anchor>
                      ) : (
                        <Text
                          size="sm"
                          lineClamp={1}
                          td={r.completed ? 'line-through' : 'none'}
                          c={r.completed ? 'dimmed' : 'inherit'}
                        >
                          {r.title}
                        </Text>
                      )}
                      {r.notes && (
                        <Text size="xs" c="dimmed" lineClamp={1}>
                          {r.notes}
                        </Text>
                      )}
                    </Stack>
                  </Group>

                  <ActionIcon
                    size="xs"
                    variant="subtle"
                    color="red"
                    onClick={() =>
                      void deleteResource.mutateAsync({ topicId: topic.id, resourceId: r.id })
                    }
                    aria-label="Delete resource"
                  >
                    <Trash2 size={12} />
                  </ActionIcon>
                </Group>
              </Paper>
            ))}
          </Stack>
        )}
      </Stack>

      <Divider />

      {/* Notes */}
      <Stack gap="sm">
        <Title order={4}>Notes</Title>

        <Stack gap="xs">
          <Textarea
            placeholder="Add a note..."
            value={noteBody}
            onChange={(e) => setNoteBody(e.currentTarget.value)}
            autosize
            minRows={2}
            maxRows={6}
          />
          <Group justify="flex-end">
            <Button
              size="xs"
              onClick={() => void handleAddNote()}
              disabled={!noteBody.trim()}
              loading={createNote.isPending}
            >
              Add note
            </Button>
          </Group>
        </Stack>

        {topic.notes.length === 0 ? (
          <Text size="sm" c="dimmed">
            No notes yet.
          </Text>
        ) : (
          <Stack gap="xs">
            {topic.notes.map((n) => (
              <Paper key={n.id} withBorder p="sm" radius="md">
                {editingNoteId === n.id ? (
                  <Stack gap="xs">
                    <Textarea
                      value={editingNoteBody}
                      onChange={(e) => setEditingNoteBody(e.currentTarget.value)}
                      autosize
                      minRows={2}
                    />
                    <Group justify="flex-end" gap="xs">
                      <ActionIcon
                        size="sm"
                        variant="subtle"
                        onClick={() => setEditingNoteId(null)}
                        aria-label="Cancel"
                      >
                        <X size={14} />
                      </ActionIcon>
                      <ActionIcon
                        size="sm"
                        color="green"
                        onClick={() => void handleSaveNote(n.id)}
                        loading={updateNote.isPending}
                        aria-label="Save"
                      >
                        <Check size={14} />
                      </ActionIcon>
                    </Group>
                  </Stack>
                ) : (
                  <Group justify="space-between" align="flex-start" wrap="nowrap">
                    <Stack gap={4} style={{ flex: 1 }}>
                      <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>
                        {n.body}
                      </Text>
                      <Text size="xs" c="dimmed">
                        {new Date(n.createdAt).toLocaleDateString()}
                      </Text>
                    </Stack>
                    <Group gap={4}>
                      <ActionIcon
                        size="xs"
                        variant="subtle"
                        onClick={() => {
                          setEditingNoteId(n.id)
                          setEditingNoteBody(n.body)
                        }}
                        aria-label="Edit note"
                      >
                        <Pencil size={12} />
                      </ActionIcon>
                      <ActionIcon
                        size="xs"
                        variant="subtle"
                        color="red"
                        onClick={() =>
                          void deleteNote.mutateAsync({ topicId: topic.id, noteId: n.id })
                        }
                        aria-label="Delete note"
                      >
                        <Trash2 size={12} />
                      </ActionIcon>
                    </Group>
                  </Group>
                )}
              </Paper>
            ))}
          </Stack>
        )}
      </Stack>
    </Stack>
  )
}
