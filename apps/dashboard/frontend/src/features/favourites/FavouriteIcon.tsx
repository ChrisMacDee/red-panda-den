import { useState } from 'react'
import { Image } from '@mantine/core'
import * as LucideIcons from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { Favourite } from './favourites.types'

interface FavouriteIconProps {
  favourite: Pick<Favourite, 'url' | 'iconType' | 'iconValue'>
  size?: number
}

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname
  } catch {
    return url
  }
}

export function FavouriteIcon({ favourite, size = 24 }: FavouriteIconProps) {
  const [faviconError, setFaviconError] = useState(false)
  const FallbackIcon = LucideIcons.Link

  if (favourite.iconType === 'library' && favourite.iconValue) {
    const Icon = (LucideIcons as unknown as Record<string, LucideIcon>)[favourite.iconValue]
    if (Icon) {
      return <Icon size={size} />
    }
    return <FallbackIcon size={size} />
  }

  if (favourite.iconType === 'custom' && favourite.iconValue) {
    return (
      <Image
        src={favourite.iconValue}
        w={size}
        h={size}
        fit="contain"
        fallbackSrc=""
      />
    )
  }

  // Default: favicon
  const domain = extractDomain(favourite.url)
  const faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`

  if (faviconError) {
    return <FallbackIcon size={size} />
  }

  return (
    <img
      src={faviconUrl}
      width={size}
      height={size}
      alt=""
      onError={() => setFaviconError(true)}
      style={{ objectFit: 'contain' }}
    />
  )
}
