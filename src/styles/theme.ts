export const theme = {
  colors: {
    background: '#f7f9fc',
    surface: '#ffffff',
    border: '#e4e9f1',
    text: '#172033',
    textMuted: '#697386',
    success: '#13b878',
    successSoft: '#dff8ed',
    successText: '#08734c',
    danger: '#ef4444',
    dangerSoft: '#fee2e2',
    dangerText: '#a32121',
    onAccent: '#ffffff',
    accent: '#7c3aed',
    accentHover: '#6d28d9',
    focus: '#72adff',
  },
  spacing: {
    sm: '8px',
    md: '12px',
    lg: '20px',
    xl: '28px',
  },
  radii: {
    md: '8px',
    lg: '12px',
  },
  fontSizes: {
    small: '0.875rem',
    title: '1.375rem',
  },
  shadows: {
    card: '0 8px 24px rgba(23, 32, 51, 0.07)',
  },
} as const;

export type AppTheme = typeof theme;
