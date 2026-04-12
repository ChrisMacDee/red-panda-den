import { Text, Center, Stack, Image } from '@mantine/core'

export default function App() {
  return (
    <Center h="100vh">
      <Stack align="center" gap="md">
        <Image src="/logo.png" alt="Red Panda Den" w={80} h={80} />
        <Text
          size="xl"
          fw={700}
          ff="var(--mantine-font-family-monospace)"
          c="red-panda"
        >
          Red Panda Den
        </Text>
      </Stack>
    </Center>
  )
}
