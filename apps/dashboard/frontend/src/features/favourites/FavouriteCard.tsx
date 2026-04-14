import { useState } from 'react'
import { Card, Group, Text, ActionIcon, Stack, Box } from '@mantine/core'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Pencil } from 'lucide-react'
import { FavouriteIcon } from './FavouriteIcon'
import type { Favourite } from './favourites.types'

interface FavouriteCardProps {
  favourite: Favourite
  onEdit: (favourite: Favourite) => void
}

function extractHostname(url: string): string {
  try {
    return new URL(url).hostname
  } catch {
    return url
  }
}

export function FavouriteCard({ favourite, onEdit }: FavouriteCardProps) {
  const [hovered, setHovered] = useState(false)

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: favourite.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const accentStyle = favourite.colour
    ? {
        borderLeft: `3px solid ${favourite.colour}`,
      }
    : {}

  function handleClick(e: React.MouseEvent) {
    // Prevent navigation if drag happened
    if (isDragging) {
      e.preventDefault()
    }
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Card
        component="a"
        href={favourite.url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleClick}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          ...accentStyle,
          transition: 'transform 0.15s ease, box-shadow 0.15s ease',
          transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
          boxShadow: hovered ? 'var(--mantine-shadow-md)' : '',
          cursor: isDragging ? 'grabbing' : 'pointer',
          textDecoration: 'none',
          display: 'block',
        }}
        p="sm"
      >
        <Group gap="sm" wrap="nowrap" justify="space-between">
          <Group gap="sm" wrap="nowrap" style={{ minWidth: 0 }}>
            <Box
              style={{
                width: 32,
                height: 32,
                borderRadius: 'var(--mantine-radius-sm)',
                backgroundColor: 'var(--mantine-color-default)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <FavouriteIcon favourite={favourite} size={20} />
            </Box>
            <Stack gap={2} style={{ minWidth: 0 }}>
              <Text fw={600} size="sm" lineClamp={1}>
                {favourite.title}
              </Text>
              <Text size="xs" c="dimmed" lineClamp={1}>
                {extractHostname(favourite.url)}
              </Text>
            </Stack>
          </Group>

          {hovered && (
            <ActionIcon
              variant="subtle"
              size="sm"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                onEdit(favourite)
              }}
            >
              <Pencil size={14} />
            </ActionIcon>
          )}
        </Group>
      </Card>
    </div>
  )
}
