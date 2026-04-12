import { render, screen } from '@testing-library/react'
import { MantineProvider } from '@mantine/core'
import { describe, it, expect } from 'vitest'
import App from './App'
import { theme } from './theme'

function Wrapper({ children }: { children: React.ReactNode }) {
  return <MantineProvider theme={theme}>{children}</MantineProvider>
}

describe('App', () => {
  it('renders Red Panda Den title', () => {
    render(<App />, { wrapper: Wrapper })
    expect(screen.getByText('Red Panda Den')).toBeInTheDocument()
  })
})
