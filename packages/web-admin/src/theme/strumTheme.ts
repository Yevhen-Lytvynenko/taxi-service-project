import { createTheme } from '@mui/material/styles';

// Палітра світлої теми
const palette = {
  black: '#1a1a1a',
  white: '#ffffff',
  yellow: '#ffd451',
  lightGray: '#f5f5f5',
  paper: '#ffffff',
};

export const strumTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: palette.yellow,
      contrastText: palette.black,
    },
    secondary: {
      main: palette.black,
    },
    background: {
      default: palette.lightGray,
      paper: palette.paper,
    },
    text: {
      primary: palette.black,
      secondary: 'rgba(0, 0, 0, 0.6)',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontWeight: 700 },
    h2: { fontWeight: 700 },
    h3: { fontWeight: 700 },
    h4: { fontWeight: 700, letterSpacing: '1px' }, // Заголовки як на лого "Strum"
    button: { fontWeight: 600, textTransform: 'uppercase' },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 0, // Брутальний стиль (квадратні кнопки)
          padding: '10px 20px',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none', // Прибираємо градієнти Material UI
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: palette.paper,
          borderBottom: `2px solid ${palette.yellow}`,
          color: palette.black,
        },
      },
    },
  },
});