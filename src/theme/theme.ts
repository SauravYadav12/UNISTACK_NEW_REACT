import { createTheme, alpha } from '@mui/material/styles';

// UNISTACK Brand Palette
const tokens = {
  colors: {
    // Brand colors from the logo
    pink: '#EC4599',
    pinkLight: '#F472B6',
    pinkDark: '#DB2777',
    blue: '#37B7EA',
    blueLight: '#5CC8F0',
    blueDark: '#1A9FD4',
    yellow: '#FCE441',
    yellowLight: '#FDE968',
    yellowDark: '#EAD020',
    brand: '#032840', // deep navy brand bg

    // Mapped to MUI roles
    primary: '#EC4599', // Pink - primary actions, active states
    primaryLight: '#F472B6',
    primaryDark: '#DB2777',
    secondary: '#37B7EA', // Blue - secondary actions, info
    secondaryLight: '#5CC8F0',
    secondaryDark: '#1A9FD4',

    success: '#10B981',
    successLight: '#6EE7B7',
    warning: '#F59E0B',
    warningLight: '#FCD34D',
    error: '#EF4444',
    errorLight: '#FCA5A5',
    info: '#37B7EA',
    infoLight: '#7DD3FC',

    // Light mode
    lightBg: '#F5F7FA',
    lightSurface: '#FFFFFF',
    lightSurfaceAlt: '#EEF2F7',
    lightText: '#032840',
    lightTextSecondary: '#5A6B7F',
    lightBorder: '#E2E8F0',

    // Dark mode
    darkBg: '#032840',
    darkSurface: '#0A3555',
    darkSurfaceAlt: '#0F4068',
    darkText: '#F1F5F9',
    darkTextSecondary: '#94A3B8',
    darkBorder: '#1E5578',
  },
  shape: {
    borderRadius: 12,
    borderRadiusLg: 16,
    borderRadiusPill: 24,
  },
  shadows: {
    soft1: '0 1px 3px rgba(3, 40, 64, 0.06), 0 1px 2px rgba(3, 40, 64, 0.04)',
    soft2: '0 2px 8px rgba(3, 40, 64, 0.07)',
    soft4: '0 4px 16px rgba(3, 40, 64, 0.08)',
    soft8: '0 8px 32px rgba(3, 40, 64, 0.10)',
    soft16: '0 16px 48px rgba(3, 40, 64, 0.14)',
    glow: '0 0 20px rgba(236, 69, 153, 0.25)',
    aiGlow:
      '0 0 20px rgba(236, 69, 153, 0.3), 0 0 40px rgba(55, 183, 234, 0.15)',
    blueGlow: '0 0 20px rgba(55, 183, 234, 0.25)',
    yellowGlow: '0 0 20px rgba(252, 228, 65, 0.3)',
  },
  glass: {
    lightBg: 'rgba(255, 255, 255, 0.78)',
    darkBg: 'rgba(3, 40, 64, 0.85)',
    blur: 'blur(20px)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderDark: '1px solid rgba(255, 255, 255, 0.08)',
  },
  gradients: {
    brand: 'linear-gradient(135deg, #EC4599 0%, #37B7EA 50%, #FCE441 100%)',
    brandSubtle:
      'linear-gradient(135deg, rgba(236, 69, 153, 0.08) 0%, rgba(55, 183, 234, 0.08) 50%, rgba(252, 228, 65, 0.06) 100%)',
    pinkBlue: 'linear-gradient(135deg, #EC4599 0%, #37B7EA 100%)',
    pinkBlueSubtle:
      'linear-gradient(135deg, rgba(236, 69, 153, 0.1) 0%, rgba(55, 183, 234, 0.1) 100%)',
    ai: 'linear-gradient(135deg, #EC4599 0%, #37B7EA 100%)',
    aiSubtle:
      'linear-gradient(135deg, rgba(236, 69, 153, 0.08) 0%, rgba(55, 183, 234, 0.08) 100%)',
    warmGlow: 'linear-gradient(135deg, #FCE441 0%, #EC4599 100%)',
    darkSurface: 'linear-gradient(180deg, #032840 0%, #0A3555 100%)',
    sidebar: 'linear-gradient(180deg, #032840 0%, #0A3555 100%)',
  },
};

// Soft shadow array for MUI (25 levels)
const softShadows: [
  'none',
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
] = [
  'none',
  tokens.shadows.soft1,
  tokens.shadows.soft1,
  tokens.shadows.soft2,
  tokens.shadows.soft2,
  tokens.shadows.soft4,
  tokens.shadows.soft4,
  tokens.shadows.soft4,
  tokens.shadows.soft8,
  tokens.shadows.soft8,
  tokens.shadows.soft8,
  tokens.shadows.soft8,
  tokens.shadows.soft16,
  tokens.shadows.soft16,
  tokens.shadows.soft16,
  tokens.shadows.soft16,
  tokens.shadows.soft16,
  tokens.shadows.soft16,
  tokens.shadows.soft16,
  tokens.shadows.soft16,
  tokens.shadows.soft16,
  tokens.shadows.soft16,
  tokens.shadows.soft16,
  tokens.shadows.soft16,
  tokens.shadows.soft16,
];

