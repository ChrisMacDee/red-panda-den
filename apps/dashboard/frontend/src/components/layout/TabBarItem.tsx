import { UnstyledButton, Stack, Text } from '@mantine/core'
import { useMatch, useNavigate } from 'react-router-dom'
import type { LucideIcon } from 'lucide-react'

interface TabBarItemProps {
  label: string
  icon: LucideIcon
  to: string
}

export function TabBarItem({ label, icon: Icon, to }: TabBarItemProps) {
  const match = useMatch({ path: to, end: to === '/' })
  const navigate = useNavigate()
  const isActive = !!match

  return (
    <UnstyledButton
      onClick={() => navigate(to)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 2,
        padding: '4px 16px',
        minWidth: 56,
        color: isActive
          ? 'var(--mantine-color-red-panda-5)'
          : 'var(--mantine-color-dimmed)',
      }}
    >
      <Icon size={22} strokeWidth={isActive ? 2.5 : 1.75} />
      <Text size="xs" fw={isActive ? 600 : 400} c="inherit" style={{ lineHeight: 1.2 }}>
        {label}
      </Text>
    </UnstyledButton>
  )
}
