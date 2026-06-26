import { AppShell, Group, Image, Text, ActionIcon, Stack, Flex } from '@mantine/core'
import { useMediaQuery } from '@mantine/hooks'
import { useMantineColorScheme } from '@mantine/core'
import { Sun, Moon, House, Briefcase, BookOpen, Pill } from 'lucide-react'
import { NavItem } from './NavItem'
import { TabBarItem } from './TabBarItem'
import { AppRouter } from '../../router'

const NAV_ITEMS = [
  { label: 'Home', icon: House, to: '/' },
  { label: 'Jobs', icon: Briefcase, to: '/jobs' },
  { label: 'Knowledge', icon: BookOpen, to: '/knowledge' },
  { label: 'Medication', icon: Pill, to: '/medication' },
] as const

// Tab bar height without safe area (64px). The footer element itself adds
// env(safe-area-inset-bottom) via padding so it grows on notched iPhones.
const TAB_BAR_HEIGHT = 64

export function AppLayout() {
  const { colorScheme, toggleColorScheme } = useMantineColorScheme()
  // Default to false (desktop) while the media query resolves to avoid flash.
  const isMobile = useMediaQuery('(max-width: 768px)') ?? false

  return (
    <AppShell
      navbar={isMobile ? undefined : { width: 240, breakpoint: 'md' }}
      header={isMobile ? { height: 56 } : undefined}
      footer={isMobile ? { height: TAB_BAR_HEIGHT } : undefined}
      padding="md"
    >
      {/* ── Mobile header ─────────────────────────────────────────────── */}
      {isMobile && (
        <AppShell.Header>
          <Group h="100%" px="md" justify="space-between">
            <Group gap="sm">
              <Image src="/logo.png" alt="Red Panda Den" w={32} h={32} />
              <Text fw={700} ff="var(--mantine-font-family-monospace)" c="red-panda" size="sm">
                Red Panda Den
              </Text>
            </Group>
            <ActionIcon variant="subtle" onClick={toggleColorScheme} size="lg">
              {colorScheme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </ActionIcon>
          </Group>
        </AppShell.Header>
      )}

      {/* ── Desktop sidebar ───────────────────────────────────────────── */}
      {!isMobile && (
        <AppShell.Navbar p="md">
          <AppShell.Section>
            <Group gap="sm" mb="lg" px="xs">
              <Image src="/logo.png" alt="Red Panda Den" w={36} h={36} />
              <Text fw={700} ff="var(--mantine-font-family-monospace)" c="red-panda" size="sm">
                Red Panda Den
              </Text>
            </Group>
          </AppShell.Section>

          <AppShell.Section grow>
            <Stack gap={4}>
              {NAV_ITEMS.map((item) => (
                <NavItem key={item.to} label={item.label} icon={item.icon} to={item.to} />
              ))}
            </Stack>
          </AppShell.Section>

          <AppShell.Section>
            <Flex justify="flex-end" px="xs">
              <ActionIcon variant="subtle" onClick={toggleColorScheme} size="lg">
                {colorScheme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
              </ActionIcon>
            </Flex>
          </AppShell.Section>
        </AppShell.Navbar>
      )}

      {/* ── Mobile bottom tab bar ─────────────────────────────────────── */}
      {isMobile && (
        <AppShell.Footer
          style={{
            // Grow below the 64px base on iOS for the home indicator bar.
            paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          }}
        >
          <Group justify="space-around" h={TAB_BAR_HEIGHT} px="xs" align="center">
            {NAV_ITEMS.map((item) => (
              <TabBarItem key={item.to} label={item.label} icon={item.icon} to={item.to} />
            ))}
          </Group>
        </AppShell.Footer>
      )}

      <AppShell.Main>
        <AppRouter />
      </AppShell.Main>
    </AppShell>
  )
}
