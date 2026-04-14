import { NavLink } from '@mantine/core'
import { useMatch, useNavigate } from 'react-router-dom'
import type { LucideIcon } from 'lucide-react'

interface NavItemProps {
  label: string
  icon: LucideIcon
  to: string
  onClick?: () => void
}

export function NavItem({ label, icon: Icon, to, onClick }: NavItemProps) {
  const match = useMatch({ path: to, end: to === '/' })

  const navigate = useNavigate()

  function handleClick() {
    navigate(to)
    onClick?.()
  }

  return (
    <NavLink
      label={label}
      leftSection={<Icon size={18} />}
      active={!!match}
      onClick={handleClick}
      styles={{
        root: {
          borderRadius: 'var(--mantine-radius-md)',
        },
      }}
    />
  )
}
