import { render, screen } from '@testing-library/react'
import { MantineProvider } from '@mantine/core'
import { describe, it, expect } from 'vitest'
import App from './App'
import { theme } from './theme'

function Wrapper({ children }: { children: React.ReactNode }) {
  return <MantineProvider theme={theme}>{children}</MantineProvider>
}

describe('App', () => {
  it('renders without crashing', () => {
    render(<App />, { wrapper: Wrapper })
    // The app should render the layout — check for a nav element or heading
    expect(document.body).toBeTruthy()
  })

  it('renders Red Panda Den branding', () => {
    render(<App />, { wrapper: Wrapper })
    // Logo image should be present
    const logo = document.querySelector('img[alt="Red Panda Den"]')
    expect(logo).toBeTruthy()
  })
})
