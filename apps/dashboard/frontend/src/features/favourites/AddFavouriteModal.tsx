import { Modal, TextInput, Select, Button, Group, Stack, SimpleGrid, ActionIcon, Box, Text, ColorInput } from '@mantine/core'
import { useForm } from '@mantine/form'
import { Globe, Star, Heart, House, Code, Bookmark, Link, Music, Camera, Coffee, Gamepad2, Newspaper } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { Favourite, CreateFavouriteDto } from './favourites.types'

const LIBRARY_ICONS: Array<{ name: string; icon: LucideIcon }> = [
  { name: 'Globe', icon: Globe },
  { name: 'Star', icon: Star },
  { name: 'Heart', icon: Heart },
  { name: 'House', icon: House },
  { name: 'Code', icon: Code },
  { name: 'Bookmark', icon: Bookmark },
  { name: 'Link', icon: Link },
  { name: 'Music', icon: Music },
  { name: 'Camera', icon: Camera },
  { name: 'Coffee', icon: Coffee },
  { name: 'Gamepad2', icon: Gamepad2 },
  { name: 'Newspaper', icon: Newspaper },
]

const ACCENT_SWATCHES = [
  '#C2162E', '#2D8B4E', '#D4A843', '#3B82F6',
  '#8B5CF6', '#EC4899', '#F97316', '#06B6D4',
]

interface FormValues {
  title: string
  url: string
  iconType: 'favicon' | 'library' | 'custom'
  iconValue: string
  colour: string
}

interface AddFavouriteModalProps {
  opened: boolean
  onClose: () => void
  onSubmit: (dto: CreateFavouriteDto) => void
  editing?: Favourite | null
  onDelete?: (id: number) => void
  loading?: boolean
}

export function AddFavouriteModal({
  opened,
  onClose,
  onSubmit,
  editing,
  onDelete,
  loading,
}: AddFavouriteModalProps) {
  const form = useForm<FormValues>({
    initialValues: {
      title: editing?.title ?? '',
      url: editing?.url ?? '',
      iconType: editing?.iconType ?? 'favicon',
      iconValue: editing?.iconValue ?? '',
      colour: editing?.colour ?? '',
    },
    validate: {
      title: (v) => (v.trim().length === 0 ? 'Title is required' : null),
      url: (v) => {
        try {
          new URL(v)
          return null
        } catch {
          return 'Please enter a valid URL'
        }
      },
    },
  })

  // Reset form when editing changes
  if (editing && form.values.title === '' && editing.title !== '') {
    form.setValues({
      title: editing.title,
      url: editing.url,
      iconType: editing.iconType,
      iconValue: editing.iconValue ?? '',
      colour: editing.colour ?? '',
    })
  }

  function handleSubmit(values: FormValues) {
    const dto: CreateFavouriteDto = {
      title: values.title,
      url: values.url,
      iconType: values.iconType,
      iconValue: values.iconValue || undefined,
      colour: values.colour || undefined,
    }
    onSubmit(dto)
    form.reset()
  }

  function handleClose() {
    form.reset()
    onClose()
  }

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={editing ? 'Edit Favourite' : 'Add Favourite'}
      size="md"
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          <TextInput
            label="Title"
            placeholder="My favourite site"
            required
            {...form.getInputProps('title')}
          />

          <TextInput
            label="URL"
            placeholder="https://example.com"
            required
            {...form.getInputProps('url')}
          />

          <Select
            label="Icon type"
            data={[
              { value: 'favicon', label: 'Auto (favicon)' },
              { value: 'library', label: 'Library icon' },
              { value: 'custom', label: 'Custom URL' },
            ]}
            {...form.getInputProps('iconType')}
          />

          {form.values.iconType === 'library' && (
            <Stack gap="xs">
              <Text size="sm" fw={500}>
                Choose icon
              </Text>
              <SimpleGrid cols={6} spacing="xs">
                {LIBRARY_ICONS.map(({ name, icon: Icon }) => (
                  <ActionIcon
                    key={name}
                    variant={form.values.iconValue === name ? 'filled' : 'subtle'}
                    onClick={() => form.setFieldValue('iconValue', name)}
                    size="lg"
                  >
                    <Icon size={18} />
                  </ActionIcon>
                ))}
              </SimpleGrid>
            </Stack>
          )}

          {form.values.iconType === 'custom' && (
            <TextInput
              label="Icon URL"
              placeholder="https://example.com/icon.png"
              {...form.getInputProps('iconValue')}
            />
          )}

          <Stack gap="xs">
            <Text size="sm" fw={500}>
              Accent colour (optional)
            </Text>
            <Group gap="xs">
              {ACCENT_SWATCHES.map((swatch) => (
                <Box
                  key={swatch}
                  onClick={() =>
                    form.setFieldValue('colour', form.values.colour === swatch ? '' : swatch)
                  }
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 4,
                    backgroundColor: swatch,
                    cursor: 'pointer',
                    border:
                      form.values.colour === swatch
                        ? '2px solid var(--mantine-color-text)'
                        : '2px solid transparent',
                  }}
                />
              ))}
            </Group>
            <ColorInput
              placeholder="Custom hex (e.g. #FF5733)"
              {...form.getInputProps('colour')}
            />
          </Stack>

          <Group justify="space-between" mt="sm">
            {editing && onDelete && (
              <Button
                variant="subtle"
                color="red"
                onClick={() => {
                  onDelete(editing.id)
                  handleClose()
                }}
              >
                Delete
              </Button>
            )}
            <Group ml="auto">
              <Button variant="subtle" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit" loading={loading}>
                {editing ? 'Save changes' : 'Add favourite'}
              </Button>
            </Group>
          </Group>
        </Stack>
      </form>
    </Modal>
  )
}
