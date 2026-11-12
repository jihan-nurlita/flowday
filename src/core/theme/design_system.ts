/**
 * FlowDay Global Design System
 * Enforces unified styling, tokens, typography, spacing, radius, shadows, and breakpoints.
 */

export const AppColors = {
  // Primary Brand
  primary: '#A995D8', // Soft Lavender
  primaryHover: '#9680C9',
  primaryActive: '#8770BA',
  primaryLight: '#F4F1FA',
  primaryTint: 'rgba(169, 149, 216, 0.15)',

  // Secondary Accents
  secondary: '#F1B8CC', // Soft Pink
  secondaryHover: '#E5A5BC',
  secondaryLight: '#FDF1F5',

  accent: '#A9C8E8', // Pastel Blue
  accentHover: '#92B7DC',
  accentLight: '#F0F6FC',

  mint: '#B5DCCB', // Soft Mint
  mintHover: '#9DCDB9',
  mintLight: '#F2F8F5',

  peach: '#F7D0BA', // Soft Peach
  peachLight: '#FCF5F1',

  butter: '#FBE8A6', // Soft Butter
  butterLight: '#FDF9EC',

  // Light Mode Canvas
  background: '#FAF9FC', // Warm White
  surface: '#FFFFFF',    // Pure White Card
  surfaceSubtle: '#F6F4F9',
  border: '#EEEAF2',     // Soft Gray Line
  borderSubtle: '#F2EFF6',

  // Text Hierarchy (Light)
  textPrimary: '#34313D',   // Dark Charcoal
  textSecondary: '#898493', // Muted Gray
  textTertiary: '#B2ADC0',  // Very Subtle Gray

  // Semantic Status
  statusSuccess: '#B5DCCB',
  statusWarning: '#E9C46A',
  statusDanger: '#E07A5F',
  statusInfo: '#A9C8E8',

  // Dark Mode Overrides (Optically paired)
  dark: {
    background: '#17151D',   // Deep Charcoal Violet
    surface: '#201D27',      // Elevated Card Surface
    surfaceSubtle: '#262230',
    surfaceHover: '#2A2635',
    border: '#2D2838',       // Subtle border
    borderSubtle: '#363144',
    textPrimary: '#F4F2F7',  // Soft White
    textSecondary: '#9E99A8',// Muted Slate
    textTertiary: '#716B7C',
    primaryLight: '#2C253B',
    secondaryLight: '#3A2733',
    accentLight: '#1E2B3A',
    mintLight: '#1C3127',
  },
} as const;

export const AppTypography = {
  fontSans: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
  fontMono: "'JetBrains Mono', monospace",

  // Hierarchies
  display: 'text-3xl sm:text-4xl font-bold tracking-tight',
  headline: 'text-xl sm:text-2xl font-bold tracking-tight',
  titleLarge: 'text-lg sm:text-xl font-semibold tracking-tight',
  titleMedium: 'text-base font-semibold tracking-tight',
  titleSmall: 'text-sm font-semibold tracking-tight',
  bodyLarge: 'text-base leading-relaxed',
  bodyMedium: 'text-sm leading-normal',
  bodySmall: 'text-xs leading-normal',
  label: 'text-xs font-semibold uppercase tracking-wider',
  caption: 'text-[11px] leading-tight font-medium',
  numeric: 'font-mono tabular-nums tracking-tight',
} as const;

export const AppSpacing = {
  none: '0px',
  xs: '4px',   // space-1
  sm: '8px',   // space-2
  md: '16px',  // space-4
  lg: '24px',  // space-6
  xl: '32px',  // space-8
  xxl: '48px', // space-12
} as const;

export const AppRadius = {
  none: '0px',
  sm: '8px',    // rounded-lg
  md: '12px',   // rounded-xl
  lg: '16px',   // rounded-2xl
  xl: '24px',   // rounded-3xl
  full: '9999px',
} as const;

export const AppShadows = {
  none: 'none',
  card: '0 2px 12px rgba(52, 49, 61, 0.04)',
  cardHover: '0 6px 20px rgba(169, 149, 216, 0.12)',
  floating: '0 12px 36px rgba(52, 49, 61, 0.12)',
  subtle: '0 1px 3px rgba(0, 0, 0, 0.05)',
} as const;

export const AppDimensions = {
  sidebarWidth: '260px',
  railWidth: '76px',
  headerHeight: '56px',
  bottomNavHeight: '64px',
  maxContentWidth: '1280px',
  minTouchTarget: '44px',
} as const;

export const AppBreakpoints = {
  mobileMax: 767,
  tabletMin: 768,
  tabletMax: 1023,
  desktopMin: 1024,
  wideMin: 1440,
} as const;
