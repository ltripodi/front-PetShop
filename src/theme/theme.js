import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: { main: '#2f6b57', dark: '#214e40', light: '#dcece1', contrastText: '#ffffff' },
    secondary: { main: '#a75a32', dark: '#824225', light: '#f5e1d2', contrastText: '#ffffff' },
    background: { default: '#f8f7f1', paper: '#ffffff' },
    text: { primary: '#20372e', secondary: '#5c6c62' },
    error: { main: '#b23e3e' },
    warning: { main: '#a96312' },
    success: { main: '#2f6b57' },
    divider: '#dfe7dd',
  },
  typography: {
    fontFamily: '"Trebuchet MS", "Segoe UI", sans-serif',
    h1: { fontSize: 'clamp(2.65rem, 6vw, 5rem)', fontWeight: 700, lineHeight: 1.08, letterSpacing: '-0.045em' },
    h2: { fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 700, lineHeight: 1.15, letterSpacing: '-0.035em' },
    h3: { fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 700, lineHeight: 1.2, letterSpacing: '-0.025em' },
    h4: { fontWeight: 700, letterSpacing: '-0.025em' },
    h5: { fontWeight: 700 },
    h6: { fontWeight: 700 },
    body1: { lineHeight: 1.7 },
    body2: { lineHeight: 1.65 },
    button: { fontWeight: 700, textTransform: 'none' },
  },
  shape: { borderRadius: 12 },
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: { root: { borderRadius: 999, paddingInline: 22 } },
    },
    MuiCssBaseline: {
      styleOverrides: { body: { margin: 0 }, '#root': { minHeight: '100vh' } },
    },
  },
});

export default theme;
