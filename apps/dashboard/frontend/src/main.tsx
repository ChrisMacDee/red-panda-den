import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { MantineProvider, ColorSchemeScript } from '@mantine/core'
import { Notifications } from '@mantine/notifications'
import '@mantine/core/styles.css'
import '@mantine/notifications/styles.css'
import { theme } from './theme'
import App from './App'

const root = document.getElementById('root')
if (!root) throw new Error('Root element not found')

createRoot(root).render(
  <StrictMode>
    <ColorSchemeScript defaultColorScheme="dark" />
    <MantineProvider theme={theme} defaultColorScheme="dark">
      <Notifications />
      <App />
    </MantineProvider>
  </StrictMode>,
)
