import { DEFAULT_THEME } from '@zendeskgarden/react-theming'

// Identidade em azul. Cores aproximadas: troque aqui pelos valores oficiais da marca, se houver.
export const brand = {
  navy: '#0B2A5B',
  blue900: '#0F3B8C',
  blue700: '#1556C0',
  blue500: '#3B82F0',
  blue300: '#8DB5F7',
  blue100: '#E3EDFD',
  blue50: '#F1F6FE',
  cyan: '#0A8FB3',
  page: '#F3F6FB',
  card: '#FFFFFF',
  line: '#E1E8F2',
  text: '#16233B',
  muted: '#566680',
  danger: '#B3261E',
  radius: '16px',
  radiusSm: '10px',
  shadow: '0 1px 2px rgba(11, 42, 91, 0.06), 0 6px 18px rgba(11, 42, 91, 0.06)'
}

export const theme = {
  ...DEFAULT_THEME,
  brand,
  colors: { ...DEFAULT_THEME.colors, primaryHue: 'blue' }
}
