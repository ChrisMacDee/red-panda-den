import { Card, Group, Text, Stack, Badge, UnstyledButton } from '@mantine/core'
import { Link } from 'react-router-dom'
import * as LucideIcons from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { ServiceConfig } from './services.config'

interface ServiceCardProps {
  service: ServiceConfig
  healthStatus?: 'healthy' | 'degraded' | 'unknown'
}

function ServiceIcon({ iconName }: { iconName: string }) {
  const Icon = (LucideIcons as unknown as Record<string, LucideIcon>)[iconName]
  if (!Icon) {
    const FallbackIcon = LucideIcons.Globe
    return (
      <FallbackIcon
        size={20}
        style={{ color: 'var(--mantine-color-red-panda-5)' }}
      />
    )
  }
  return <Icon size={20} style={{ color: 'var(--mantine-color-red-panda-5)' }} />
}

function HealthDot({ status }: { status?: 'healthy' | 'degraded' | 'unknown' }) {
  const color = status === 'healthy' ? 'green' : status === 'degraded' ? 'yellow' : 'gray'
  return (
    <Badge
      size="xs"
      color={color}
      variant="dot"
      styles={{ root: { paddingLeft: 8 } }}
    >
      {status ?? 'unknown'}
    </Badge>
  )
}

function CardContent({ service, healthStatus }: ServiceCardProps) {
  return (
    <Card
      h="100%"
      style={{
        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
        cursor: 'pointer',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)'
        e.currentTarget.style.boxShadow = 'var(--mantine-shadow-md)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.boxShadow = ''
      }}
    >
      <Stack gap="xs">
        <Group justify="space-between" align="flex-start">
          <Group
            gap="xs"
            style={{
              width: 36,
              height: 36,
              borderRadius: 'var(--mantine-radius-md)',
              backgroundColor: 'var(--mantine-color-red-panda-9)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ServiceIcon iconName={service.icon} />
          </Group>
          <HealthDot status={healthStatus} />
        </Group>
        <Text fw={600} size="sm" lineClamp={1}>
          {service.name}
        </Text>
        <Text size="xs" c="dimmed" lineClamp={2}>
          {service.description}
        </Text>
      </Stack>
    </Card>
  )
}

export function ServiceCard({ service, healthStatus }: ServiceCardProps) {
  if (service.internalRoute) {
    return (
      <Link to={service.internalRoute} style={{ textDecoration: 'none', display: 'block' }}>
        <CardContent service={service} healthStatus={healthStatus} />
      </Link>
    )
  }

  return (
    <UnstyledButton
      component="a"
      href={service.url}
      target="_blank"
      rel="noopener noreferrer"
      style={{ display: 'block', width: '100%' }}
    >
      <CardContent service={service} healthStatus={healthStatus} />
    </UnstyledButton>
  )
}
