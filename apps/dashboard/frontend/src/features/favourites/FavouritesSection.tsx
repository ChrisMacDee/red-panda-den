import { useState } from 'react'
import { Stack, Group, Title, Button, Text, SimpleGrid, Center } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable'
import type { DragEndEvent } from '@dnd-kit/core'
import { Plus } from 'lucide-react'
import { FavouriteCard } from './FavouriteCard'
import { AddFavouriteModal } from './AddFavouriteModal'
import {
  useFavourites,
  useCreateFavourite,
  useUpdateFavourite,
  useDeleteFavourite,
  useReorderFavourites,
} from './useFavourites'
import type { Favourite, CreateFavouriteDto } from './favourites.types'

export function FavouritesSection() {
  const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false)
  const [editingFavourite, setEditingFavourite] = useState<Favourite | null>(null)

  const { data: favourites = [] } = useFavourites()
  const createFavourite = useCreateFavourite()
  const updateFavourite = useUpdateFavourite()
  const deleteFavourite = useDeleteFavourite()
  const reorderFavourites = useReorderFavourites()

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = favourites.findIndex((f) => f.id === active.id)
    const newIndex = favourites.findIndex((f) => f.id === over.id)

    if (oldIndex === -1 || newIndex === -1) return

    const reordered = [...favourites]
    const [moved] = reordered.splice(oldIndex, 1)
    reordered.splice(newIndex, 0, moved)

    reorderFavourites.mutate(reordered.map((f) => f.id))
  }

  function handleAdd() {
    setEditingFavourite(null)
    openModal()
  }

  function handleEdit(favourite: Favourite) {
    setEditingFavourite(favourite)
    openModal()
  }

  function handleModalClose() {
    setEditingFavourite(null)
    closeModal()
  }

  function handleSubmit(dto: CreateFavouriteDto) {
    if (editingFavourite) {
      updateFavourite.mutate(
        { id: editingFavourite.id, ...dto },
        { onSuccess: handleModalClose },
      )
    } else {
      createFavourite.mutate(dto, { onSuccess: handleModalClose })
    }
  }

  function handleDelete(id: number) {
    deleteFavourite.mutate(id)
  }

  const isLoading = createFavourite.isPending || updateFavourite.isPending

  return (
    <Stack gap="sm">
      <Group justify="space-between" align="center">
        <Title order={3} size="h5" c="dimmed" tt="uppercase" style={{ letterSpacing: '0.05em' }}>
          Favourites
        </Title>
        <Button
          variant="subtle"
          size="xs"
          leftSection={<Plus size={14} />}
          onClick={handleAdd}
        >
          Add
        </Button>
      </Group>

      {favourites.length === 0 ? (
        <Center py="xl">
          <Stack align="center" gap="sm">
            <Text c="dimmed" size="sm">
              Add your favourite sites for quick access
            </Text>
            <Button variant="light" size="xs" leftSection={<Plus size={14} />} onClick={handleAdd}>
              Add favourite
            </Button>
          </Stack>
        </Center>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={favourites.map((f) => f.id)}
            strategy={rectSortingStrategy}
          >
            <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="sm">
              {favourites.map((favourite) => (
                <FavouriteCard
                  key={favourite.id}
                  favourite={favourite}
                  onEdit={handleEdit}
                />
              ))}
            </SimpleGrid>
          </SortableContext>
        </DndContext>
      )}

      <AddFavouriteModal
        opened={modalOpened}
        onClose={handleModalClose}
        onSubmit={handleSubmit}
        editing={editingFavourite}
        onDelete={handleDelete}
        loading={isLoading}
      />
    </Stack>
  )
}