const theme = createTheme({
  cssVariables: {
    colorSchemeSelector: 'class',
  },
  colorSchemes: {
    light: {
      palette: {
        primary: {
          main: tokens.colors.primary,
          light: tokens.colors.primaryLight,
          dark: tokens.colors.primaryDark,
          contrastText: '#FFFFFF',
        },
        secondary: {
          main: tokens.colors.secondary,
          light: tokens.colors.secondaryLight,
          dark: tokens.colors.secondaryDark,
          contrastText: '#FFFFFF',
        },
        success: {
          main: tokens.colors.success,
          light: tokens.colors.successLight,
        },
        warning: {
          main: tokens.colors.warning,
          light: tokens.colors.warningLight,
        },
        error: { main: tokens.colors.error, light: tokens.colors.errorLight },
        info: { main: tokens.colors.info, light: tokens.colors.infoLight },
        background: {
          default: tokens.colors.lightBg,
          paper: tokens.colors.lightSurface,
        },
        text: {
          primary: tokens.colors.lightText,
          secondary: tokens.colors.lightTextSecondary,
        },
        divider: tokens.colors.lightBorder,
      },
    },
    dark: {
      palette: {
        primary: {
          main: tokens.colors.pinkLight,
          light: tokens.colors.pink,
          dark: tokens.colors.pinkDark,
          contrastText: '#FFFFFF',
        },
        secondary: {
          main: tokens.colors.blueLight,
          light: tokens.colors.blue,
          dark: tokens.colors.blueDark,
          contrastText: '#FFFFFF',
        },
        success: {
          main: tokens.colors.success,
          light: tokens.colors.successLight,
        },
        warning: {
          main: tokens.colors.warning,
          light: tokens.colors.warningLight,
        },
        error: { main: tokens.colors.error, light: tokens.colors.errorLight },
        info: { main: tokens.colors.info, light: tokens.colors.infoLight },
        background: {
          default: tokens.colors.darkBg,
          paper: tokens.colors.darkSurface,
        },
        text: {
          primary: tokens.colors.darkText,
          secondary: tokens.colors.darkTextSecondary,
        },
        divider: tokens.colors.darkBorder,
      },
    },
  },
  typography: {
    fontFamily:
      '"Inter Variable", "Inter", system-ui, -apple-system, sans-serif',
    h1: {
      fontSize: '2rem',
      fontWeight: 700,
      lineHeight: 1.25,
      letterSpacing: '-0.02em',
    },
    h2: {
      fontSize: '1.5rem',
      fontWeight: 700,
      lineHeight: 1.3,
      letterSpacing: '-0.01em',
    },
    h3: { fontSize: '1.25rem', fontWeight: 600, lineHeight: 1.4 },
    h4: { fontSize: '1.125rem', fontWeight: 600, lineHeight: 1.4 },
    h5: { fontSize: '1rem', fontWeight: 600, lineHeight: 1.5 },
    h6: { fontSize: '0.875rem', fontWeight: 600, lineHeight: 1.5 },
    body1: { fontSize: '0.875rem', fontWeight: 400, lineHeight: 1.6 },
    body2: { fontSize: '0.8125rem', fontWeight: 400, lineHeight: 1.6 },
    caption: {
      fontSize: '0.75rem',
      fontWeight: 400,
      lineHeight: 1.5,
      letterSpacing: '0.01em',
    },
    button: {
      fontSize: '0.875rem',
      fontWeight: 500,
      textTransform: 'none' as const,
      letterSpacing: '0.01em',
    },
    overline: {
      fontSize: '0.6875rem',
      fontWeight: 600,
      textTransform: 'uppercase' as const,
      letterSpacing: '0.08em',
    },
  },
  shape: { borderRadius: tokens.shape.borderRadius },
  shadows: softShadows,
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          scrollbarWidth: 'thin',
          '&::-webkit-scrollbar': { width: 6, height: 6 },
          '&::-webkit-scrollbar-track': { background: 'transparent' },
          '&::-webkit-scrollbar-thumb': {
            borderRadius: 3,
            background: alpha(tokens.colors.lightTextSecondary, 0.3),
          },
        },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          borderRadius: tokens.shape.borderRadiusPill,
          padding: '8px 20px',
          fontWeight: 500,
          transition: 'all 0.2s ease',
          '&:hover': { transform: 'translateY(-1px)' },
          '&:active': { transform: 'translateY(0)' },
        },
        containedPrimary: {
          background: tokens.colors.primary,
          '&:hover': {
            background: tokens.colors.primaryDark,
            boxShadow: tokens.shadows.glow,
          },
        },
        containedSecondary: {
          background: tokens.colors.secondary,
          '&:hover': {
            background: tokens.colors.secondaryDark,
            boxShadow: tokens.shadows.blueGlow,
          },
        },
        outlined: { borderWidth: 1.5, '&:hover': { borderWidth: 1.5 } },
        sizeSmall: { padding: '4px 14px', fontSize: '0.8125rem' },
        sizeLarge: { padding: '12px 28px', fontSize: '1rem' },
      },
    },
    MuiCard: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          borderRadius: tokens.shape.borderRadiusLg,
          border: `1px solid ${tokens.colors.lightBorder}`,
          transition: 'all 0.25s ease',
          '&:hover': { boxShadow: tokens.shadows.soft4 },
        },
      },
    },
    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          borderRadius: tokens.shape.borderRadius,
          backgroundImage: 'none',
        },
      },
    },
    MuiTextField: {
      defaultProps: { variant: 'outlined', size: 'small' },
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 10,
            transition: 'all 0.2s ease',
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: tokens.colors.blue,
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderWidth: 1.5,
              borderColor: tokens.colors.pink,
              boxShadow: `0 0 0 3px ${alpha(tokens.colors.pink, 0.1)}`,
            },
          },
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: { root: { borderRadius: 10 } },
    },
    MuiDrawer: {
      styleOverrides: { paper: { borderRadius: 0, borderRight: 'none' } },
    },
    MuiAppBar: {
      defaultProps: { elevation: 0 },
      styleOverrides: { root: { backgroundImage: 'none' } },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: tokens.shape.borderRadiusLg,
          boxShadow: tokens.shadows.soft16,
        },
      },
    },
    MuiDialogActions: {
      styleOverrides: { root: { padding: '16px 24px' } },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none' as const,
          fontWeight: 500,
          borderRadius: tokens.shape.borderRadiusPill,
          minHeight: 36,
          padding: '6px 16px',
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        indicator: {
          borderRadius: tokens.shape.borderRadiusPill,
          height: 36,
          zIndex: 0,
          opacity: 0.12,
        },
        root: { minHeight: 36 },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: tokens.shape.borderRadiusPill,
          fontWeight: 500,
          fontSize: '0.75rem',
        },
      },
    },
    MuiSwitch: {
      styleOverrides: {
        root: { width: 42, height: 24, padding: 0 },
        switchBase: {
          padding: 2,
          '&.Mui-checked': {
            transform: 'translateX(18px)',
            '& + .MuiSwitch-track': { opacity: 1 },
            '& .MuiSwitch-thumb': { backgroundColor: '#37B7EA' },
          },
        },
        thumb: { width: 20, height: 20, boxShadow: tokens.shadows.soft1 },
        track: { borderRadius: 12, opacity: 0.3 },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          borderRadius: 8,
          fontSize: '0.75rem',
          fontWeight: 500,
          padding: '6px 12px',
        },
      },
    },
    MuiAvatar: {
      styleOverrides: { root: { fontSize: '0.875rem', fontWeight: 600 } },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          '&.Mui-selected': {
            backgroundColor: alpha(tokens.colors.pink, 0.1),
            '&:hover': { backgroundColor: alpha(tokens.colors.pink, 0.15) },
          },
        },
      },
    },
    MuiDivider: {
      styleOverrides: { root: { borderColor: tokens.colors.lightBorder } },
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          borderRadius: tokens.shape.borderRadius,
          boxShadow: tokens.shadows.soft8,
          border: `1px solid ${tokens.colors.lightBorder}`,
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: { borderRadius: 8, margin: '2px 6px', padding: '8px 12px' },
      },
    },
    MuiAccordion: {
      defaultProps: { elevation: 0, disableGutters: true },
      styleOverrides: {
        root: {
          border: 'none',
          borderRadius: `${tokens.shape.borderRadius}px !important`,
          '&:before': { display: 'none' },
        },
      },
    },
    MuiAccordionSummary: {
      styleOverrides: {
        root: {
          borderRadius: tokens.shape.borderRadius,
          minHeight: 40,
          '&.Mui-expanded': { minHeight: 40 },
        },
        content: { margin: '8px 0', '&.Mui-expanded': { margin: '8px 0' } },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: { borderRadius: 10, transition: 'all 0.2s ease' },
      },
    },
    MuiBadge: {
      styleOverrides: { badge: { fontWeight: 600, fontSize: '0.6875rem' } },
    },
    MuiAlert: {
      styleOverrides: { root: { borderRadius: tokens.shape.borderRadius } },
    },
    MuiSkeleton: {
      styleOverrides: { root: { borderRadius: 8 } },
    },
  },
});

export { tokens };
export default theme;
