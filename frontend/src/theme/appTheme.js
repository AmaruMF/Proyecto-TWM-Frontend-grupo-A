import { createTheme } from '@mui/material/styles';

const appTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#0B0829',
      dark: '#050318',
      light: '#8FA0D8',
      contrastText: '#F9DFC6',
    },
    secondary: {
      main: '#FF8400',
      dark: '#D66E00',
      light: '#F9DFC6',
      contrastText: '#0B0829',
    },
    background: {
      default: '#F9DFC6',
      paper: '#FFF8F0',
    },
    text: {
      primary: '#0B0829',
      secondary: '#49445F',
    },
    divider: 'rgba(11, 8, 41, 0.16)',
    success: {
      main: '#8FA0D8',
      contrastText: '#0B0829',
    },
    warning: {
      main: '#FF8400',
      contrastText: '#0B0829',
    },
  },
  shape: {
    borderRadius: 8,
  },
  typography: {
    fontFamily: ['Inter', 'Segoe UI', 'Roboto', 'Arial', 'sans-serif'].join(','),
    h1: {
      fontSize: '2.6rem',
      fontWeight: 800,
      lineHeight: 1.08,
    },
    h2: {
      fontSize: '1.9rem',
      fontWeight: 800,
      lineHeight: 1.15,
    },
    h3: {
      fontSize: '1.35rem',
      fontWeight: 700,
    },
    button: {
      fontWeight: 700,
      textTransform: 'none',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          minHeight: 42,
          boxShadow: 'none',
        },
        contained: {
          '&:hover': {
            boxShadow: '0 12px 24px rgba(11, 8, 41, 0.18)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          borderColor: 'rgba(11, 8, 41, 0.15)',
        },
      },
    },
    MuiCheckbox: {
      styleOverrides: {
        root: {
          color: '#8FA0D8',
          '&.Mui-checked': {
            color: '#FF8400',
          },
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: '#FFF8F0',
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: '#8FA0D8',
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: '#FF8400',
          },
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        size: 'small',
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          color: '#F9DFC6',
          fontWeight: 700,
          backgroundColor: '#0B0829',
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          backgroundColor: '#FFF8F0',
        },
      },
    },
  },
});

export default appTheme;
