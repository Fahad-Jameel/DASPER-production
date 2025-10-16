import { DefaultTheme } from 'react-native-paper';

export const colors = {
  primary: '#1a237e',      // Deep blue
  primaryDark: '#000051',  // Darker blue
  primaryLight: '#534bae', // Lighter blue
  secondary: '#ff6b35',    // Orange
  secondaryDark: '#c73e1d', // Darker orange
  secondaryLight: '#ff9f66', // Lighter orange
  accent: '#00e676',       // Green
  accentDark: '#00c851',   // Darker green
  accentLight: '#69f0ae',  // Lighter green
  error: '#f44336',        // Red
  warning: '#ff9800',      // Amber
  info: '#2196f3',         // Blue
  success: '#4caf50',      // Green
  
  // Grays
  surface: '#ffffff',
  background: '#f8f9fa',
  onSurface: '#000000',
  onBackground: '#000000',
  
  // Dark theme colors
  surfaceDark: '#121212',
  backgroundDark: '#000000',
  onSurfaceDark: '#ffffff',
  onBackgroundDark: '#ffffff',
  
  // Text colors
  text: '#212529',
  textSecondary: '#6c757d',
  textLight: '#ffffff',
  textDark: '#000000',
  
  // Border colors
  border: '#e9ecef',
  borderDark: '#343a40',
  
  // Input colors
  inputBackground: '#f8f9fa',
  inputBackgroundDark: '#2d2d2d',
  
  // Status colors
  online: '#28a745',
  offline: '#6c757d',
  busy: '#dc3545',
  away: '#ffc107',
  
  // Gradients
  primaryGradient: ['#1a237e', '#3f51b5'],
  secondaryGradient: ['#ff6b35', '#ff9800'],
  accentGradient: ['#00e676', '#4caf50'],
  darkGradient: ['#000051', '#1a237e'],
  
  // Transparent colors
  overlay: 'rgba(0,0,0,0.5)',
  overlayLight: 'rgba(0,0,0,0.3)',
  overlayDark: 'rgba(0,0,0,0.7)',
  
  // Card colors
  cardBackground: '#ffffff',
  cardBackgroundDark: '#1e1e1e',
  cardBorder: '#e0e0e0',
  cardBorderDark: '#333333',
  
  // Severity colors for damage assessment
  minimal: '#4caf50',     // Green
  moderate: '#ff9800',    // Orange
  severe: '#ff5722',      // Deep orange
  destructive: '#f44336', // Red
  
  // Chart colors
  chartPrimary: '#1a237e',
  chartSecondary: '#ff6b35',
  chartAccent: '#00e676',
  chartNeutral: '#9e9e9e',
};

export const spacing = {
  xs: 2,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 24,
};

export const borderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  round: 50,
};

export const typography = {
  h1: {
    fontSize: 24,
    fontWeight: 'bold',
    lineHeight: 32,
    fontFamily: 'Inter-Bold',
  },
  h2: {
    fontSize: 20,
    fontWeight: 'bold',
    lineHeight: 28,
    fontFamily: 'Inter-Bold',
  },
  h3: {
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 24,
    fontFamily: 'Inter-SemiBold',
  },
  h4: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
    fontFamily: 'Inter-SemiBold',
  },
  h5: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
    fontFamily: 'Inter-SemiBold',
  },
  h6: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 18,
    fontFamily: 'Inter-SemiBold',
  },
  body: {
    fontSize: 14,
    fontWeight: 'normal',
    lineHeight: 20,
    fontFamily: 'Inter-Regular',
  },
  body1: {
    fontSize: 14,
    fontWeight: 'normal',
    lineHeight: 20,
    fontFamily: 'Inter-Regular',
  },
  body2: {
    fontSize: 12,
    fontWeight: 'normal',
    lineHeight: 18,
    fontFamily: 'Inter-Regular',
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
    fontFamily: 'Inter-Medium',
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 18,
    fontFamily: 'Inter-SemiBold',
  },
  caption: {
    fontSize: 10,
    fontWeight: 'normal',
    lineHeight: 14,
    fontFamily: 'Inter-Regular',
  },
  button: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 18,
    fontFamily: 'Inter-SemiBold',
  },
};

export const lightTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.primary,
    accent: colors.accent,
    background: colors.background,
    surface: colors.surface,
    text: colors.text,
    onSurface: colors.onSurface,
    onBackground: colors.onBackground,
    placeholder: colors.textSecondary,
    backdrop: colors.overlay,
    notification: colors.secondary,
    error: colors.error,
    
    // Custom colors
    secondary: colors.secondary,
    success: colors.success,
    warning: colors.warning,
    info: colors.info,
    border: colors.border,
    cardBackground: colors.cardBackground,
    textSecondary: colors.textSecondary,
  },
  spacing,
  borderRadius,
  typography,
  isDark: false,
};

export const darkTheme = {
  ...DefaultTheme,
  dark: true,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.primaryLight,
    accent: colors.accentLight,
    background: colors.backgroundDark,
    surface: colors.surfaceDark,
    text: colors.textLight,
    onSurface: colors.onSurfaceDark,
    onBackground: colors.onBackgroundDark,
    placeholder: colors.textSecondary,
    backdrop: colors.overlayDark,
    notification: colors.secondaryLight,
    error: colors.error,
    
    // Custom colors
    secondary: colors.secondaryLight,
    success: colors.success,
    warning: colors.warning,
    info: colors.info,
    border: colors.borderDark,
    cardBackground: colors.cardBackgroundDark,
    textSecondary: colors.textSecondary,
  },
  spacing,
  borderRadius,
  typography,
  isDark: true,
};

export const shadowStyles = {
  small: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.18,
    shadowRadius: 1.0,
    elevation: 1,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.23,
    shadowRadius: 2.62,
    elevation: 4,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.30,
    shadowRadius: 4.65,
    elevation: 8,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.37,
    shadowRadius: 7.49,
    elevation: 12,
  },
};

export default {
  colors,
  spacing,
  borderRadius,
  typography,
  lightTheme,
  darkTheme,
  shadowStyles,
};