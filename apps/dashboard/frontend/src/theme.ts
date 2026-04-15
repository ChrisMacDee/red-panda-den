import { createTheme } from '@mantine/core'

export const theme = createTheme({
  primaryColor: 'red-panda',
  colors: {
    'red-panda': [
      '#FDE8EC',
      '#F9C2CC',
      '#F09AAA',
      '#E57185',
      '#D4374F',
      '#C2162E',
      '#B01830',
      '#8E1327',
      '#6C0E1E',
      '#3D1520',
    ],
  },
  fontFamily: '"Plus Jakarta Sans", sans-serif',
  fontFamilyMonospace: '"JetBrains Mono", monospace',
  defaultRadius: 'md',
  components: {
    Button: { defaultProps: { radius: 'md' } },
    Card: { defaultProps: { radius: 'md', withBorder: true } },
    Badge: { defaultProps: { radius: 'sm' } },
  },
})
