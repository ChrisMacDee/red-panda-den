import { AppShell, Burger, Group, Image, Text, ActionIcon, Stack, Flex } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { useMantineColorScheme } from '@mantine/core'
import { useMediaQuery } from '@mantine/hooks'
import { Sun, Moon, House, Briefcase, BookOpen, Pill } from 'lucide-react'
import { NavItem } from './NavItem'
import { AppRouter } from '../../router'

const NAV_ITEMS = [
  { label: 'Home', icon: House, to: '/' },
  { label: 'Jobs', icon: Briefcase, to: '/jobs' },
  { label: 'Knowledge', icon: BookOpen, to: '/knowledge' },
  { label: 'Medication', icon: Pill, to: '/medication' },
] as const

export function AppLayout() {
  const [mobileNavOpened, { toggle: toggleMobileNav, close: closeMobileNav }] = useDisclosure(false)
  const { colorScheme, toggleColorScheme } = useMantineColorScheme()
  const isMobile = useMediaQuery('(max-width: 768px)')

  return (
    <AppShell
      navbar={
        isMobile
          ? undefined
          : {
              width: 240,
              breakpoint: 'md',
              collapsed: { mobile: !mobileNavOpened },
            }
      }
      header={isMobile ? { height: 56 } : undefined}
      padding="md"
    >
      {isMobile && (
        <AppShell.Header>
          <Group h="100%" px="md" justify="space-between">
            <Group gap="sm">
              <Burger opened={mobileNavOpened} onClick={toggleMobileNav} size="sm" hiddenFrom="md" />
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

      <AppShell.Main>
        <AppRouter />
      </AppShell.Main>

      {isMobile && (
        <AppShell.Footer>
          <Group justify="space-around" h="100%" px="xs">
            {NAV_ITEMS.map((item) => (
              <NavItem
                key={item.to}
                label={item.label}
                icon={item.icon}
                to={item.to}
                onClick={closeMobileNav}
              />
            ))}
          </Group>
        </AppShell.Footer>
      )}
    </AppShell>
  )
}
